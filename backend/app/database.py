from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _client


def get_database() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        _db = get_client()[settings.DB_NAME]
    return _db


def get_users_collection():
    return get_database()["users"]


def get_departments_collection():
    return get_database()["departments"]


def get_emission_factors_collection():
    return get_database()["emission_factors"]


def get_carbon_transactions_collection():
    return get_database()["carbon_transactions"]


def get_csr_activities_collection():
    return get_database()["csr_activities"]


def get_csr_participations_collection():
    return get_database()["csr_participations"]


def get_challenges_collection():
    return get_database()["challenges"]


def get_challenge_participations_collection():
    return get_database()["challenge_participations"]


def get_badges_collection():
    return get_database()["badges"]


def get_employee_badges_collection():
    return get_database()["employee_badges"]


def get_rewards_collection():
    return get_database()["rewards"]


def get_reward_redemptions_collection():
    return get_database()["reward_redemptions"]


def get_compliance_issues_collection():
    return get_database()["compliance_issues"]


def get_policies_collection():
    return get_database()["policies"]


def get_policy_acknowledgements_collection():
    return get_database()["policy_acknowledgements"]


def get_audits_collection():
    return get_database()["audits"]


def get_notifications_collection():
    return get_database()["notifications"]


def get_settings_collection():
    return get_database()["settings"]


def get_categories_collection():
    return get_database()["categories"]


def get_product_esg_profiles_collection():
    return get_database()["product_esg_profiles"]


def get_environmental_goals_collection():
    return get_database()["environmental_goals"]
