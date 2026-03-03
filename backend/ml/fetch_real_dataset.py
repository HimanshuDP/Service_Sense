import httpx
import asyncio
import pandas as pd
import os
import sys

# Add parent to path to import config correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings

NEWS_API_BASE = "https://newsapi.org/v2/everything"

# High-quality keywords to gather a diverse training dataset
QUERIES = {
    "air": ["air pollution", "smog", "air quality index", "particulate matter", "toxic emissions"],
    "water": ["water pollution", "groundwater contamination", "ocean pollution", "river pollution", "oil spill"],
    "land": ["deforestation", "soil erosion", "forest fire", "desertification", "land degradation"],
    "waste": ["plastic waste", "electronic waste", "landfill", "recycling", "municipal waste"],
    "general": ["climate change", "global warming", "biodiversity loss", "environmental conservation", "sustainability"]
}

async def fetch_category_data(category, keywords, client):
    articles = []
    print(f"Fetching actual news for category: {category.upper()}...")
    
    for kw in keywords:
        try:
            resp = await client.get(
                NEWS_API_BASE,
                params={
                    "q": kw,
                    "language": "en",
                    "sortBy": "relevancy",
                    "pageSize": 100,  # Max allowed per request on dev tier
                    "apiKey": settings.news_api_key,
                },
            )
            data = resp.json()
            if data.get("status") == "ok":
                for article in data.get("articles", []):
                    title = article.get("title") or ""
                    desc = article.get("description") or ""
                    # Combine title and description for training text
                    full_text = f"{title}. {desc}".strip()
                    if len(full_text) > 20: # Ensure valid text
                        articles.append({"text": full_text, "category": category})
        except Exception as e:
            print(f"  Error fetching '{kw}': {e}")
            
    return articles

async def build_dataset():
    if not settings.news_api_key or settings.news_api_key == "your_newsapi_key_here":
        print("❌ ERROR: A real NewsAPI key is required in backend/.env to fetch the actual training dataset.")
        print("Please add 'NEWS_API_KEY=your_key' to .env and run this again.")
        return
        
    print("=== Extracting Real-World Environmental News Dataset ===\n")
    dataset = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for cat, kws in QUERIES.items():
            cat_articles = await fetch_category_data(cat, kws, client)
            dataset.extend(cat_articles)
            
    if not dataset:
        print("\n❌ No articles fetched. Check your NewsAPI key limits.")
        return
        
    df = pd.DataFrame(dataset)
    
    # Drop exact duplicates and empty strings
    df = df.dropna(subset=["text"])
    df = df.drop_duplicates(subset=["text"])
    
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "real_environmental_dataset.csv")
    df.to_csv(output_path, index=False)
    
    print(f"\n✅ Successfully downloaded and compiled {len(df)} REAL news articles!")
    print(f"Dataset beautifully saved to: {output_path}")
    print("\nClass distribution:")
    print(df["category"].value_counts())
    
    print("\n🚀 Next Step: Run 'python ml/train.py' to embed this real dataset into the Model!")

if __name__ == "__main__":
    asyncio.run(build_dataset())
