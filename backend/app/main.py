from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import get_database
from app.routers import (
    analytics,
    auth,
    dashboard,
    environmental,
    governance,
    master_data,
    notifications,
    settings,
    social,
)


# ---------------------------------------------------------------------------
# Lifespan: create indexes on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = get_database()

    # Users
    await db["users"].create_index("email", unique=True)
    await db["users"].create_index("role")
    await db["users"].create_index("department_id")

    # Carbon transactions
    await db["carbon_transactions"].create_index("department_id")
    await db["carbon_transactions"].create_index("source_type")
    await db["carbon_transactions"].create_index("date")

    # Emission factors
    await db["emission_factors"].create_index("source_type")
    await db["emission_factors"].create_index("effective_date")

    # CSR
    await db["csr_activities"].create_index("department_id")
    await db["csr_participations"].create_index([("activity_id", 1), ("employee_id", 1)])
    await db["csr_participations"].create_index("status")

    # Challenges
    await db["challenges"].create_index("status")
    await db["challenges"].create_index("department_id")
    await db["challenge_participations"].create_index(
        [("challenge_id", 1), ("employee_id", 1)]
    )

    # Badges
    await db["employee_badges"].create_index([("employee_id", 1), ("badge_id", 1)])

    # Compliance
    await db["compliance_issues"].create_index("status")
    await db["compliance_issues"].create_index("due_date")
    await db["compliance_issues"].create_index("department_id")

    # Policies
    await db["policy_acknowledgements"].create_index(
        [("policy_id", 1), ("employee_id", 1)]
    )

    # Notifications
    await db["notifications"].create_index("recipient_id")
    await db["notifications"].create_index("read")

    # Rewards
    await db["reward_redemptions"].create_index("employee_id")

    print("Database indexes created successfully")
    yield
    print("Application shutdown")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="EcoSphere ESG Platform API",
    version="1.0.0",
    description="Comprehensive ESG (Environmental, Social, Governance) backend for the EcoSphere platform.",
    lifespan=lifespan,
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static_uploads"))
os.makedirs(static_dir, exist_ok=True)
app.mount("/static_uploads", StaticFiles(directory=static_dir), name="static_uploads")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(master_data.router, prefix="/master", tags=["Master Data"])
app.include_router(environmental.router, prefix="/environmental", tags=["Environmental"])
app.include_router(social.router, prefix="/social", tags=["Social"])
app.include_router(governance.router, prefix="/governance", tags=["Governance"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(settings.router, prefix="/settings", tags=["Settings"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": "EcoSphere ESG Platform API",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health():
    try:
        db = get_database()
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as exc:
        return {"status": "unhealthy", "database": str(exc)}
