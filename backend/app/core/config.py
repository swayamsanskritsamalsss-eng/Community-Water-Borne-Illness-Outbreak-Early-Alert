from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_database_url(url: str) -> str:
    """
    Accept the database URL in any common hosting format and
    convert it to the SQLAlchemy psycopg(3) driver form.

    Render/Heroku style URLs (postgres:// or postgresql://)
    are rewritten to postgresql+psycopg:// so no manual
    configuration is needed in deployment dashboards.
    """
    if url.startswith("postgres://"):
        return url.replace(
            "postgres://", "postgresql+psycopg://", 1
        )
    if url.startswith("postgresql://"):
        return url.replace(
            "postgresql://", "postgresql+psycopg://", 1
        )
    return url


class Settings(BaseSettings):
    app_name: str = "Aarogya"
    environment: str = "development"

    # PostgreSQL/Supabase in production. If not provided, the
    # local demo falls back to SQLite so the app can run with
    # zero external services.
    database_url: str = "sqlite:///./aarogya.db"

    # SQLite needs check_same_thread disabled for FastAPI.
    connect_args: dict = {}

    @property
    def sqlalchemy_database_url(self) -> str:
        return _normalize_database_url(self.database_url)

    jwt_secret: str = "change-this-secret"
    jwt_expire_minutes: int = 10080

    frontend_url: str = "http://localhost:3000"

    default_cluster_threshold: int = 3
    default_window_hours: int = 24

    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_claims_email: str = "mailto:admin@aarogya.app"

    # Extra CORS origins beyond frontend_url. Comma-separated,
    # e.g. "https://aarogya.vercel.app,https://aarogya-git-main.vercel.app".
    # "*" allows any origin (handy for demo deployments).
    cors_origins: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()