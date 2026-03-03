from fastapi import APIRouter, Query, HTTPException
from database import (
    _is_demo, demo_add, demo_list, demo_get,
    rtdb_push, rtdb_get_all, rtdb_as_list, rtdb_get_one
)
from services.news_service import fetch_news
from services.ml_service import classify, extract_locality
from services.openai_service import summarize_and_suggest
from models.schemas import ClassifyRequest, ClassifyResponse
from datetime import datetime

router = APIRouter(prefix="/api/news", tags=["news"])

# Primary filter: ENV_KEYWORDS in news_service.py rejects non-environmental articles before ML.
# Secondary filter: ML confidence must be >= 0.20 (confirmation pass only).
MIN_CONFIDENCE = 0.07


@router.get("")
async def get_news(
    category: str = Query(default=""),
    locality: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, le=50),
    search: str = Query(default=""),
    time_filter: str = Query(default=""),
):
    offset = (page - 1) * limit
    filters = {}
    if category and category != "all":
        filters["category"] = category
    if locality:
        filters["locality"] = locality

    if _is_demo():
        articles, total = demo_list("news_articles", filters, limit=limit, offset=offset, search_query=search, time_filter=time_filter)
    else:
        raw = rtdb_get_all("news_articles")
        articles, total = rtdb_as_list(raw, filters=filters, sort_key="publishedAt",
                                       offset=offset, limit=limit, search_query=search, time_filter=time_filter)

    # Filter out any articles below the minimum ML confidence threshold
    articles = [a for a in articles if float(a.get("confidence", 0)) >= MIN_CONFIDENCE]
    # Recalculate total AFTER filtering so pagination is accurate
    total = len(articles)
    # Apply pagination on filtered results
    articles = articles[offset: offset + limit]

    return {"articles": articles, "total": total, "page": page, "limit": limit}


@router.post("/fetch")
async def fetch_and_classify(
    category: str = Query(default=""),
    locality: str = Query(default=""),
):
    raw_articles = await fetch_news(locality=locality, category=category)
    inserted = 0

    # Get existing URLs to skip duplicates
    if _is_demo():
        existing_all, _ = demo_list("news_articles", limit=1000)
        existing_urls = {a.get("url") for a in existing_all}
    else:
        raw = rtdb_get_all("news_articles")
        existing_urls = {v.get("url") for v in raw.values()} if raw else set()

    for article in raw_articles:
        title = article.get("title", "") or ""
        description = article.get("description", "") or ""
        url = article.get("url", "")

        if url in existing_urls:
            continue

        classification = classify(title, description)

        # Skip articles below minimum confidence — not environmental enough
        if classification["confidence"] < MIN_CONFIDENCE:
            continue

        locality_extracted = extract_locality(title + " " + description)
        ai_result = await summarize_and_suggest(title, description, classification["category"])
        now = datetime.utcnow().isoformat()

        doc = {
            "title": title,
            "description": description,
            "url": url,
            "urlToImage": article.get("urlToImage"),
            "source": article.get("source", {}).get("name", "Unknown"),
            "publishedAt": article.get("publishedAt", now),
            "category": classification["category"],
            "confidence": classification["confidence"],
            "locality": locality_extracted,
            "summary": ai_result["summary"],
            "actions": ai_result["actions"],
            "fetchedAt": now,
        }

        if _is_demo():
            demo_add("news_articles", doc)
        else:
            rtdb_push("news_articles", doc)

        existing_urls.add(url)
        inserted += 1

    return {"message": f"Fetched and classified {inserted} new articles", "total_raw": len(raw_articles)}


@router.get("/stats")
async def get_stats():
    if _is_demo():
        docs, _ = demo_list("news_articles", limit=1000)
    else:
        raw = rtdb_get_all("news_articles")
        docs = [{"id": k, **v} for k, v in raw.items()] if raw else []

    dist: dict[str, int] = {}
    for d in docs:
        cat = d.get("category", "general")
        dist[cat] = dist.get(cat, 0) + 1
    return {"distribution": dist, "total": len(docs)}


@router.get("/{article_id}")
async def get_article(article_id: str):
    if _is_demo():
        doc = demo_get("news_articles", article_id)
    else:
        doc = rtdb_get_one("news_articles", article_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found")
    return doc


@router.post("/classify", response_model=ClassifyResponse)
async def classify_text(req: ClassifyRequest):
    result = classify(req.text, "")
    return ClassifyResponse(category=result["category"], confidence=result["confidence"])
