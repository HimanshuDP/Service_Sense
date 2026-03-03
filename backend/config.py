from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    firebase_service_account_key: str = "./firebase-service-account.json"
    firebase_database_url: str = ""   # e.g. https://your-project-default-rtdb.firebaseio.com
    news_api_key: str = ""
    openai_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
