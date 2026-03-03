from openai import AsyncOpenAI
from config import settings

_client: AsyncOpenAI = None

def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        # Groq API — fully compatible with the OpenAI Python SDK
        _client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client

async def summarize_and_suggest(title: str, description: str, category: str) -> dict:
    """
    Generate a concise summary and 3 citizen action suggestions for a news article.
    Falls back to a rule-based response if OpenAI key is unavailable.
    """
    if not settings.openai_api_key or settings.openai_api_key == "your_openai_key_here":
        return _mock_summary(title, category)

    client = _get_client()
    prompt = (
        f"Environmental news ({category} category):\n"
        f"Title: {title}\n"
        f"Details: {description}\n\n"
        "Respond in JSON with two keys:\n"
        "1. 'summary': 2-sentence plain English summary\n"
        "2. 'actions': list of exactly 3 short, practical environment-saving actions a citizen can take to help combat this specific issue\n"
        "Keep responses concise. JSON only, no markdown."
    )

    try:
        print(f"[Groq API] Sending summarize request for '{title}'...")
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=300,
            response_format={"type": "json_object"},
        )
        print(f"[Groq API] Summarize response received for '{title}'")
        import json
        content = response.choices[0].message.content
        result = json.loads(content)
        return {
            "summary": result.get("summary", ""),
            "actions": result.get("actions", [])[:3],
        }
    except Exception as e:
        print(f"OpenAI error: {e}")
        return _mock_summary(title, category)


async def verify_post(title: str, description: str, category: str) -> dict:
    """
    Verify if a community post is environmentally relevant and properly categorized.
    Returns: {status: 'valid'|'needs_review'|'invalid', reason: str}
    """
    if not settings.openai_api_key or settings.openai_api_key == "your_openai_key_here":
        return _mock_verify(title, description)

    client = _get_client()
    prompt = (
        f"Review this community post about environment ({category}):\n"
        f"Title: {title}\n"
        f"Description: {description}\n\n"
        "Answer in JSON with:\n"
        "1. 'status': exactly one of 'valid', 'needs_review', or 'invalid'\n"
        "   valid = clearly environmental and meaningful\n"
        "   needs_review = unclear or borderline environmental\n"
        "   invalid = spam or unrelated to environment\n"
        "2. 'reason': 1-sentence explanation\n"
        "JSON only, no markdown."
    )

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=150,
            response_format={"type": "json_object"},
        )
        import json
        content = response.choices[0].message.content
        result = json.loads(content)
        status = result.get("status", "needs_review")
        if status not in ("valid", "needs_review", "invalid"):
            status = "needs_review"
        return {"status": status, "reason": result.get("reason", "")}
    except Exception as e:
        print(f"OpenAI verification error: {e}")
        return _mock_verify(title, description)


def _mock_summary(title: str, category: str) -> dict:
    """Rule-based mock summary when OpenAI is unavailable."""
    summaries = {
        "air": (
            f"This report highlights a significant air quality issue related to {title.lower()}. "
            "Residents in affected areas are advised to limit outdoor activities.",
            ["Wear an N95 mask when outdoors", "Use indoor air purifiers", "Reduce use of personal vehicles"],
        ),
        "water": (
            f"A water pollution event has been reported regarding {title.lower()}. "
            "Authorities are investigating the source of contamination.",
            ["Use only filtered/bottled water for drinking", "Report illegal dumping to local authorities", "Avoid swimming in affected water bodies"],
        ),
        "land": (
            f"Land and forest degradation is occurring as described in {title.lower()}. "
            "Conservation efforts are urgently needed to prevent further ecosystem damage.",
            ["Participate in local tree-planting drives", "Avoid buying products linked to deforestation", "Report illegal land clearing to forest department"],
        ),
        "waste": (
            f"A waste management concern has emerged regarding {title.lower()}. "
            "Proper disposal and recycling can significantly reduce impact.",
            ["Segregate waste at source into wet/dry/hazardous", "Carry a reusable bag and refuse single-use plastic", "Participate in your locality's waste collection drive"],
        ),
        "general": (
            f"An important environmental development has been reported: {title.lower()}. "
            "Community awareness and action are key to addressing this issue.",
            ["Stay informed about local environmental news", "Join or support a local environmental group", "Reduce your personal carbon footprint daily"],
        ),
    }
    text, actions = summaries.get(category, summaries["general"])
    return {"summary": text, "actions": actions}


def _mock_verify(title: str, description: str) -> dict:
    """Simple keyword-based post verification when OpenAI is unavailable."""
    env_keywords = [
        "pollution", "waste", "forest", "water", "air", "soil", "river",
        "environment", "plastic", "recycle", "flood", "drought", "deforestation",
        "smog", "emission", "toxic", "contamination", "dump", "litter", "aqi",
        "fire", "erosion", "wildlife", "biodiversity", "climate",
    ]
    combined = (title + " " + description).lower()
    matches = sum(1 for kw in env_keywords if kw in combined)

    if matches >= 2 and len(description.split()) >= 10:
        return {"status": "valid", "reason": "Post clearly describes an environmental issue with sufficient detail."}
    elif matches >= 1 or len(description.split()) >= 5:
        return {"status": "needs_review", "reason": "Post has some environmental relevance but needs more detail for verification."}
    else:
        return {"status": "invalid", "reason": "Post does not appear to be related to environmental issues."}
