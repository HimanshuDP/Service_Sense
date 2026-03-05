from fastapi import APIRouter, Query, HTTPException, UploadFile, File
from database import (
    _is_demo, demo_add, demo_list, demo_get, demo_update,
    rtdb_push, rtdb_get_all, rtdb_get_one, rtdb_update, rtdb_as_list
)
from models.schemas import CommunityPostCreate, CommentRequest, LikeRequest, ImpactUpdateRequest
from services.openai_service import verify_post
from datetime import datetime

router = APIRouter(prefix="/api/community", tags=["community"])


def _credibility_score(likes: int, ai_status: str) -> float:
    ai_weight = {"valid": 0.5, "needs_review": 0.2, "invalid": 0.0}.get(ai_status, 0.2)
    like_score = min(likes / 50.0, 0.3)
    return round(ai_weight + like_score, 3)


@router.post("/posts")
async def create_post(post: CommunityPostCreate):
    verification = await verify_post(post.title, post.description, post.category)
    ai_status = verification["status"]
    now = datetime.utcnow().isoformat()

    doc_data = {
        "userId": post.userId,
        "userName": post.userName,
        "title": post.title,
        "description": post.description,
        "category": post.category,
        "locality": post.locality,
        "mediaUrls": post.mediaUrls,
        "likes": 0,
        "likedBy": [],
        "comments": [],
        "aiVerification": ai_status,
        "verificationReason": verification.get("reason", ""),
        "credibilityScore": _credibility_score(0, ai_status),
        "createdAt": now,
        "updates": [],
        "isAnonymous": post.isAnonymous,
    }

    if _is_demo():
        doc_id = demo_add("community_posts", doc_data)
    else:
        doc_id = rtdb_push("community_posts", doc_data)

    return {"id": doc_id, **doc_data}


@router.get("/posts")
async def get_posts(
    category: str = Query(default=""),
    locality: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, le=50),
):
    offset = (page - 1) * limit
    filters = {}
    if category and category != "all":
        filters["category"] = category
    if locality:
        filters["locality"] = locality

    if _is_demo():
        posts, total = demo_list("community_posts", filters, limit=limit, offset=offset, sort_key="createdAt")
    else:
        raw = rtdb_get_all("community_posts")
        posts, total = rtdb_as_list(raw, filters=filters, sort_key="createdAt",
                                    offset=offset, limit=limit)

    for idx, p in enumerate(posts):
        if p.get("isAnonymous"):
            posts[idx]["userId"] = None
            posts[idx]["userName"] = "Anonymous"

    return {"posts": posts, "total": total, "page": page, "limit": limit}


@router.put("/posts/{post_id}/like")
async def like_post(post_id: str, req: LikeRequest):
    if _is_demo():
        doc = demo_get("community_posts", post_id)
    else:
        doc = rtdb_get_one("community_posts", post_id)

    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")

    liked_by: list = doc.get("likedBy") or []
    likes: int = doc.get("likes", 0)

    if req.userId in liked_by:
        liked_by.remove(req.userId)
        likes -= 1
        action = "unliked"
    else:
        liked_by.append(req.userId)
        likes += 1
        action = "liked"

    score = _credibility_score(likes, doc["aiVerification"])
    updates = {"likedBy": liked_by, "likes": likes, "credibilityScore": score}

    if _is_demo():
        demo_update("community_posts", post_id, updates)
    else:
        rtdb_update("community_posts", post_id, updates)

    return {"action": action, "likes": likes, "credibilityScore": score}


@router.post("/posts/{post_id}/comment")
async def add_comment(post_id: str, req: CommentRequest):
    if _is_demo():
        doc = demo_get("community_posts", post_id)
    else:
        doc = rtdb_get_one("community_posts", post_id)

    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = {
        "userId": req.userId,
        "userName": req.userName,
        "text": req.text,
        "createdAt": datetime.utcnow().isoformat(),
    }
    comments = list(doc.get("comments") or [])
    comments.append(comment)

    if _is_demo():
        demo_update("community_posts", post_id, {"comments": comments})
    else:
        rtdb_update("community_posts", post_id, {"comments": comments})

    return {"message": "Comment added", "comment": comment}


@router.post("/posts/{post_id}/update")
async def add_impact_update(post_id: str, req: ImpactUpdateRequest):
    if _is_demo():
        doc = demo_get("community_posts", post_id)
    else:
        doc = rtdb_get_one("community_posts", post_id)

    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")

    entry = {
        "text": req.text,
        "mediaUrls": req.mediaUrls,
        "createdAt": datetime.utcnow().isoformat(),
    }
    updates_list = list(doc.get("updates") or [])
    updates_list.append(entry)

    if _is_demo():
        demo_update("community_posts", post_id, {"updates": updates_list})
    else:
        rtdb_update("community_posts", post_id, {"updates": updates_list})

    return {"message": "Impact update added", "update": entry}


# ──────────────────────────────────────────────────────────────────────────────
# Image Classification  —  Environmental Verification Layer
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/classify-image")
async def classify_image(file: UploadFile = File(...)):
    """
    Verify whether an uploaded image is related to an environmental issue.

    - Accepts: JPEG / PNG / WebP images
    - Returns: predicted category, confidence score, and accept/reject decision

    Decision logic:
      accepted = True  →  category in {air, land, water, waste}
                           AND confidence >= 0.70
      accepted = False →  category == 'general'
                           OR confidence < 0.70
    """
    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=415,
            detail="Only image files (JPEG, PNG, WebP) are accepted.",
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Lazy import — model loads only when first request arrives
    try:
        from ml.image_classifier.predict import predict_image
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Image classification model is not yet trained. "
                "Run: python ml/image_classifier/train_image_model.py"
            ),
        ) from exc
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Image classification dependencies not installed: {exc}",
        ) from exc

    try:
        result = predict_image(image_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not process the image: {exc}",
        ) from exc

    return {
        "category":   result["category"],
        "confidence": result["confidence"],
        "accepted":   result["accepted"],
        "all_scores": result["all_scores"],
        "message": (
            f"✅ Image accepted as '{result['category']}' "
            f"(confidence: {result['confidence']*100:.1f}%)"
            if result["accepted"] else
            f"❌ Image rejected — "
            f"category: '{result['category']}', "
            f"confidence: {result['confidence']*100:.1f}%"
        ),
    }
