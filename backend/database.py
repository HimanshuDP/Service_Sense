"""
Firebase Admin SDK — Realtime Database backend.

FREE on Spark plan: https://firebase.google.com/pricing
No billing required. 1 GB storage, 10 GB/month download.

Collections stored as JSON trees:
  /news_articles/{push_id}  → article data
  /community_posts/{push_id} → post data
"""
import os
import uuid

_DEMO_MODE = False
_db_ref = None  # Root reference for Realtime Database

# ─── In-memory demo fallback ──────────────────────────────────────────────────
_demo_store: dict[str, list] = {
    "news_articles": [],
    "community_posts": [],
    "users": [],
}


def _is_demo() -> bool:
    return _DEMO_MODE


def init_firebase():
    global _db_ref, _DEMO_MODE
    from config import settings

    key_path = settings.firebase_service_account_key
    db_url = settings.firebase_database_url

    if not os.path.exists(key_path):
        print(f"⚠️  Firebase service account key not found at: {key_path}")
        print("🟡 Running in DEMO MODE (in-memory). Data resets on server restart.")
        _DEMO_MODE = True
        _seed_demo_data()
        return

    if not db_url:
        print("⚠️  FIREBASE_DATABASE_URL not set in .env")
        print("🟡 Running in DEMO MODE.")
        _DEMO_MODE = True
        _seed_demo_data()
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, db

        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred, {"databaseURL": db_url})
        _db_ref = db.reference("/")
        _DEMO_MODE = False
        print(f"✅ Connected to Firebase Realtime Database: {db_url}")
    except Exception as e:
        print(f"⚠️  Firebase connection failed: {e}")
        print("🟡 Falling back to DEMO MODE.")
        _DEMO_MODE = True
        _seed_demo_data()


def get_ref(path: str = "/"):
    """Get a Realtime Database reference at the given path."""
    if _DEMO_MODE:
        raise RuntimeError("In demo mode — use demo_* helpers instead.")
    from firebase_admin import db
    return db.reference(path)


# ─── Realtime Database helpers ────────────────────────────────────────────────

def rtdb_push(collection: str, data: dict) -> str:
    """Push a new record. Returns the auto-generated key."""
    ref = get_ref(f"/{collection}")
    new_ref = ref.push(data)
    return new_ref.key


def rtdb_get_all(collection: str) -> dict:
    """Returns {key: data} dict or {}."""
    return get_ref(f"/{collection}").get() or {}


def rtdb_get_one(collection: str, key: str) -> dict | None:
    data = get_ref(f"/{collection}/{key}").get()
    if data:
        data["id"] = key
    return data


def rtdb_update(collection: str, key: str, updates: dict):
    get_ref(f"/{collection}/{key}").update(updates)


def rtdb_as_list(raw: dict, filters: dict = {}, sort_key: str = "publishedAt",
                 reverse: bool = True, offset: int = 0, limit: int = 50,
                 search_query: str = "", time_filter: str = "") -> tuple[list, int]:
    """Convert {key: data} to a filtered, sorted, paginated list."""
    items = [{"id": k, **v} for k, v in raw.items()]
    for fk, fv in filters.items():
        if fv:
            items = [i for i in items if i.get(fk) == fv]
            
    if search_query:
        sq = search_query.lower()
        items = [i for i in items if sq in i.get("title", "").lower() or sq in i.get("description", "").lower() or sq in i.get("summary", "").lower()]

    if time_filter and time_filter != "all":
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        if time_filter == "24h":
            cutoff = now - datetime.timedelta(hours=24)
        elif time_filter == "7d":
            cutoff = now - datetime.timedelta(days=7)
        elif time_filter == "30d":
            cutoff = now - datetime.timedelta(days=30)
        else:
            cutoff = None
        
        if cutoff:
            filtered = []
            for i in items:
                pub = i.get(sort_key) or i.get("createdAt")
                if pub:
                    try:
                        if pub.endswith("Z"): pub = pub[:-1] + "+00:00"
                        pub_dt = datetime.datetime.fromisoformat(pub)
                        if pub_dt.tzinfo is None: pub_dt = pub_dt.replace(tzinfo=datetime.timezone.utc)
                        if pub_dt >= cutoff: filtered.append(i)
                    except:
                        filtered.append(i)
            items = filtered

    total = len(items)
    items.sort(key=lambda x: x.get(sort_key) or "", reverse=reverse)
    return items[offset: offset + limit], total


# ─── Demo-mode helpers ────────────────────────────────────────────────────────

def demo_add(collection: str, data: dict) -> str:
    doc_id = str(uuid.uuid4())[:8]
    _demo_store.setdefault(collection, []).append({"id": doc_id, **data})
    return doc_id


def demo_list(collection: str, filters: dict = {}, limit: int = 50, offset: int = 0,
              sort_key: str = "publishedAt", search_query: str = "", time_filter: str = "") -> tuple[list, int]:
    docs = list(_demo_store.get(collection, []))
    for k, v in filters.items():
        if v:
            docs = [d for d in docs if d.get(k) == v]
            
    if search_query:
        sq = search_query.lower()
        docs = [i for i in docs if sq in i.get("title", "").lower() or sq in i.get("description", "").lower() or sq in i.get("summary", "").lower()]

    if time_filter and time_filter != "all":
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        if time_filter == "24h":
            cutoff = now - datetime.timedelta(hours=24)
        elif time_filter == "7d":
            cutoff = now - datetime.timedelta(days=7)
        elif time_filter == "30d":
            cutoff = now - datetime.timedelta(days=30)
        else:
            cutoff = None
        
        if cutoff:
            filtered = []
            for i in docs:
                pub = i.get(sort_key) or i.get("createdAt")
                if pub:
                    try:
                        if pub.endswith("Z"): pub = pub[:-1] + "+00:00"
                        pub_dt = datetime.datetime.fromisoformat(pub)
                        if pub_dt.tzinfo is None: pub_dt = pub_dt.replace(tzinfo=datetime.timezone.utc)
                        if pub_dt >= cutoff: filtered.append(i)
                    except:
                        filtered.append(i)
            docs = filtered

    total = len(docs)
    docs.sort(key=lambda d: d.get(sort_key) or d.get("createdAt") or "", reverse=True)
    return docs[offset: offset + limit], total


def demo_get(collection: str, doc_id: str) -> dict | None:
    return next((d for d in _demo_store.get(collection, []) if d.get("id") == doc_id), None)


def demo_update(collection: str, doc_id: str, updates: dict):
    for d in _demo_store.get(collection, []):
        if d.get("id") == doc_id:
            d.update(updates)


def _seed_demo_data():
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    articles = [
        {"title": "Delhi AQI Crosses 400 — Schools Shut", "description": "Air quality in Delhi reached hazardous levels as AQI crossed 400, forcing school closures.", "url": "https://example.com/delhi-aqi", "urlToImage": "https://picsum.photos/seed/air1/800/400", "source": "Times of India", "publishedAt": now, "category": "air", "confidence": 0.94, "locality": "Delhi", "summary": "Delhi AQI hit 400+, schools closed.", "actions": ["Wear N95 mask", "Use air purifier", "Avoid outdoors"], "fetchedAt": now},
        {"title": "Yamuna River Pollution Reaches Critical Levels", "description": "Heavy foam and toxic pollutants in Yamuna as industries discharge untreated effluents.", "url": "https://example.com/yamuna", "urlToImage": "https://picsum.photos/seed/water1/800/400", "source": "Hindustan Times", "publishedAt": now, "category": "water", "confidence": 0.91, "locality": "Delhi", "summary": "Yamuna river shows dangerous foam due to effluents.", "actions": ["Avoid river contact", "Report dumping", "Use filtered water"], "fetchedAt": now},
        {"title": "Mumbai Dharavi Struggles with Plastic Waste", "description": "2,000 tonnes of plastic waste collected daily in Dharavi with inadequate processing.", "url": "https://example.com/dharavi", "urlToImage": "https://picsum.photos/seed/waste1/800/400", "source": "The Hindu", "publishedAt": now, "category": "waste", "confidence": 0.88, "locality": "Mumbai", "summary": "Dharavi faces a plastic waste crisis.", "actions": ["Segregate waste", "Refuse single-use plastics", "Support recycling"], "fetchedAt": now},
        {"title": "Deforestation in Western Ghats Accelerates", "description": "Satellite imagery shows 8,000 hectares of forest cover lost in Western Ghats.", "url": "https://example.com/ghats", "urlToImage": "https://picsum.photos/seed/land1/800/400", "source": "Down to Earth", "publishedAt": now, "category": "land", "confidence": 0.89, "locality": "Bangalore", "summary": "8,000 hectares of forest lost in Western Ghats.", "actions": ["Support afforestation", "Avoid deforestation products", "Report illegal clearing"], "fetchedAt": now},
        {"title": "Groundwater Contamination in Pune Industrial Zone", "description": "Chemical leachate from industrial units contaminated Hadapsar groundwater.", "url": "https://example.com/pune-water", "urlToImage": "https://picsum.photos/seed/water2/800/400", "source": "Maharashtra Times", "publishedAt": now, "category": "water", "confidence": 0.87, "locality": "Pune", "summary": "Industrial chemicals contaminated Pune groundwater.", "actions": ["Use treated water", "Test home supply", "Alert PCMC"], "fetchedAt": now},
        {"title": "Bengaluru Lakes Turn Black Due to Sewage", "description": "Bellandur lake turned black due to untreated sewage overflow.", "url": "https://example.com/blr-lakes", "urlToImage": "https://picsum.photos/seed/water3/800/400", "source": "Deccan Herald", "publishedAt": now, "category": "water", "confidence": 0.92, "locality": "Bangalore", "summary": "Bengaluru's Bellandur polluted by sewage overflow.", "actions": ["Avoid lake proximity", "Support restoration", "Report discharge"], "fetchedAt": now},
    ]
    posts = [
        {"userId": "demo-1", "userName": "Priya Sharma", "title": "Illegal garbage dumping near Powai Lake", "description": "Construction debris and household waste dumped illegally near Powai lake daily.", "category": "waste", "locality": "Mumbai", "imageUrl": None, "likes": 23, "likedBy": [], "comments": [], "aiVerification": "valid", "verificationReason": "Clearly describes an environmental issue.", "credibilityScore": 0.74, "createdAt": now, "updates": []},
        {"userId": "demo-2", "userName": "Rahul Mehta", "title": "Factory discharging black water into canal at night", "description": "Chemical factory near MIDC Andheri discharges untreated wastewater after midnight.", "category": "water", "locality": "Mumbai", "imageUrl": None, "likes": 41, "likedBy": [], "comments": [], "aiVerification": "valid", "verificationReason": "Detailed violation with time and location.", "credibilityScore": 0.85, "createdAt": now, "updates": []},
        {"userId": "demo-3", "userName": "Ananya Iyer", "title": "Open burning of crop stubble in Haryana", "description": "Stubble burning in multiple fields causing dense smog in residential areas.", "category": "air", "locality": "Delhi", "imageUrl": None, "likes": 17, "likedBy": [], "comments": [], "aiVerification": "valid", "verificationReason": "Valid air pollution report.", "credibilityScore": 0.68, "createdAt": now, "updates": []},
    ]
    for a in articles:
        demo_add("news_articles", a)
    for p in posts:
        demo_add("community_posts", p)
    print(f"   Seeded {len(articles)} articles and {len(posts)} posts into demo store.")
