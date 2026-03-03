from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    firebase_service_account_key: str = "./firebase-service-account.json"
    firebase_database_url: str = ""   # e.g. https://your-project-default-rtdb.firebaseio.com
    news_api_key: str = ""
    gnews_api_key: str = "e34e445182ac3c205dfc255972336de6"
    openai_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
