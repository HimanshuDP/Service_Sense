from fastapi import APIRouter, Query
from database import _is_demo, demo_list, rtdb_get_all
from datetime import datetime, timezone

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

LOCALITY_COORDS = {
    "Delhi":     (28.6139, 77.2090), "Mumbai":    (19.0760, 72.8777),
    "Bangalore": (12.9716, 77.5946), "Chennai":   (13.0827, 80.2707),
    "Kolkata":   (22.5726, 88.3639), "Pune":      (18.5204, 73.8567),
    "Hyderabad": (17.3850, 78.4867), "Ahmedabad": (23.0225, 72.5714),
    "Jaipur":    (26.9124, 75.7873), "Lucknow":   (26.8467, 80.9462),
}


def _get_all_docs(collection: str) -> list:
    if _is_demo():
        docs, _ = demo_list(collection, limit=2000)
        return docs
    raw = rtdb_get_all(collection) or {}
    return [{"id": k, **v} for k, v in raw.items()]


@router.get("/trends")
async def get_monthly_trends(months: int = Query(default=6, ge=1, le=12)):
    news_docs  = _get_all_docs("news_articles")
    post_docs  = _get_all_docs("community_posts")
    all_docs   = news_docs + post_docs

    now = datetime.now(timezone.utc)
    result = []

    for i in range(months - 1, -1, -1):
        # Approximate month boundary
        year  = now.year - ((now.month - 1 - (months - 1 - i)) < 0)
        month = (now.month - i - 1) % 12 + 1
        label = datetime(year, month, 1).strftime("%b %Y")
        month_str = f"{year}-{month:02d}"

        counts = {"month": label, "air": 0, "water": 0, "land": 0, "waste": 0, "general": 0}
        for doc in all_docs:
            ts = doc.get("publishedAt") or doc.get("createdAt") or ""
            if ts[:7] == month_str:
                cat = doc.get("category", "general")
                if cat in counts:
                    counts[cat] += 1
        result.append(counts)

    # If totally empty, return mock
    if all(sum(r[c] for c in ["air","water","land","waste","general"]) == 0 for r in result):
        result = _mock_trends(months)

    return {"trends": result}


@router.get("/heatmap")
async def get_heatmap():
    news_docs = _get_all_docs("news_articles")
    post_docs = _get_all_docs("community_posts")
    all_docs  = news_docs + post_docs

    locality_data: dict[str, dict] = {}
    for doc in all_docs:
        loc = doc.get("locality")
        cat = doc.get("category", "general")
        if not loc:
            continue
        if loc not in locality_data:
            locality_data[loc] = {"count": 0, "category": cat}
        locality_data[loc]["count"] += 1

    points = []
    for loc, data in locality_data.items():
        coords = LOCALITY_COORDS.get(loc)
        if coords:
            points.append({"locality": loc, "lat": coords[0], "lng": coords[1],
                            "count": data["count"], "category": data["category"]})

    return {"points": points or _mock_heatmap()}


@router.get("/summary")
async def get_summary():
    news_docs = _get_all_docs("news_articles")
    post_docs = _get_all_docs("community_posts")
    valid     = [p for p in post_docs if p.get("aiVerification") == "valid"]
    locs      = {d.get("locality") for d in news_docs + post_docs if d.get("locality")}

    return {
        "totalNews":          len(news_docs) or 48,
        "totalCommunityPosts":len(post_docs) or 12,
        "validatedPosts":     len(valid) or 9,
        "localitiesCovered":  len(locs) or 8,
        "categoriesActive":   5,
    }


def _mock_trends(months: int) -> list:
    import random; random.seed(42)
    labels = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"]
    return [{"month": lbl, "air": random.randint(5,20), "water": random.randint(3,15),
             "land": random.randint(2,12), "waste": random.randint(4,16), "general": random.randint(6,18)}
            for lbl in labels[-months:]]


def _mock_heatmap() -> list:
    return [
        {"locality":"Delhi",     "lat":28.6139,"lng":77.2090,"count":18,"category":"air"},
        {"locality":"Mumbai",    "lat":19.0760,"lng":72.8777,"count":14,"category":"water"},
        {"locality":"Bangalore", "lat":12.9716,"lng":77.5946,"count":9, "category":"waste"},
        {"locality":"Chennai",   "lat":13.0827,"lng":80.2707,"count":7, "category":"water"},
        {"locality":"Kolkata",   "lat":22.5726,"lng":88.3639,"count":11,"category":"air"},
        {"locality":"Pune",      "lat":18.5204,"lng":73.8567,"count":6, "category":"land"},
        {"locality":"Hyderabad", "lat":17.3850,"lng":78.4867,"count":8, "category":"waste"},
        {"locality":"Jaipur",    "lat":26.9124,"lng":75.7873,"count":5, "category":"land"},
    ]
