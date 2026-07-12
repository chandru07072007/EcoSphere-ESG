"""
EcoSphere ESG — Complete database seed script.

Run from the backend/ directory:
    python -m seed.seed_data

Drops all collections and recreates them with realistic sample data.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Allow running from backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ecosphere")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hp(password: str) -> str:
    return pwd_context.hash(password)


def now_minus(days: int = 0, hours: int = 0) -> datetime:
    return datetime.utcnow() - timedelta(days=days, hours=hours)


def now_plus(days: int = 0) -> datetime:
    return datetime.utcnow() + timedelta(days=days)


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    COLLECTIONS = [
        "users", "departments", "categories", "emission_factors",
        "carbon_transactions", "csr_activities", "csr_participations",
        "challenges", "challenge_participations", "badges", "employee_badges",
        "rewards", "reward_redemptions", "compliance_issues", "policies",
        "policy_acknowledgements", "audits", "notifications", "settings",
        "product_esg_profiles", "environmental_goals",
    ]

    print("🗑️  Dropping existing collections...")
    for col_name in COLLECTIONS:
        await db[col_name].drop()
    print("   Done.\n")

    # ------------------------------------------------------------------ DEPARTMENTS
    print("📂 Seeding departments...")
    dept_eng_id = ObjectId()
    dept_ops_id = ObjectId()
    dept_hr_id = ObjectId()
    departments = [
        {
            "_id": dept_eng_id,
            "name": "Engineering",
            "code": "ENG",
            "head_id": None,
            "parent_id": None,
            "employee_count": 25,
            "status": "active",
            "created_at": now_minus(days=90),
        },
        {
            "_id": dept_ops_id,
            "name": "Operations",
            "code": "OPS",
            "head_id": None,
            "parent_id": None,
            "employee_count": 30,
            "status": "active",
            "created_at": now_minus(days=90),
        },
        {
            "_id": dept_hr_id,
            "name": "Human Resources",
            "code": "HR",
            "head_id": None,
            "parent_id": None,
            "employee_count": 10,
            "status": "active",
            "created_at": now_minus(days=90),
        },
    ]
    await db["departments"].insert_many(departments)
    print(f"   ✅ {len(departments)} departments inserted.\n")

    # ------------------------------------------------------------------ USERS
    print("👤 Seeding users...")
    admin_id = ObjectId()
    mgr1_id = ObjectId()
    mgr2_id = ObjectId()
    emp1_id = ObjectId()
    emp2_id = ObjectId()

    users = [
        {
            "_id": admin_id,
            "name": "Alice Admin",
            "email": "admin@ecosphere.io",
            "hashed_password": hp("Admin@123"),
            "role": "admin",
            "department_id": str(dept_eng_id),
            "xp": 1500,
            "points": 800,
            "is_active": True,
            "created_at": now_minus(days=80),
        },
        {
            "_id": mgr1_id,
            "name": "Bob Manager",
            "email": "bob@ecosphere.io",
            "hashed_password": hp("Manager@123"),
            "role": "manager",
            "department_id": str(dept_eng_id),
            "xp": 900,
            "points": 450,
            "is_active": True,
            "created_at": now_minus(days=70),
        },
        {
            "_id": mgr2_id,
            "name": "Carol Manager",
            "email": "carol@ecosphere.io",
            "hashed_password": hp("Manager@123"),
            "role": "manager",
            "department_id": str(dept_ops_id),
            "xp": 750,
            "points": 300,
            "is_active": True,
            "created_at": now_minus(days=65),
        },
        {
            "_id": emp1_id,
            "name": "Dave Employee",
            "email": "dave@ecosphere.io",
            "hashed_password": hp("Employee@123"),
            "role": "employee",
            "department_id": str(dept_eng_id),
            "xp": 350,
            "points": 175,
            "is_active": True,
            "created_at": now_minus(days=60),
        },
        {
            "_id": emp2_id,
            "name": "Eve Employee",
            "email": "eve@ecosphere.io",
            "hashed_password": hp("Employee@123"),
            "role": "employee",
            "department_id": str(dept_hr_id),
            "xp": 120,
            "points": 60,
            "is_active": True,
            "created_at": now_minus(days=55),
        },
    ]
    await db["users"].insert_many(users)
    # Update department head_ids
    await db["departments"].update_one({"_id": dept_eng_id}, {"$set": {"head_id": str(mgr1_id)}})
    await db["departments"].update_one({"_id": dept_ops_id}, {"$set": {"head_id": str(mgr2_id)}})
    await db["departments"].update_one({"_id": dept_hr_id}, {"$set": {"head_id": str(admin_id)}})
    print(f"   ✅ {len(users)} users inserted.\n")

    # ------------------------------------------------------------------ CATEGORIES
    print("🏷️  Seeding categories...")
    cat_env_id = ObjectId()
    cat_csr_id = ObjectId()
    cat_govern_id = ObjectId()
    categories = [
        {"_id": cat_env_id, "name": "Environmental", "type": "E", "created_at": now_minus(days=80)},
        {"_id": cat_csr_id, "name": "Community Service", "type": "S", "created_at": now_minus(days=80)},
        {"_id": cat_govern_id, "name": "Governance & Compliance", "type": "G", "created_at": now_minus(days=80)},
    ]
    await db["categories"].insert_many(categories)
    print(f"   ✅ {len(categories)} categories inserted.\n")

    # ------------------------------------------------------------------ EMISSION FACTORS
    print("⚗️  Seeding emission factors...")
    ef1_id = ObjectId()
    ef2_id = ObjectId()
    ef3_id = ObjectId()
    ef4_id = ObjectId()
    emission_factors = [
        {
            "_id": ef1_id,
            "name": "Purchase - Electronics",
            "source_type": "purchase",
            "coefficient": 0.45,
            "unit": "kg CO2e per $",
            "description": "Carbon intensity for electronics procurement",
            "effective_date": now_minus(days=365),
            "created_at": now_minus(days=365),
        },
        {
            "_id": ef2_id,
            "name": "Manufacturing - General",
            "source_type": "manufacturing",
            "coefficient": 1.2,
            "unit": "kg CO2e per unit",
            "description": "General manufacturing emission factor",
            "effective_date": now_minus(days=365),
            "created_at": now_minus(days=365),
        },
        {
            "_id": ef3_id,
            "name": "Fleet - Diesel Vehicle",
            "source_type": "fleet",
            "coefficient": 2.68,
            "unit": "kg CO2e per litre",
            "description": "Diesel vehicle emission factor (DEFRA 2023)",
            "effective_date": now_minus(days=365),
            "created_at": now_minus(days=365),
        },
        {
            "_id": ef4_id,
            "name": "Business Expense - Travel",
            "source_type": "expense",
            "coefficient": 0.18,
            "unit": "kg CO2e per km",
            "description": "Business travel emission factor",
            "effective_date": now_minus(days=365),
            "created_at": now_minus(days=365),
        },
    ]
    await db["emission_factors"].insert_many(emission_factors)
    print(f"   ✅ {len(emission_factors)} emission factors inserted.\n")

    # ------------------------------------------------------------------ CARBON TRANSACTIONS
    print("🌍 Seeding carbon transactions...")
    transactions = [
        {
            "source_type": "purchase",
            "source_id": None,
            "department_id": str(dept_eng_id),
            "amount_co2e": 225.0,
            "quantity": 500.0,
            "unit": "units",
            "notes": "Laptop procurement Q1",
            "emission_factor_id": str(ef1_id),
            "auto_generated": True,
            "date": now_minus(days=60),
            "created_at": now_minus(days=60),
        },
        {
            "source_type": "fleet",
            "source_id": None,
            "department_id": str(dept_ops_id),
            "amount_co2e": 536.0,
            "quantity": 200.0,
            "unit": "litres",
            "notes": "Delivery truck fuel — March",
            "emission_factor_id": str(ef3_id),
            "auto_generated": True,
            "date": now_minus(days=55),
            "created_at": now_minus(days=55),
        },
        {
            "source_type": "manufacturing",
            "source_id": None,
            "department_id": str(dept_ops_id),
            "amount_co2e": 960.0,
            "quantity": 800.0,
            "unit": "units",
            "notes": "Product batch manufacturing",
            "emission_factor_id": str(ef2_id),
            "auto_generated": False,
            "date": now_minus(days=50),
            "created_at": now_minus(days=50),
        },
        {
            "source_type": "expense",
            "source_id": None,
            "department_id": str(dept_hr_id),
            "amount_co2e": 90.0,
            "quantity": 500.0,
            "unit": "km",
            "notes": "Recruitment travel expenses",
            "emission_factor_id": str(ef4_id),
            "auto_generated": True,
            "date": now_minus(days=45),
            "created_at": now_minus(days=45),
        },
        {
            "source_type": "purchase",
            "source_id": None,
            "department_id": str(dept_eng_id),
            "amount_co2e": 180.0,
            "quantity": 400.0,
            "unit": "units",
            "notes": "Server hardware Q2",
            "emission_factor_id": str(ef1_id),
            "auto_generated": True,
            "date": now_minus(days=40),
            "created_at": now_minus(days=40),
        },
        {
            "source_type": "fleet",
            "source_id": None,
            "department_id": str(dept_ops_id),
            "amount_co2e": 402.0,
            "quantity": 150.0,
            "unit": "litres",
            "notes": "Delivery fuel — April",
            "emission_factor_id": str(ef3_id),
            "auto_generated": True,
            "date": now_minus(days=35),
            "created_at": now_minus(days=35),
        },
        {
            "source_type": "manufacturing",
            "source_id": None,
            "department_id": str(dept_ops_id),
            "amount_co2e": 720.0,
            "quantity": 600.0,
            "unit": "units",
            "notes": "Product batch — April",
            "emission_factor_id": str(ef2_id),
            "auto_generated": False,
            "date": now_minus(days=30),
            "created_at": now_minus(days=30),
        },
        {
            "source_type": "expense",
            "source_id": None,
            "department_id": str(dept_eng_id),
            "amount_co2e": 45.0,
            "quantity": 250.0,
            "unit": "km",
            "notes": "Client site visits",
            "emission_factor_id": str(ef4_id),
            "auto_generated": True,
            "date": now_minus(days=20),
            "created_at": now_minus(days=20),
        },
        {
            "source_type": "purchase",
            "source_id": None,
            "department_id": str(dept_hr_id),
            "amount_co2e": 67.5,
            "quantity": 150.0,
            "unit": "units",
            "notes": "Office supplies Q2",
            "emission_factor_id": str(ef1_id),
            "auto_generated": False,
            "date": now_minus(days=15),
            "created_at": now_minus(days=15),
        },
        {
            "source_type": "fleet",
            "source_id": None,
            "department_id": str(dept_ops_id),
            "amount_co2e": 268.0,
            "quantity": 100.0,
            "unit": "litres",
            "notes": "Delivery fuel — May",
            "emission_factor_id": str(ef3_id),
            "auto_generated": True,
            "date": now_minus(days=5),
            "created_at": now_minus(days=5),
        },
    ]
    await db["carbon_transactions"].insert_many(transactions)
    print(f"   ✅ {len(transactions)} carbon transactions inserted.\n")

    # ------------------------------------------------------------------ CSR ACTIVITIES
    print("🤝 Seeding CSR activities...")
    act1_id = ObjectId()
    act2_id = ObjectId()
    act3_id = ObjectId()
    csr_activities = [
        {
            "_id": act1_id,
            "title": "Community Tree Planting Drive",
            "description": "Plant 500 trees in the local park to offset carbon emissions.",
            "category_id": str(cat_env_id),
            "department_id": str(dept_eng_id),
            "xp_reward": 200,
            "points_reward": 100,
            "start_date": now_minus(days=30),
            "end_date": now_plus(days=30),
            "created_at": now_minus(days=35),
        },
        {
            "_id": act2_id,
            "title": "Local Food Bank Volunteer Day",
            "description": "Spend a day volunteering at the city food bank.",
            "category_id": str(cat_csr_id),
            "department_id": str(dept_hr_id),
            "xp_reward": 150,
            "points_reward": 75,
            "start_date": now_minus(days=20),
            "end_date": now_plus(days=10),
            "created_at": now_minus(days=25),
        },
        {
            "_id": act3_id,
            "title": "Office Recycling Programme",
            "description": "Set up and run a comprehensive recycling programme across all offices.",
            "category_id": str(cat_env_id),
            "department_id": str(dept_ops_id),
            "xp_reward": 100,
            "points_reward": 50,
            "start_date": now_minus(days=10),
            "end_date": now_plus(days=60),
            "created_at": now_minus(days=12),
        },
    ]
    await db["csr_activities"].insert_many(csr_activities)

    # CSR Participations
    csr_participations = [
        {
            "activity_id": str(act1_id),
            "employee_id": str(emp1_id),
            "status": "approved",
            "proof_url": "https://example.com/proof1.jpg",
            "notes": "Planted 50 trees!",
            "created_at": now_minus(days=28),
        },
        {
            "activity_id": str(act1_id),
            "employee_id": str(emp2_id),
            "status": "pending",
            "proof_url": None,
            "notes": "Will attend this weekend",
            "created_at": now_minus(days=20),
        },
        {
            "activity_id": str(act2_id),
            "employee_id": str(emp1_id),
            "status": "approved",
            "proof_url": "https://example.com/proof2.jpg",
            "notes": "Helped pack 200 food parcels",
            "created_at": now_minus(days=18),
        },
        {
            "activity_id": str(act3_id),
            "employee_id": str(emp2_id),
            "status": "pending",
            "proof_url": None,
            "notes": "Setting up bins next week",
            "created_at": now_minus(days=8),
        },
    ]
    await db["csr_participations"].insert_many(csr_participations)
    print(f"   ✅ {len(csr_activities)} CSR activities + {len(csr_participations)} participations.\n")

    # ------------------------------------------------------------------ CHALLENGES
    print("🏆 Seeding challenges...")
    ch1_id = ObjectId()
    ch2_id = ObjectId()
    ch3_id = ObjectId()
    challenges = [
        {
            "_id": ch1_id,
            "title": "30-Day Zero Waste Challenge",
            "description": "Reduce your personal waste to zero for 30 days. Document daily.",
            "category_id": str(cat_env_id),
            "difficulty": "hard",
            "xp_reward": 500,
            "points_reward": 250,
            "deadline": now_plus(days=30),
            "department_id": None,
            "status": "active",
            "created_at": now_minus(days=10),
        },
        {
            "_id": ch2_id,
            "title": "Paperless Office Week",
            "description": "Go completely paperless for one working week.",
            "category_id": str(cat_env_id),
            "difficulty": "easy",
            "xp_reward": 150,
            "points_reward": 75,
            "deadline": now_plus(days=7),
            "department_id": str(dept_eng_id),
            "status": "completed",
            "created_at": now_minus(days=20),
        },
        {
            "_id": ch3_id,
            "title": "ESG Knowledge Quiz",
            "description": "Test your knowledge on ESG principles and sustainability.",
            "category_id": str(cat_govern_id),
            "difficulty": "medium",
            "xp_reward": 300,
            "points_reward": 150,
            "deadline": now_plus(days=14),
            "department_id": None,
            "status": "draft",
            "created_at": now_minus(days=5),
        },
    ]
    await db["challenges"].insert_many(challenges)

    # Challenge participations
    ch_participations = [
        {
            "challenge_id": str(ch1_id),
            "employee_id": str(emp1_id),
            "status": "enrolled",
            "progress": 35,
            "notes": None,
            "created_at": now_minus(days=8),
        },
        {
            "challenge_id": str(ch2_id),
            "employee_id": str(emp1_id),
            "status": "completed",
            "progress": 100,
            "notes": "Completed paperless week successfully",
            "created_at": now_minus(days=15),
        },
        {
            "challenge_id": str(ch2_id),
            "employee_id": str(emp2_id),
            "status": "completed",
            "progress": 100,
            "notes": "Done!",
            "created_at": now_minus(days=14),
        },
        {
            "challenge_id": str(ch1_id),
            "employee_id": str(emp2_id),
            "status": "enrolled",
            "progress": 10,
            "notes": None,
            "created_at": now_minus(days=6),
        },
    ]
    await db["challenge_participations"].insert_many(ch_participations)
    print(f"   ✅ {len(challenges)} challenges + {len(ch_participations)} participations.\n")

    # ------------------------------------------------------------------ BADGES
    print("🎖️  Seeding badges...")
    b1_id = ObjectId()
    b2_id = ObjectId()
    b3_id = ObjectId()
    b4_id = ObjectId()
    badges = [
        {
            "_id": b1_id,
            "name": "Green Starter",
            "description": "Earned your first 100 XP on the sustainability journey.",
            "icon": "🌱",
            "rarity": "common",
            "unlock_rule_type": "xp_threshold",
            "unlock_rule_value": 100,
            "created_at": now_minus(days=90),
        },
        {
            "_id": b2_id,
            "name": "Eco Warrior",
            "description": "Reached 500 XP — a true sustainability champion.",
            "icon": "🌿",
            "rarity": "rare",
            "unlock_rule_type": "xp_threshold",
            "unlock_rule_value": 500,
            "created_at": now_minus(days=90),
        },
        {
            "_id": b3_id,
            "name": "Challenge Champion",
            "description": "Completed 3 or more sustainability challenges.",
            "icon": "🏆",
            "rarity": "epic",
            "unlock_rule_type": "challenge_count",
            "unlock_rule_value": 3,
            "created_at": now_minus(days=90),
        },
        {
            "_id": b4_id,
            "name": "Sustainability Legend",
            "description": "Achieved 1000 XP — a legendary sustainability leader.",
            "icon": "⚡",
            "rarity": "legendary",
            "unlock_rule_type": "xp_threshold",
            "unlock_rule_value": 1000,
            "created_at": now_minus(days=90),
        },
    ]
    await db["badges"].insert_many(badges)

    # Employee badges (Alice admin has legendary + epic, Bob has eco warrior)
    employee_badges = [
        {
            "employee_id": str(admin_id),
            "badge_id": str(b1_id),
            "awarded_at": now_minus(days=70),
            "created_at": now_minus(days=70),
        },
        {
            "employee_id": str(admin_id),
            "badge_id": str(b2_id),
            "awarded_at": now_minus(days=60),
            "created_at": now_minus(days=60),
        },
        {
            "employee_id": str(admin_id),
            "badge_id": str(b4_id),
            "awarded_at": now_minus(days=30),
            "created_at": now_minus(days=30),
        },
        {
            "employee_id": str(mgr1_id),
            "badge_id": str(b1_id),
            "awarded_at": now_minus(days=55),
            "created_at": now_minus(days=55),
        },
        {
            "employee_id": str(mgr1_id),
            "badge_id": str(b2_id),
            "awarded_at": now_minus(days=40),
            "created_at": now_minus(days=40),
        },
        {
            "employee_id": str(emp1_id),
            "badge_id": str(b1_id),
            "awarded_at": now_minus(days=45),
            "created_at": now_minus(days=45),
        },
    ]
    await db["employee_badges"].insert_many(employee_badges)
    print(f"   ✅ {len(badges)} badges + {len(employee_badges)} employee badge records.\n")

    # ------------------------------------------------------------------ REWARDS
    print("🎁 Seeding rewards...")
    rewards = [
        {
            "name": "Bamboo Water Bottle",
            "description": "Eco-friendly reusable water bottle made from sustainable bamboo.",
            "points_cost": 200,
            "stock": 50,
            "image_url": "https://example.com/images/bamboo-bottle.jpg",
            "created_at": now_minus(days=80),
        },
        {
            "name": "EcoSphere Branded Tote Bag",
            "description": "Organic cotton tote bag with EcoSphere sustainability branding.",
            "points_cost": 150,
            "stock": 100,
            "image_url": "https://example.com/images/tote-bag.jpg",
            "created_at": now_minus(days=80),
        },
        {
            "name": "Extra Day Off",
            "description": "Redeem points for one additional paid day off. Subject to manager approval.",
            "points_cost": 500,
            "stock": 10,
            "image_url": None,
            "created_at": now_minus(days=80),
        },
    ]
    await db["rewards"].insert_many(rewards)
    print(f"   ✅ {len(rewards)} rewards inserted.\n")

    # ------------------------------------------------------------------ COMPLIANCE ISSUES
    print("⚠️  Seeding compliance issues...")
    compliance_issues = [
        {
            "title": "Data Privacy Policy Non-Compliance",
            "description": "Employee data storage practices do not meet GDPR requirements.",
            "severity": "critical",
            "owner_id": str(mgr1_id),
            "due_date": now_minus(days=5),  # OVERDUE
            "department_id": str(dept_eng_id),
            "category": "Data Privacy",
            "status": "open",
            "resolution_notes": None,
            "is_overdue": True,
            "created_at": now_minus(days=30),
        },
        {
            "title": "Safety Training Incomplete",
            "description": "15 employees in Operations have not completed mandatory safety training.",
            "severity": "high",
            "owner_id": str(mgr2_id),
            "due_date": now_plus(days=7),
            "department_id": str(dept_ops_id),
            "category": "Health & Safety",
            "status": "in_progress",
            "resolution_notes": "Training sessions scheduled for next week.",
            "is_overdue": False,
            "created_at": now_minus(days=20),
        },
        {
            "title": "Supplier Code of Conduct Not Signed",
            "description": "3 key suppliers have not signed the updated Code of Conduct.",
            "severity": "medium",
            "owner_id": str(admin_id),
            "due_date": now_minus(days=15),
            "department_id": str(dept_hr_id),
            "category": "Supply Chain",
            "status": "resolved",
            "resolution_notes": "All suppliers have now signed the updated CoC document.",
            "is_overdue": False,
            "created_at": now_minus(days=45),
        },
    ]
    await db["compliance_issues"].insert_many(compliance_issues)
    print(f"   ✅ {len(compliance_issues)} compliance issues inserted.\n")

    # ------------------------------------------------------------------ POLICIES
    print("📋 Seeding policies...")
    pol1_id = ObjectId()
    pol2_id = ObjectId()
    policies = [
        {
            "_id": pol1_id,
            "title": "Environmental Sustainability Policy 2024",
            "scope": "All employees and contractors",
            "version": "2.1",
            "content": (
                "EcoSphere is committed to minimising its environmental impact. "
                "All employees must follow waste reduction guidelines, use energy "
                "efficiently, and report any environmental incidents immediately. "
                "Carbon offsetting is mandatory for all business travel exceeding 500km."
            ),
            "department_ids": [str(dept_eng_id), str(dept_ops_id), str(dept_hr_id)],
            "acknowledgement_count": 2,
            "total_required": 5,
            "published_at": now_minus(days=20),
            "created_at": now_minus(days=25),
        },
        {
            "_id": pol2_id,
            "title": "Code of Business Conduct",
            "scope": "All employees",
            "version": "3.0",
            "content": (
                "EcoSphere employees must uphold the highest standards of ethical "
                "conduct. This includes honesty, integrity, fairness, and respect "
                "in all business interactions. Violations must be reported via the "
                "whistleblowing hotline."
            ),
            "department_ids": [str(dept_eng_id), str(dept_hr_id)],
            "acknowledgement_count": 1,
            "total_required": 3,
            "published_at": now_minus(days=10),
            "created_at": now_minus(days=15),
        },
    ]
    await db["policies"].insert_many(policies)

    # Policy acknowledgements
    acknowledgements = [
        {
            "policy_id": str(pol1_id),
            "employee_id": str(admin_id),
            "employee_name": "Alice Admin",
            "acknowledged_at": now_minus(days=18),
        },
        {
            "policy_id": str(pol1_id),
            "employee_id": str(mgr1_id),
            "employee_name": "Bob Manager",
            "acknowledged_at": now_minus(days=17),
        },
        {
            "policy_id": str(pol2_id),
            "employee_id": str(admin_id),
            "employee_name": "Alice Admin",
            "acknowledged_at": now_minus(days=8),
        },
    ]
    await db["policy_acknowledgements"].insert_many(acknowledgements)
    print(f"   ✅ {len(policies)} policies + {len(acknowledgements)} acknowledgements.\n")

    # ------------------------------------------------------------------ AUDITS
    print("🔍 Seeding audits...")
    audits = [
        {
            "policy_id": str(pol1_id),
            "department_id": str(dept_eng_id),
            "findings": (
                "Engineering department shows strong compliance with environmental policy. "
                "Recycling bins properly labelled. One minor non-conformity: two monitors "
                "not set to energy-saving mode. Action required within 30 days."
            ),
            "auditor_id": str(admin_id),
            "date": now_minus(days=10),
            "created_at": now_minus(days=10),
        },
        {
            "policy_id": str(pol2_id),
            "department_id": str(dept_hr_id),
            "findings": (
                "HR department demonstrates good understanding of the Code of Conduct. "
                "Annual training completed by all HR staff. Whistleblowing process clearly "
                "communicated. No material findings."
            ),
            "auditor_id": str(mgr1_id),
            "date": now_minus(days=5),
            "created_at": now_minus(days=5),
        },
    ]
    await db["audits"].insert_many(audits)
    print(f"   ✅ {len(audits)} audits inserted.\n")

    # ------------------------------------------------------------------ DEFAULT SETTINGS
    print("⚙️  Seeding default org settings...")
    await db["settings"].insert_one(
        {
            "_type": "org_settings",
            "auto_emission": True,
            "evidence_required": True,
            "badge_auto_award": True,
            "e_weight": 40.0,
            "s_weight": 30.0,
            "g_weight": 30.0,
            "created_at": now_minus(days=90),
        }
    )
    print("   ✅ Default org settings inserted.\n")

    # ------------------------------------------------------------------ ENVIRONMENTAL GOALS
    print("🎯 Seeding environmental goals...")
    goals = [
        {
            "department_id": str(dept_eng_id),
            "title": "Engineering Carbon Reduction 2024",
            "target_reduction_pct": 20.0,
            "baseline_co2e": 1500.0,
            "target_year": 2024,
            "status": "active",
            "created_at": now_minus(days=90),
        },
        {
            "department_id": str(dept_ops_id),
            "title": "Operations Fleet Emission Reduction",
            "target_reduction_pct": 15.0,
            "baseline_co2e": 2000.0,
            "target_year": 2024,
            "status": "active",
            "created_at": now_minus(days=90),
        },
    ]
    await db["environmental_goals"].insert_many(goals)
    print(f"   ✅ {len(goals)} environmental goals inserted.\n")

    # ------------------------------------------------------------------ PRODUCT ESG PROFILES
    print("📦 Seeding product ESG profiles...")
    profiles = [
        {
            "product_name": "EcoServer X1",
            "sku": "ESX1-001",
            "department_id": str(dept_eng_id),
            "carbon_footprint_kg": 85.0,
            "recyclability_pct": 92.0,
            "energy_rating": "A+",
            "supply_chain_score": 78.5,
            "created_at": now_minus(days=60),
        },
    ]
    await db["product_esg_profiles"].insert_many(profiles)
    print(f"   ✅ {len(profiles)} product ESG profiles inserted.\n")

    # ------------------------------------------------------------------ NOTIFICATIONS
    print("🔔 Seeding sample notifications...")
    notifs = [
        {
            "recipient_id": str(emp1_id),
            "type": "badge",
            "message": "🏆 You've unlocked the 'Green Starter' badge!",
            "link": "/social/badges",
            "read": False,
            "created_at": now_minus(days=45),
        },
        {
            "recipient_id": str(emp1_id),
            "type": "social",
            "message": "✅ Your CSR participation for 'Community Tree Planting Drive' has been approved!",
            "link": "/social/csr",
            "read": True,
            "created_at": now_minus(days=28),
        },
        {
            "recipient_id": str(mgr1_id),
            "type": "compliance",
            "message": "⚠️ Compliance issue 'Data Privacy Policy Non-Compliance' is now overdue.",
            "link": "/governance/compliance",
            "read": False,
            "created_at": now_minus(days=5),
        },
        {
            "recipient_id": str(admin_id),
            "type": "policy",
            "message": "📋 New policy 'Code of Business Conduct' requires your acknowledgement.",
            "link": "/governance/policies",
            "read": True,
            "created_at": now_minus(days=10),
        },
    ]
    await db["notifications"].insert_many(notifs)
    print(f"   ✅ {len(notifs)} notifications inserted.\n")

    client.close()
    print("=" * 60)
    print("🌿 EcoSphere ESG seed data completed successfully!")
    print("=" * 60)
    print("\n📌 Test credentials:")
    print("   Admin:    admin@ecosphere.io  / Admin@123")
    print("   Manager:  bob@ecosphere.io    / Manager@123")
    print("   Manager:  carol@ecosphere.io  / Manager@123")
    print("   Employee: dave@ecosphere.io   / Employee@123")
    print("   Employee: eve@ecosphere.io    / Employee@123")
    print()


if __name__ == "__main__":
    asyncio.run(seed())
