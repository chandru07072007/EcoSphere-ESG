from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import (
    get_badges_collection,
    get_categories_collection,
    get_database,
    get_departments_collection,
    get_emission_factors_collection,
    get_environmental_goals_collection,
    get_product_esg_profiles_collection,
    get_rewards_collection,
)
from app.dependencies import get_current_active_user, get_manager_or_admin
from app.models.badge import BadgeCreate, BadgeResponse, BadgeUpdate
from app.models.department import DepartmentCreate, DepartmentResponse, DepartmentUpdate
from app.models.emission_factor import (
    EmissionFactorCreate,
    EmissionFactorResponse,
    EmissionFactorUpdate,
)
from app.models.reward import RewardCreate, RewardResponse, RewardUpdate

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


# ==========================================================================
# DEPARTMENTS
# ==========================================================================

@router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_departments_collection()
    docs = await col.find().skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/departments", response_model=DepartmentResponse, status_code=201)
async def create_department(
    body: DepartmentCreate, _: dict = Depends(get_manager_or_admin)
):
    col = get_departments_collection()
    doc = body.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/departments/{dept_id}", response_model=DepartmentResponse)
async def get_department(dept_id: str, _: dict = Depends(get_current_active_user)):
    col = get_departments_collection()
    doc = await col.find_one({"_id": _oid(dept_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Department not found")
    return _str(doc)


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: str, body: DepartmentUpdate, _: dict = Depends(get_manager_or_admin)
):
    col = get_departments_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await col.update_one({"_id": _oid(dept_id)}, {"$set": data})
    doc = await col.find_one({"_id": _oid(dept_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Department not found")
    return _str(doc)


@router.delete("/departments/{dept_id}", status_code=204)
async def delete_department(dept_id: str, _: dict = Depends(get_manager_or_admin)):
    col = get_departments_collection()
    result = await col.delete_one({"_id": _oid(dept_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")


# ==========================================================================
# CATEGORIES
# ==========================================================================

@router.get("/categories")
async def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_categories_collection()
    docs = await col.find().skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/categories", status_code=201)
async def create_category(body: dict, _: dict = Depends(get_manager_or_admin)):
    col = get_categories_collection()
    body["created_at"] = datetime.utcnow()
    result = await col.insert_one(body)
    created = await col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/categories/{cat_id}")
async def get_category(cat_id: str, _: dict = Depends(get_current_active_user)):
    col = get_categories_collection()
    doc = await col.find_one({"_id": _oid(cat_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")
    return _str(doc)


@router.put("/categories/{cat_id}")
async def update_category(
    cat_id: str, body: dict, _: dict = Depends(get_manager_or_admin)
):
    col = get_categories_collection()
    body.pop("_id", None)
    await col.update_one({"_id": _oid(cat_id)}, {"$set": body})
    doc = await col.find_one({"_id": _oid(cat_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")
    return _str(doc)


@router.delete("/categories/{cat_id}", status_code=204)
async def delete_category(cat_id: str, _: dict = Depends(get_manager_or_admin)):
    col = get_categories_collection()
    result = await col.delete_one({"_id": _oid(cat_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")


# ==========================================================================
# EMISSION FACTORS
# ==========================================================================

@router.get("/emission-factors", response_model=List[EmissionFactorResponse])
async def list_emission_factors(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_emission_factors_collection()
    docs = await col.find().skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/emission-factors", response_model=EmissionFactorResponse, status_code=201)
async def create_emission_factor(
    body: EmissionFactorCreate, _: dict = Depends(get_manager_or_admin)
):
    col = get_emission_factors_collection()
    doc = body.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/emission-factors/{ef_id}", response_model=EmissionFactorResponse)
async def get_emission_factor(ef_id: str, _: dict = Depends(get_current_active_user)):
    col = get_emission_factors_collection()
    doc = await col.find_one({"_id": _oid(ef_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Emission factor not found")
    return _str(doc)


@router.put("/emission-factors/{ef_id}", response_model=EmissionFactorResponse)
async def update_emission_factor(
    ef_id: str, body: EmissionFactorUpdate, _: dict = Depends(get_manager_or_admin)
):
    col = get_emission_factors_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await col.update_one({"_id": _oid(ef_id)}, {"$set": data})
    doc = await col.find_one({"_id": _oid(ef_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Emission factor not found")
    return _str(doc)


@router.delete("/emission-factors/{ef_id}", status_code=204)
async def delete_emission_factor(
    ef_id: str, _: dict = Depends(get_manager_or_admin)
):
    col = get_emission_factors_collection()
    result = await col.delete_one({"_id": _oid(ef_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Emission factor not found")


# ==========================================================================
# PRODUCT ESG PROFILES
# ==========================================================================

@router.get("/product-esg-profiles")
async def list_product_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_product_esg_profiles_collection()
    docs = await col.find().skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/product-esg-profiles", status_code=201)
async def create_product_profile(
    body: dict, _: dict = Depends(get_manager_or_admin)
):
    col = get_product_esg_profiles_collection()
    body["created_at"] = datetime.utcnow()
    result = await col.insert_one(body)
    created = await col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/product-esg-profiles/{pid}")
async def get_product_profile(pid: str, _: dict = Depends(get_current_active_user)):
    col = get_product_esg_profiles_collection()
    doc = await col.find_one({"_id": _oid(pid)})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _str(doc)


@router.put("/product-esg-profiles/{pid}")
async def update_product_profile(
    pid: str, body: dict, _: dict = Depends(get_manager_or_admin)
):
    col = get_product_esg_profiles_collection()
    body.pop("_id", None)
    await col.update_one({"_id": _oid(pid)}, {"$set": body})
    doc = await col.find_one({"_id": _oid(pid)})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _str(doc)


@router.delete("/product-esg-profiles/{pid}", status_code=204)
async def delete_product_profile(pid: str, _: dict = Depends(get_manager_or_admin)):
    col = get_product_esg_profiles_collection()
    result = await col.delete_one({"_id": _oid(pid)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")


# ==========================================================================
# ENVIRONMENTAL GOALS
# ==========================================================================

@router.get("/environmental-goals")
async def list_env_goals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_environmental_goals_collection()
    docs = await col.find().skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/environmental-goals", status_code=201)
async def create_env_goal(body: dict, _: dict = Depends(get_manager_or_admin)):
    col = get_environmental_goals_collection()
    body["created_at"] = datetime.utcnow()
    result = await col.insert_one(body)
    created = await col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/environmental-goals/{gid}")
async def get_env_goal(gid: str, _: dict = Depends(get_current_active_user)):
    col = get_environmental_goals_collection()
    doc = await col.find_one({"_id": _oid(gid)})
    if not doc:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _str(doc)


@router.put("/environmental-goals/{gid}")
async def update_env_goal(gid: str, body: dict, _: dict = Depends(get_manager_or_admin)):
    col = get_environmental_goals_collection()
    body.pop("_id", None)
    await col.update_one({"_id": _oid(gid)}, {"$set": body})
    doc = await col.find_one({"_id": _oid(gid)})
    if not doc:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _str(doc)


@router.delete("/environmental-goals/{gid}", status_code=204)
async def delete_env_goal(gid: str, _: dict = Depends(get_manager_or_admin)):
    col = get_environmental_goals_collection()
    result = await col.delete_one({"_id": _oid(gid)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")


# ==========================================================================
# BADGES
# ==========================================================================

@router.get("/badges", response_model=List[BadgeResponse])
async def list_badges(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_badges_collection()
    docs = await col.find().skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/badges", response_model=BadgeResponse, status_code=201)
async def create_badge(body: BadgeCreate, _: dict = Depends(get_manager_or_admin)):
    col = get_badges_collection()
    doc = body.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/badges/{badge_id}", response_model=BadgeResponse)
async def get_badge(badge_id: str, _: dict = Depends(get_current_active_user)):
    col = get_badges_collection()
    doc = await col.find_one({"_id": _oid(badge_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Badge not found")
    return _str(doc)


@router.put("/badges/{badge_id}", response_model=BadgeResponse)
async def update_badge(
    badge_id: str, body: BadgeUpdate, _: dict = Depends(get_manager_or_admin)
):
    col = get_badges_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await col.update_one({"_id": _oid(badge_id)}, {"$set": data})
    doc = await col.find_one({"_id": _oid(badge_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Badge not found")
    return _str(doc)


@router.delete("/badges/{badge_id}", status_code=204)
async def delete_badge(badge_id: str, _: dict = Depends(get_manager_or_admin)):
    col = get_badges_collection()
    result = await col.delete_one({"_id": _oid(badge_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Badge not found")


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


@router.post("/rewards", response_model=RewardResponse, status_code=201)
async def create_reward(body: RewardCreate, _: dict = Depends(get_manager_or_admin)):
    col = get_rewards_collection()
    doc = body.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/rewards/{reward_id}", response_model=RewardResponse)
async def get_reward(reward_id: str, _: dict = Depends(get_current_active_user)):
    col = get_rewards_collection()
    doc = await col.find_one({"_id": _oid(reward_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Reward not found")
    return _str(doc)


@router.put("/rewards/{reward_id}", response_model=RewardResponse)
async def update_reward(
    reward_id: str, body: RewardUpdate, _: dict = Depends(get_manager_or_admin)
):
    col = get_rewards_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await col.update_one({"_id": _oid(reward_id)}, {"$set": data})
    doc = await col.find_one({"_id": _oid(reward_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Reward not found")
    return _str(doc)


@router.delete("/rewards/{reward_id}", status_code=204)
async def delete_reward(reward_id: str, _: dict = Depends(get_manager_or_admin)):
    col = get_rewards_collection()
    result = await col.delete_one({"_id": _oid(reward_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found")
