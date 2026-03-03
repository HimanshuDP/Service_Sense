import httpx
from config import settings

NEWS_API_BASE = "https://newsapi.org/v2/everything"

# These keywords MUST appear in the article title or description for it to be
# considered environmental. This is the first-pass filter before ML classification.
ENV_KEYWORDS = {
    "pollution", "pollutant", "contamination", "contaminated",
    "air quality", "aqi", "smog", "particulate", "pm2.5", "pm10",
    "water pollution", "river pollution", "ocean pollution", "groundwater",
    "deforestation", "forest fire", "wildfire", "forest loss", "tree cover",
    "plastic waste", "plastic pollution", "e-waste", "landfill", "recycling",
    "climate change", "global warming", "greenhouse gas", "carbon emission",
    "biodiversity", "ecosystem", "wildlife", "species extinction",
    "flood", "drought", "soil erosion", "desertification",
    "environmental", "ecology", "green energy", "renewable energy",
    "toxic", "hazardous waste", "chemical spill", "oil spill",
    "carbon footprint", "net zero", "ozone", "acid rain",
}


def _is_environmental(title: str, description: str) -> bool:
    """Check if an article is environmental using keyword matching."""
    text = (title + " " + (description or "")).lower()
    return any(kw in text for kw in ENV_KEYWORDS)


async def fetch_news(locality: str = "", category: str = "") -> list[dict]:
    """Fetch environment news from NewsAPI with strict environmental pre-filtering."""
    if not settings.news_api_key or settings.news_api_key == "your_newsapi_key_here":
        return _mock_news(locality, category)

    # Build a focused query using specific environmental terms
    cat_map = {
        "air": "air pollution OR smog OR AQI OR particulate matter",
        "water": "water pollution OR river contamination OR groundwater",
        "land": "deforestation OR wildfire OR forest loss OR soil erosion",
        "waste": "plastic waste OR landfill OR recycling OR e-waste",
        "general": "climate change OR biodiversity OR carbon emissions OR ecosystem",
    }
    base_query = cat_map.get(category, "pollution OR deforestation OR climate change OR plastic waste OR air quality")

    if locality:
        query = f"({base_query}) AND {locality}"
    else:
        query = base_query

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            NEWS_API_BASE,
            params={
                "q": query,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 30,
                "apiKey": settings.news_api_key,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        articles = data.get("articles", [])

    # Pre-filter: only return articles that contain at least one environmental keyword
    filtered = [
        a for a in articles
        if _is_environmental(a.get("title", "") or "", a.get("description", "") or "")
    ]
    return filtered



def _mock_news(locality: str = "", category: str = "") -> list[dict]:
    """Return realistic mock news when API key is not set.
    Uses UUID-suffixed URLs so each fetch call adds new articles to the store.
    """
    from datetime import datetime, timedelta
    import random
    import uuid

    now = datetime.utcnow()

    # Large pool of 30 realistic articles across all 5 categories
    article_pool = [
        # AIR
        {"title": "Air Pollution Levels Spike in Delhi NCR Region", "description": "PM2.5 particulate matter reaches hazardous levels as AQI crosses 400 mark in the national capital region.", "slug": "air-delhi-ncr", "source": "Environment Today", "hours_ago": 2, "image_seed": "air1"},
        {"title": "Toxic Smog Blankets Mumbai as Festival Season Ends", "description": "Post-Diwali fireworks push Mumbai's AQI into severe category with visibility dropping across the city.", "slug": "air-mumbai-smog", "source": "City Air Report", "hours_ago": 5, "image_seed": "air2"},
        {"title": "Delhi Schools Shut as AQI Reaches Emergency Levels", "description": "Schools and colleges ordered to close as Delhi's air quality enters emergency category for third consecutive day.", "slug": "air-delhi-schools", "source": "Hindustan Times", "hours_ago": 8, "image_seed": "air3"},
        {"title": "Ozone Layer Depletion Worsens Over Polar Regions", "description": "Satellite data reveals ozone hole over Antarctica has expanded to record size this winter season.", "slug": "air-ozone-depletion", "source": "Science Daily", "hours_ago": 12, "image_seed": "air4"},
        {"title": "Crop Stubble Burning Causes Severe Air Pollution in Punjab", "description": "Farmers continue to burn paddy stubble despite government ban, pushing AQI to severe levels across north India.", "slug": "air-stubble-burning", "source": "Tribune India", "hours_ago": 18, "image_seed": "air5"},
        {"title": "Chemical Plant Explosion Releases Toxic Gases in Gujarat", "description": "A chemical plant near Vadodara exploded releasing toxic gases into the atmosphere, causing evacuations.", "slug": "air-gujarat-explosion", "source": "Gujarat Samachar", "hours_ago": 3, "image_seed": "air6"},
        # WATER
        {"title": "Ganges River Pollution Reaches Critical Levels", "description": "Industrial discharge and sewage continue to degrade water quality along the Ganges river system.", "slug": "water-ganges-pollution", "source": "Water Watch", "hours_ago": 6, "image_seed": "water1"},
        {"title": "Groundwater Contamination Detected in Pune Industrial Zones", "description": "Heavy metal traces found in borewells near factories raising alarm for residents depending on well water.", "slug": "water-pune-groundwater", "source": "Ground Report", "hours_ago": 10, "image_seed": "water2"},
        {"title": "Coral Bleaching Event Wipes Out Pacific Reef System", "description": "Ocean temperature rise triggers mass coral bleaching affecting thousands of square kilometres of reef.", "slug": "water-coral-bleaching", "source": "Ocean Watch", "hours_ago": 20, "image_seed": "water3"},
        {"title": "Bengaluru Lakes Turn Black Due to Sewage Overflow", "description": "Bellandur and Varthur lakes in Bengaluru have turned pitch black due to untreated sewage overflow from nearby drains.", "slug": "water-bengaluru-lakes", "source": "Deccan Herald", "hours_ago": 14, "image_seed": "water4"},
        {"title": "Yamuna River Foam Crisis Worsens Ahead of Chhath Puja", "description": "Toxic foam from industrial effluents continues to blanket the Yamuna river as devotees plan to take holy dip.", "slug": "water-yamuna-foam", "source": "Times of India", "hours_ago": 4, "image_seed": "water5"},
        {"title": "Mercury Poisoning Detected in Coastal Fishing Villages", "description": "High levels of mercury found in fish caught near industrial zones along the eastern coastline.", "slug": "water-mercury-fishing", "source": "The Hindu", "hours_ago": 22, "image_seed": "water6"},
        # LAND / FOREST
        {"title": "Amazon Deforestation Hits Record High This Year", "description": "Satellite imagery reveals unprecedented forest loss in the Amazon basin driven by agricultural expansion.", "slug": "land-amazon-deforestation", "source": "Forest Monitor", "hours_ago": 7, "image_seed": "land1"},
        {"title": "Forest Fire Destroys 500 Hectares in Uttarakhand", "description": "Dry weather and human negligence blamed for forest fires spreading across Uttarakhand hillside districts.", "slug": "land-uttarakhand-fire", "source": "Forest Alert", "hours_ago": 15, "image_seed": "land2"},
        {"title": "Deforestation in Western Ghats Accelerates", "description": "Satellite imagery shows 8,000 hectares of forest cover lost in Western Ghats over the last year.", "slug": "land-western-ghats", "source": "Down to Earth", "hours_ago": 9, "image_seed": "land3"},
        {"title": "Illegal Sand Mining Destroying Riverbanks in Madhya Pradesh", "description": "Unregulated sand mining from river beds is causing severe erosion and threatening wildlife habitats.", "slug": "land-sand-mining-mp", "source": "MP Chronicle", "hours_ago": 16, "image_seed": "land4"},
        {"title": "Tiger Reserve Encroachment Threatens Big Cat Habitat", "description": "Illegal settlements and farming have encroached 200 hectares of protected tiger reserve forest land.", "slug": "land-tiger-reserve", "source": "Wildlife India", "hours_ago": 28, "image_seed": "land5"},
        {"title": "Landslides Triggered by Deforestation Kill Dozens in Hills", "description": "Scientists link repeated landslides in hill districts directly to large-scale deforestation over past decade.", "slug": "land-landslide-hills", "source": "Mountain News", "hours_ago": 11, "image_seed": "land6"},
        # WASTE
        {"title": "Plastic Waste Crisis Worsens in Urban India", "description": "Single-use plastic continues to dominate municipal solid waste despite government bans in several states.", "slug": "waste-plastic-urban", "source": "Waste Weekly", "hours_ago": 13, "image_seed": "waste1"},
        {"title": "Electronic Waste Recycling Rates Remain Critically Low", "description": "Only 17% of e-waste generated is formally recycled globally, posing severe toxic risks to environment.", "slug": "waste-ewaste-recycling", "source": "Tech Waste Monitor", "hours_ago": 25, "image_seed": "waste2"},
        {"title": "Zero Waste Initiative Gains Momentum in European Cities", "description": "Over 20 European cities commit to zero-waste targets with aggressive recycling and composting programmes.", "slug": "waste-europe-zerowaste", "source": "Green Cities", "hours_ago": 38, "image_seed": "waste3"},
        {"title": "Mumbai Dharavi Struggles with 2000 Tonnes of Daily Plastic Waste", "description": "Dharavi's informal recycling sector processes vast quantities daily but faces a growing backlog.", "slug": "waste-dharavi-plastic", "source": "The Hindu", "hours_ago": 17, "image_seed": "waste4"},
        {"title": "Hospital Medical Waste Disposal Violations Reported Across Cities", "description": "Inspection drives reveal majority of private hospitals violating biomedical waste disposal norms.", "slug": "waste-medical-hospitals", "source": "Health Monitor", "hours_ago": 30, "image_seed": "waste5"},
        {"title": "Landfill Fire Burns for Days Near Delhi Border", "description": "A massive fire at Ghazipur landfill sends toxic smoke across residential areas for three consecutive days.", "slug": "waste-landfill-fire", "source": "Delhi Times", "hours_ago": 6, "image_seed": "waste6"},
        # GENERAL
        {"title": "Global Temperatures Hit Record High for Sixth Consecutive Month", "description": "Climate scientists warn of accelerating warming trend as extreme weather events increase in frequency.", "slug": "general-climate-record", "source": "Climate Wire", "hours_ago": 14, "image_seed": "gen1"},
        {"title": "Renewable Energy Investment Surpasses Fossil Fuels for First Time", "description": "Global clean energy investment exceeds USD 1 trillion for the first time, driven by solar and wind growth.", "slug": "general-renewable-energy", "source": "Energy Monitor", "hours_ago": 45, "image_seed": "gen2"},
        {"title": "UN Climate Summit Produces New Agreement on Emission Cuts", "description": "195 countries sign a landmark agreement committing to deeper emissions reductions by 2035.", "slug": "general-un-climate-summit", "source": "UN News", "hours_ago": 50, "image_seed": "gen3"},
        {"title": "India Launches National Clean Air Programme for 100 Cities", "description": "Government announces ambitious clean air plan targeting 30% reduction in particulate pollution by 2026.", "slug": "general-india-clean-air", "source": "PIB India", "hours_ago": 32, "image_seed": "gen4"},
        {"title": "Biodiversity Loss Reaches Crisis Point According to UN Report", "description": "A million plant and animal species face extinction, with many lost within decades, says new IPBES report.", "slug": "general-biodiversity-un", "source": "BBC Earth", "hours_ago": 60, "image_seed": "gen5"},
        {"title": "Carbon Tax Introduced to Incentivize Industry Decarbonisation", "description": "New legislation introduces a carbon tax of ₹1,500 per tonne of CO2 equivalent for heavy industry.", "slug": "general-carbon-tax", "source": "Economic Times", "hours_ago": 40, "image_seed": "gen6"},
    ]

    # Select a random subset of 10-12 articles
    random.shuffle(article_pool)
    selected = article_pool[:random.randint(10, 12)]

    # Give each article a unique URL so duplicates are not detected across fetches
    batch_id = uuid.uuid4().hex[:8]
    result = []
    for i, a in enumerate(selected):
        result.append({
            "title": a["title"],
            "description": a["description"],
            # Unique URL per fetch batch so each call adds genuinely new articles
            "url": f"https://demo.servicesense.app/{a['slug']}-{batch_id}-{i}",
            "source": {"name": a["source"]},
            "publishedAt": (now - timedelta(hours=a["hours_ago"])).isoformat() + "Z",
            "urlToImage": f"https://picsum.photos/seed/{a['image_seed']}{batch_id[:4]}/800/400",
        })

    if locality:
        loc_lower = locality.lower()
        filtered = [a for a in result if loc_lower in (a["title"] + " " + a["description"]).lower()]
        if filtered:
            return filtered

    if category and category != "general":
        cat_filtered = [a for a in result if category.lower() in a["url"].split("/")[3]]
        if cat_filtered:
            return cat_filtered

    return result


