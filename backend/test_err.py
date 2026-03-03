import traceback
import sys

try:
    from openai import AsyncOpenAI
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    key = os.getenv("OPENAI_API_KEY", "dummy")
    print(f"Key exists: {bool(key)}")
    
    # This line has been crashing
    client = AsyncOpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")
    
    print("AsyncOpenAI initialized successfully.")
    
except Exception as e:
    print("Caught exception:")
    traceback.print_exc()
