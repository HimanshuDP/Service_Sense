import asyncio
import sys
import os
import traceback

sys.path.append(os.path.dirname(__file__))

from services.news_service import fetch_news
from services.openai_service import summarize_and_suggest

async def run_test():
    try:
        print("1. Testing NewsAPI...")
        articles = await fetch_news()
        print(f"Found {len(articles)} articles.")
        
        if articles:
            a = articles[0]
            title = a.get("title", "")
            desc = a.get("description", "")
            print(f"2. Testing Groq summarization on: {title[:30]}...")
            
            res = await summarize_and_suggest(title, desc, "air")
            print("Summary:", res)
            
    except Exception as e:
        print("EXCEPTION CAUGHT:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_test())
