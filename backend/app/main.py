from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, alerts, auth, dashboard, reports
from app.core.config import settings
from app.db.session import Base, engine


# Create database tables when running locally.
#
# Supabase can also be initialized using sql/schema.sql.
Base.metadata.create_all(bind=engine)


# Lightweight startup migration: add columns that were introduced
# after a database was already provisioned (e.g. the production
# Supabase DB created before the photo upload feature). Idempotent.
from sqlalchemy import text  # noqa: E402


with engine.connect() as conn:
    for statement in (
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_base64 TEXT",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_mime VARCHAR(50)",
    ):
        try:
            conn.execute(text(statement))
        except Exception:
            # SQLite (local demo) lacks IF NOT EXISTS on ADD COLUMN;
            # the columns already exist there, so failing statements
            # are safely ignored.
            pass
    conn.commit()


app = FastAPI(
    title="Aarogya API",
    description=(
        "Community Water-Borne Illness "
        "and Possible Cluster Early Warning System"
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

allowed_origins = [
    settings.frontend_url,
    "http://localhost:3000",
]

# Additional origins from CORS_ORIGINS env var (comma-separated).
# "*" allows every origin - convenient for open demo deployments.
if settings.cors_origins.strip() == "*":
    allow_all = True
    allowed_origins = ["*"]
else:
    allow_all = False
    allowed_origins += [
        origin.strip()
        for origin in settings.cors_origins.split(",")
        if origin.strip()
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        ["*"]
        if allow_all
        else list(set(allowed_origins))
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTES
# ============================================================

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(admin.router)


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():

    return {
        "name": "Aarogya",
        "status": "online",
        "message": (
            "System backend is running."
        ),
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }