import logging
from datetime import datetime
from typing import List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class BadgeEngine:
    """
    Checks unlock rules for all badges and awards any newly qualifying badges
    to the given employee.
    """

    async def check_and_award(
        self, employee_id: str, db: AsyncIOMotorDatabase
    ) -> List[str]:
        """
        Returns a list of badge names that were newly awarded in this call.
        Side-effects: inserts employee_badge documents and creates notifications.
        """
        newly_awarded: List[str] = []

        # --- Fetch employee ---
        try:
            user_oid = ObjectId(employee_id)
        except Exception:
            logger.warning("BadgeEngine: invalid employee_id '%s'", employee_id)
            return []

        employee = await db["users"].find_one({"_id": user_oid})
        if not employee:
            return []

        employee_xp: int = employee.get("xp", 0)

        # --- Count completed challenges ---
        completed_count: int = await db["challenge_participations"].count_documents(
            {"employee_id": employee_id, "status": "completed"}
        )

        # --- Badges already owned ---
        owned_cursor = db["employee_badges"].find({"employee_id": employee_id})
        owned_docs = await owned_cursor.to_list(length=None)
        owned_badge_ids = {doc["badge_id"] for doc in owned_docs}

        # --- Iterate all badges ---
        all_badges_cursor = db["badges"].find({})
        all_badges = await all_badges_cursor.to_list(length=None)

        for badge in all_badges:
            badge_id = str(badge["_id"])
            if badge_id in owned_badge_ids:
                continue

            rule_type: str = badge.get("unlock_rule_type", "")
            rule_value: int = badge.get("unlock_rule_value", 0)

            qualified = False
            if rule_type == "xp_threshold" and employee_xp >= rule_value:
                qualified = True
            elif rule_type == "challenge_count" and completed_count >= rule_value:
                qualified = True

            if qualified:
                now = datetime.utcnow()
                await db["employee_badges"].insert_one(
                    {
                        "employee_id": employee_id,
                        "badge_id": badge_id,
                        "awarded_at": now,
                        "created_at": now,
                    }
                )

                # Create in-app notification
                await db["notifications"].insert_one(
                    {
                        "recipient_id": employee_id,
                        "type": "badge",
                        "message": f"🏆 You've unlocked the '{badge['name']}' badge!",
                        "link": "/social/badges",
                        "read": False,
                        "created_at": now,
                    }
                )

                newly_awarded.append(badge["name"])
                logger.info(
                    "Badge '%s' awarded to employee %s", badge["name"], employee_id
                )

        return newly_awarded


badge_engine = BadgeEngine()
