import logging
from datetime import datetime
from typing import List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.email_service import email_service

logger = logging.getLogger(__name__)


class NotificationService:
    async def create_notification(
        self,
        recipient_id: str,
        type: str,
        message: str,
        link: str,
        db: AsyncIOMotorDatabase,
    ) -> dict:
        doc = {
            "recipient_id": recipient_id,
            "type": type,
            "message": message,
            "link": link,
            "read": False,
            "created_at": datetime.utcnow(),
        }
        result = await db["notifications"].insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def get_user_notifications(
        self, user_id: str, db: AsyncIOMotorDatabase
    ) -> List[dict]:
        cursor = db["notifications"].find(
            {"recipient_id": user_id}
        ).sort("created_at", -1).limit(100)
        return await cursor.to_list(length=None)

    async def mark_as_read(
        self, notification_id: str, db: AsyncIOMotorDatabase
    ) -> bool:
        try:
            oid = ObjectId(notification_id)
        except Exception:
            return False
        result = await db["notifications"].update_one(
            {"_id": oid}, {"$set": {"read": True}}
        )
        return result.modified_count > 0

    async def mark_all_read(self, user_id: str, db: AsyncIOMotorDatabase) -> int:
        result = await db["notifications"].update_many(
            {"recipient_id": user_id, "read": False},
            {"$set": {"read": True}},
        )
        return result.modified_count

    async def check_overdue_issues(self, db: AsyncIOMotorDatabase) -> int:
        """
        Scan all open compliance issues past their due_date.
        For each, create a notification for the owner and send an overdue email.
        Returns the count of overdue issues processed.
        """
        now = datetime.utcnow()
        cursor = db["compliance_issues"].find(
            {
                "status": {"$in": ["open", "in_progress"]},
                "due_date": {"$lt": now},
            }
        )
        issues = await cursor.to_list(length=None)
        count = 0

        for issue in issues:
            owner_id: str = issue.get("owner_id", "")
            if not owner_id:
                continue

            try:
                owner_oid = ObjectId(owner_id)
                owner = await db["users"].find_one({"_id": owner_oid})
            except Exception:
                continue

            if not owner:
                continue

            due_date: datetime = issue.get("due_date", now)
            days_overdue = max(1, (now - due_date).days)

            # In-app notification
            await self.create_notification(
                recipient_id=owner_id,
                type="compliance",
                message=f"⚠️ Overdue issue: '{issue.get('title', '')}' is {days_overdue} day(s) overdue.",
                link="/governance/compliance",
                db=db,
            )

            # Email alert
            await email_service.send_overdue_alert(
                email=owner.get("email", ""),
                name=owner.get("name", ""),
                issue_title=issue.get("title", ""),
                days_overdue=days_overdue,
            )
            count += 1
            logger.info(
                "Overdue alert sent for issue '%s' to user '%s'",
                issue.get("title"),
                owner_id,
            )

        return count


notification_service = NotificationService()
