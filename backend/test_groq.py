import asyncio
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    key = os.getenv("OPENAI_API_KEY")
    print(f"Key loaded: {key[:10]}...")
    
    client = AsyncOpenAI(
        api_key=key,
        base_url="https://api.groq.com/openai/v1",
        timeout=10.0
    )
    
    try:
        print("Sending request to Groq...")
        resp = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=10
        )
        print("Success:", resp.choices[0].message.content)
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    asyncio.run(test())
