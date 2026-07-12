from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_notifications_collection
from app.dependencies import get_current_active_user
from app.models.notification import NotificationResponse
from app.services.notification_service import notification_service

router = APIRouter()


def _str(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid id: {id_str}")


@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(current_user: dict = Depends(get_current_active_user)):
    user_id = str(current_user["_id"])
    db_col = get_notifications_collection()
    docs = (
        await db_col.find({"recipient_id": user_id})
        .sort("created_at", -1)
        .limit(100)
        .to_list(length=100)
    )
    return [_str(d) for d in docs]


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str, current_user: dict = Depends(get_current_active_user)
):
    col = get_notifications_collection()
    notif = await col.find_one({"_id": _oid(notification_id)})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.get("recipient_id") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your notification")

    await col.update_one(
        {"_id": _oid(notification_id)}, {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}


@router.put("/read-all", status_code=200)
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_active_user),
):
    user_id = str(current_user["_id"])
    col = get_notifications_collection()
    result = await col.update_many(
        {"recipient_id": user_id, "read": False}, {"$set": {"read": True}}
    )
    return {"message": f"Marked {result.modified_count} notification(s) as read"}
