# RCA/backend/src/config/settings.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    postgres_user: str = "ddm_user"
    postgres_password: str = "change_me"
    postgres_db: str = "ddm_db"
    database_url: Optional[str] = None

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # Meilisearch
    meili_master_key: str = "change_me_meili_master_key"
    meili_url: str = "http://meilisearch:7700"

    # Application
    ddm_encryption_key: str = ""
    ddm_ai_provider: str = "gemini"            # gemini, together, groq
    ddm_ai_api_key: str = ""
    ddm_ai_model: str = "gemini-2.0-flash"
    ddm_ai_enabled: bool = True                # master switch for AI assistant
    ddm_admin_upload_limit_mb: int = 500
    ddm_user_upload_limit_mb: int = 100
    ddm_secret_key: str = "change_me_secret"
    ddm_environment: str = "development"

    # Tika
    tika_url: str = "http://tika:9998"
    tika_ocr_enabled: bool = False

    # Session
    session_duration_hours: int = 8
    session_inactivity_minutes: int = 30
    single_session_mode: bool = False

    # CORS
    allowed_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def assembled_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@postgres:5432/{self.postgres_db}"


settings = Settings()
# end of RCA/backend/src/config/settings.py