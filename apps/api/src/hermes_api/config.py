from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://hermes:hermes@localhost:5432/hermes"
    redis_url: str = "redis://localhost:6379/0"

    whatsapp_verify_token: str = "change-me"
    whatsapp_app_secret: str = "change-me"
    whatsapp_access_token: str = "change-me"

    instagram_app_secret: str = "change-me"
    instagram_access_token: str = "change-me"

    # Hermes API Server (OpenAI-compatible endpoint)
    hermes_enabled: bool = False
    hermes_base_url: str = "http://localhost:8642"
    hermes_api_key: str = "change-me-local-dev"
    hermes_model: str = "hermes-agent"
    hermes_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
