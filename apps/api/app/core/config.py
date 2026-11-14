from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    app_name: str = "FITWITHRAM"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "local-development-secret-do-not-use-in-production"
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    database_url: str = "postgresql+psycopg://fitwithram:fitwithram@localhost:5432/fitwithram"
    web_origins: list[str] = ["http://localhost:5173"]
    web_app_url: str = "http://localhost:5173"
    resend_api_key: str = ""
    resend_from_email: str = ""
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    phonepe_client_id: str = ""
    phonepe_client_secret: str = ""
    phonepe_client_version: str = "1"
    phonepe_environment: str = "UAT"
    phonepe_webhook_username: str = ""
    phonepe_webhook_password: str = ""
    phonepe_merchant_phone: str = ""

    @field_validator("secret_key")
    @classmethod
    def require_secret_in_production(cls, value: str, info):
        if info.data.get("app_env", "development").lower() == "production" and (
            len(value) < 32 or "replace-with" in value or "development" in value
        ):
            raise ValueError("Set a unique SECRET_KEY with at least 32 characters in production")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
