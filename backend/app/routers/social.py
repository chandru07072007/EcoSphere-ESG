from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.database import (
    get_badges_collection,
    get_challenge_participations_collection,
    get_challenges_collection,
    get_csr_activities_collection,
    get_csr_participations_collection,
    get_database,
    get_employee_badges_collection,
    get_reward_redemptions_collection,
    get_rewards_collection,
    get_settings_collection,
    get_users_collection,
)
from app.dependencies import get_current_active_user, get_manager_or_admin
from app.models.badge import EmployeeBadgeResponse
from app.models.challenge import (
    ChallengeCreate,
    ChallengeParticipationCreate,
    ChallengeParticipationResponse,
    ChallengeResponse,
    ChallengeUpdate,
)
from app.models.csr_activity import (
    CSRActivityCreate,
    CSRActivityUpdate,
    CSRActivityResponse,
    CSRParticipationCreate,
    CSRParticipationResponse,
)
from app.models.reward import RedemptionResponse, RewardResponse
from app.services.badge_engine import badge_engine
from app.services.email_service import email_service
from app.services.s3_service import s3_service

router = APIRouter()

CHALLENGE_TRANSITIONS = {
    "draft": ["active"],
    "active": ["under_review", "archived"],
    "under_review": ["completed", "active"],
    "completed": ["archived"],
    "archived": [],
}


def _str(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid id: {id_str}")


# ==========================================================================
# CSR ACTIVITIES
# ==========================================================================

@router.get("/csr-activities", response_model=List[CSRActivityResponse])
async def list_csr_activities(
    department_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_csr_activities_collection()
    query: dict = {}
    if department_id:
        query["department_id"] = department_id
    docs = await col.find(query).skip(skip).limit(limit).to_list(length=limit)
    part_col = get_csr_participations_collection()
    result = []
    for d in docs:
        d["participant_count"] = await part_col.count_documents(
            {"activity_id": str(d["_id"])}
        )
        result.append(_str(d))
    return result


@router.post("/csr-activities", response_model=CSRActivityResponse, status_code=201)
async def create_csr_activity(
    body: CSRActivityCreate, _: dict = Depends(get_manager_or_admin)
):
    col = get_csr_activities_collection()
    doc = body.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    created["participant_count"] = 0
    return _str(created)


@router.get("/csr-activities/{activity_id}", response_model=CSRActivityResponse)
async def get_csr_activity(activity_id: str, _: dict = Depends(get_current_active_user)):
    col = get_csr_activities_collection()
    doc = await col.find_one({"_id": _oid(activity_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="CSR activity not found")
    part_col = get_csr_participations_collection()
    doc["participant_count"] = await part_col.count_documents(
        {"activity_id": activity_id}
    )
    return _str(doc)


@router.put("/csr-activities/{activity_id}", response_model=CSRActivityResponse)
async def update_csr_activity(
    activity_id: str, body: CSRActivityUpdate, _: dict = Depends(get_manager_or_admin)
):
    col = get_csr_activities_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await col.update_one({"_id": _oid(activity_id)}, {"$set": data})
    doc = await col.find_one({"_id": _oid(activity_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="CSR activity not found")
    part_col = get_csr_participations_collection()
    doc["participant_count"] = await part_col.count_documents(
        {"activity_id": activity_id}
    )
    return _str(doc)


@router.delete("/csr-activities/{activity_id}", status_code=204)
async def delete_csr_activity(
    activity_id: str, _: dict = Depends(get_manager_or_admin)
):
    col = get_csr_activities_collection()
    result = await col.delete_one({"_id": _oid(activity_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="CSR activity not found")


# CSR Participations
@router.get(
    "/csr-activities/{activity_id}/participations",
    response_model=List[CSRParticipationResponse],
)
async def get_activity_participations(
    activity_id: str, _: dict = Depends(get_current_active_user)
):
    col = get_csr_participations_collection()
    docs = await col.find({"activity_id": activity_id}).to_list(length=None)
    return [_str(d) for d in docs]


@router.post(
    "/csr-activities/{activity_id}/participate",
    response_model=CSRParticipationResponse,
    status_code=201,
)
async def participate_in_csr(
    activity_id: str, current_user: dict = Depends(get_current_active_user)
):
    act_col = get_csr_activities_collection()
    activity = await act_col.find_one({"_id": _oid(activity_id)})
    if not activity:
        raise HTTPException(status_code=404, detail="CSR activity not found")

    part_col = get_csr_participations_collection()
    employee_id = str(current_user["_id"])

    existing = await part_col.find_one(
        {"activity_id": activity_id, "employee_id": employee_id}
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already participating")

    doc = {
        "activity_id": activity_id,
        "employee_id": employee_id,
        "status": "pending",
        "proof_url": None,
        "notes": None,
        "created_at": datetime.utcnow(),
    }
    result = await part_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _str(doc)


@router.post("/csr-participations/{participation_id}/approve")
async def approve_csr_participation(
    participation_id: str, manager: dict = Depends(get_manager_or_admin)
):
    part_col = get_csr_participations_collection()
    part = await part_col.find_one({"_id": _oid(participation_id)})
    if not part:
        raise HTTPException(status_code=404, detail="Participation not found")

    # Check evidence_required setting
    settings_col = get_settings_collection()
    cfg = await settings_col.find_one({"_type": "org_settings"}) or {}
    evidence_required: bool = cfg.get("evidence_required", True)
    if evidence_required and not part.get("proof_url"):
        raise HTTPException(
            status_code=422,
            detail="Evidence/proof is required before approval",
        )

    await part_col.update_one(
        {"_id": _oid(participation_id)}, {"$set": {"status": "approved"}}
    )

    # Award XP and points
    act_col = get_csr_activities_collection()
    activity = await act_col.find_one({"_id": _oid(part["activity_id"])})
    if activity:
        xp_reward = activity.get("xp_reward", 0)
        pts_reward = activity.get("points_reward", 0)
        users_col = get_users_collection()
        await users_col.update_one(
            {"_id": _oid(part["employee_id"])},
            {"$inc": {"xp": xp_reward, "points": pts_reward}},
        )
        db = get_database()
        newly_awarded = await badge_engine.check_and_award(part["employee_id"], db)

        # Email notification
        employee = await users_col.find_one({"_id": _oid(part["employee_id"])})
        if employee:
            await email_service.send_csr_decision(
                email=employee.get("email", ""),
                name=employee.get("name", ""),
                activity_title=activity.get("title", ""),
                decision="approved",
            )
            for badge_name in newly_awarded:
                badge = await get_badges_collection().find_one({"name": badge_name})
                if badge:
                    await email_service.send_badge_unlock(
                        email=employee["email"],
                        name=employee["name"],
                        badge_name=badge_name,
                        badge_rarity=badge.get("rarity", "common"),
                    )

    return {"message": "Participation approved", "participation_id": participation_id}


@router.post("/csr-participations/{participation_id}/deny")
async def deny_csr_participation(
    participation_id: str, manager: dict = Depends(get_manager_or_admin)
):
    part_col = get_csr_participations_collection()
    part = await part_col.find_one({"_id": _oid(participation_id)})
    if not part:
        raise HTTPException(status_code=404, detail="Participation not found")

    await part_col.update_one(
        {"_id": _oid(participation_id)}, {"$set": {"status": "denied"}}
    )

    act_col = get_csr_activities_collection()
    activity = await act_col.find_one({"_id": _oid(part["activity_id"])})
    users_col = get_users_collection()
    employee = await users_col.find_one({"_id": _oid(part["employee_id"])})
    if employee and activity:
        await email_service.send_csr_decision(
            email=employee.get("email", ""),
            name=employee.get("name", ""),
            activity_title=activity.get("title", ""),
            decision="denied",
        )

    return {"message": "Participation denied", "participation_id": participation_id}


@router.post("/csr-participations/{participation_id}/upload-proof")
async def upload_csr_proof(
    participation_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user),
):
    part_col = get_csr_participations_collection()
    part = await part_col.find_one({"_id": _oid(participation_id)})
    if not part:
        raise HTTPException(status_code=404, detail="Participation not found")

    # Allow upload only if owner
    if part["employee_id"] != str(current_user["_id"]) and current_user.get("role") not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Not authorized")

    content = await file.read()
    key = f"proofs/csr/{participation_id}/{file.filename}"
    try:
        url = s3_service.upload_file(content, key, file.content_type or "application/octet-stream")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}")

    await part_col.update_one(
        {"_id": _oid(participation_id)}, {"$set": {"proof_url": url}}
    )
    return {"proof_url": url}


# ==========================================================================
# CHALLENGES
# ==========================================================================

@router.get("/challenges", response_model=List[ChallengeResponse])
async def list_challenges(
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_challenges_collection()
    query: dict = {}
    if status:
        query["status"] = status
    if department_id:
        query["department_id"] = department_id
    docs = await col.find(query).skip(skip).limit(limit).to_list(length=limit)
    part_col = get_challenge_participations_collection()
    result = []
    for d in docs:
        d["participant_count"] = await part_col.count_documents(
            {"challenge_id": str(d["_id"])}
        )
        result.append(_str(d))
    return result


@router.post("/challenges", response_model=ChallengeResponse, status_code=201)
async def create_challenge(
    body: ChallengeCreate, _: dict = Depends(get_manager_or_admin)
):
    col = get_challenges_collection()
    doc = body.model_dump()
    doc["status"] = "draft"
    doc["created_at"] = datetime.utcnow()
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    created["participant_count"] = 0
    return _str(created)


@router.get("/challenges/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(challenge_id: str, _: dict = Depends(get_current_active_user)):
    col = get_challenges_collection()
    doc = await col.find_one({"_id": _oid(challenge_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Challenge not found")
    part_col = get_challenge_participations_collection()
    doc["participant_count"] = await part_col.count_documents(
        {"challenge_id": challenge_id}
    )
    return _str(doc)


@router.put("/challenges/{challenge_id}", response_model=ChallengeResponse)
async def update_challenge(
    challenge_id: str, body: ChallengeUpdate, _: dict = Depends(get_manager_or_admin)
):
    col = get_challenges_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await col.update_one({"_id": _oid(challenge_id)}, {"$set": data})
    doc = await col.find_one({"_id": _oid(challenge_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Challenge not found")
    part_col = get_challenge_participations_collection()
    doc["participant_count"] = await part_col.count_documents(
        {"challenge_id": challenge_id}
    )
    return _str(doc)


@router.put("/challenges/{challenge_id}/status")
async def transition_challenge_status(
    challenge_id: str,
    body: dict,
    _: dict = Depends(get_manager_or_admin),
):
    col = get_challenges_collection()
    doc = await col.find_one({"_id": _oid(challenge_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Challenge not found")

    new_status = body.get("status")
    current_status = doc.get("status", "draft")
    allowed = CHALLENGE_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot transition from '{current_status}' to '{new_status}'. Allowed: {allowed}",
        )

    await col.update_one({"_id": _oid(challenge_id)}, {"$set": {"status": new_status}})
    return {"message": f"Status updated to {new_status}"}


@router.post(
    "/challenges/{challenge_id}/participate",
    response_model=ChallengeParticipationResponse,
    status_code=201,
)
async def participate_in_challenge(
    challenge_id: str, current_user: dict = Depends(get_current_active_user)
):
    col = get_challenges_collection()
    challenge = await col.find_one({"_id": _oid(challenge_id)})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if challenge.get("status") != "active":
        raise HTTPException(status_code=422, detail="Challenge is not active")

    part_col = get_challenge_participations_collection()
    employee_id = str(current_user["_id"])
    existing = await part_col.find_one(
        {"challenge_id": challenge_id, "employee_id": employee_id}
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already enrolled")

    doc = {
        "challenge_id": challenge_id,
        "employee_id": employee_id,
        "status": "enrolled",
        "progress": 0,
        "notes": None,
        "created_at": datetime.utcnow(),
    }
    result = await part_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _str(doc)


@router.put(
    "/challenge-participations/{participation_id}/complete",
    response_model=ChallengeParticipationResponse,
)
async def complete_challenge_participation(
    participation_id: str, manager: dict = Depends(get_manager_or_admin)
):
    part_col = get_challenge_participations_collection()
    part = await part_col.find_one({"_id": _oid(participation_id)})
    if not part:
        raise HTTPException(status_code=404, detail="Participation not found")

    await part_col.update_one(
        {"_id": _oid(participation_id)},
        {"$set": {"status": "completed", "progress": 100}},
    )

    # Award XP and points
    chall_col = get_challenges_collection()
    challenge = await chall_col.find_one({"_id": _oid(part["challenge_id"])})
    if challenge:
        users_col = get_users_collection()
        await users_col.update_one(
            {"_id": _oid(part["employee_id"])},
            {
                "$inc": {
                    "xp": challenge.get("xp_reward", 0),
                    "points": challenge.get("points_reward", 0),
                }
            },
        )
        db = get_database()
        newly_awarded = await badge_engine.check_and_award(part["employee_id"], db)

        employee = await users_col.find_one({"_id": _oid(part["employee_id"])})
        for badge_name in newly_awarded:
            badge = await get_badges_collection().find_one({"name": badge_name})
            if badge and employee:
                await email_service.send_badge_unlock(
                    email=employee["email"],
                    name=employee["name"],
                    badge_name=badge_name,
                    badge_rarity=badge.get("rarity", "common"),
                )

    updated = await part_col.find_one({"_id": _oid(participation_id)})
    return _str(updated)


# ==========================================================================
# LEADERBOARD
# ==========================================================================

@router.get("/leaderboard")
async def get_leaderboard(_: dict = Depends(get_current_active_user)):
    users_col = get_users_collection()
    top_users = (
        await users_col.find(
            {"is_active": True},
            {"name": 1, "email": 1, "xp": 1, "points": 1, "department_id": 1},
        )
        .sort("xp", -1)
        .limit(20)
        .to_list(length=20)
    )
    result = []
    for rank, u in enumerate(top_users, start=1):
        u["_id"] = str(u["_id"])
        u["rank"] = rank
        result.append(u)
    return result


# ==========================================================================
# REWARDS
# ==========================================================================

@router.get("/rewards", response_model=List[RewardResponse])
async def list_rewards(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_rewards_collection()
    docs = await col.find().skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/rewards/{reward_id}/redeem", response_model=RedemptionResponse)
async def redeem_reward(
    reward_id: str, current_user: dict = Depends(get_current_active_user)
):
    rewards_col = get_rewards_collection()
    reward = await rewards_col.find_one({"_id": _oid(reward_id)})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    if reward.get("stock", 0) <= 0:
        raise HTTPException(status_code=422, detail="Reward out of stock")

    employee_points: int = current_user.get("points", 0)
    cost: int = reward.get("points_cost", 0)
    if employee_points < cost:
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient points. Have {employee_points}, need {cost}",
        )

    # Deduct points and reduce stock
    users_col = get_users_collection()
    await users_col.update_one(
        {"_id": current_user["_id"]}, {"$inc": {"points": -cost}}
    )
    await rewards_col.update_one(
        {"_id": _oid(reward_id)}, {"$inc": {"stock": -1}}
    )

    redemption_col = get_reward_redemptions_collection()
    employee_id = str(current_user["_id"])
    now = datetime.utcnow()
    doc = {
        "employee_id": employee_id,
        "reward_id": reward_id,
        "points_deducted": cost,
        "redeemed_at": now,
        "created_at": now,
    }
    result = await redemption_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    doc["reward"] = _str(reward)
    return _str(doc)


# ==========================================================================
# EMPLOYEE BADGES & XP
# ==========================================================================

@router.get("/employee/{employee_id}/badges", response_model=List[EmployeeBadgeResponse])
async def get_employee_badges(
    employee_id: str, _: dict = Depends(get_current_active_user)
):
    emp_badge_col = get_employee_badges_collection()
    badge_col = get_badges_collection()
    docs = await emp_badge_col.find({"employee_id": employee_id}).to_list(length=None)
    result = []
    for doc in docs:
        badge = await badge_col.find_one({"_id": _oid(doc["badge_id"])})
        doc["badge"] = _str(badge) if badge else None
        result.append(_str(doc))
    return result


@router.get("/employee/{employee_id}/xp-history")
async def get_xp_history(
    employee_id: str, _: dict = Depends(get_current_active_user)
):
    db = get_database()
    # Collect approved CSR participations
    csr_parts = await db["csr_participations"].find(
        {"employee_id": employee_id, "status": "approved"}
    ).to_list(length=None)

    activities_col = db["csr_activities"]
    history = []
    for p in csr_parts:
        act = await activities_col.find_one({"_id": _oid(p["activity_id"])})
        history.append(
            {
                "type": "csr",
                "title": act.get("title", "") if act else "",
                "xp": act.get("xp_reward", 0) if act else 0,
                "points": act.get("points_reward", 0) if act else 0,
                "date": p.get("created_at"),
            }
        )

    # Collect completed challenges
    chall_parts = await db["challenge_participations"].find(
        {"employee_id": employee_id, "status": "completed"}
    ).to_list(length=None)
    chall_col = db["challenges"]
    for p in chall_parts:
        chall = await chall_col.find_one({"_id": _oid(p["challenge_id"])})
        history.append(
            {
                "type": "challenge",
                "title": chall.get("title", "") if chall else "",
                "xp": chall.get("xp_reward", 0) if chall else 0,
                "points": chall.get("points_reward", 0) if chall else 0,
                "date": p.get("created_at"),
            }
        )

    history.sort(key=lambda x: x.get("date") or datetime.min, reverse=True)
    return {"employee_id": employee_id, "history": history}
