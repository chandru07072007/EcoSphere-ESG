from fastapi import APIRouter, Depends

from app.database import get_carbon_transactions_collection, get_database, get_notifications_collection
from app.dependencies import get_current_active_user
from app.services.scoring_engine import scoring_engine

router = APIRouter()


def _str_id(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ---------------------------------------------------------------------------
# GET /dashboard/overview
# ---------------------------------------------------------------------------
@router.get("/overview")
async def get_overview(current_user: dict = Depends(get_current_active_user)):
    db = get_database()
    overall = await scoring_engine.get_overall_score(db)

    # Recent activity: last 5 carbon transactions
    tx_col = get_carbon_transactions_collection()
    recent_tx = (
        await tx_col.find().sort("created_at", -1).limit(5).to_list(length=5)
    )
    for t in recent_tx:
        _str_id(t)

    return {
        "esg_scores": overall,
        "recent_transactions": recent_tx,
    }


# ---------------------------------------------------------------------------
# GET /dashboard/recent-transactions
# ---------------------------------------------------------------------------
@router.get("/recent-transactions")
async def get_recent_transactions(
    current_user: dict = Depends(get_current_active_user),
):
    col = get_carbon_transactions_collection()
    txs = await col.find().sort("created_at", -1).limit(10).to_list(length=10)
    return [_str_id(t) for t in txs]


# ---------------------------------------------------------------------------
# GET /dashboard/notifications/unread-count
# ---------------------------------------------------------------------------
@router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_active_user)):
    col = get_notifications_collection()
    count = await col.count_documents(
        {"recipient_id": str(current_user["_id"]), "read": False}
    )
    return {"unread_count": count}
