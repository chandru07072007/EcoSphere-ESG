from datetime import datetime
from typing import List, Optional

import pandas as pd
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import (
    get_carbon_transactions_collection,
    get_database,
    get_emission_factors_collection,
    get_environmental_goals_collection,
    get_product_esg_profiles_collection,
    get_settings_collection,
)
from app.dependencies import get_current_active_user, get_manager_or_admin
from app.models.carbon_transaction import (
    CarbonTransactionCreate,
    CarbonTransactionResponse,
    CarbonTransactionUpdate,
)
from app.services.emission_engine import emission_engine

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
# CARBON TRANSACTIONS
# ==========================================================================

@router.get("/carbon-transactions", response_model=List[CarbonTransactionResponse])
async def list_carbon_transactions(
    department_id: Optional[str] = None,
    source_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_carbon_transactions_collection()
    query: dict = {}
    if department_id:
        query["department_id"] = department_id
    if source_type:
        query["source_type"] = source_type
    docs = (
        await col.find(query)
        .sort("date", -1)
        .skip(skip)
        .limit(limit)
        .to_list(length=limit)
    )
    return [_str(d) for d in docs]


@router.post("/carbon-transactions", response_model=CarbonTransactionResponse, status_code=201)
async def create_carbon_transaction(
    body: CarbonTransactionCreate,
    current_user: dict = Depends(get_current_active_user),
):
    db = get_database()
    settings_col = get_settings_collection()
    cfg = await settings_col.find_one({"_type": "org_settings"}) or {}
    auto_emission: bool = cfg.get("auto_emission", True)

    if auto_emission and not body.auto_generated:
        # Run through emission engine to compute CO2e from factor
        try:
            doc = await emission_engine.calculate_and_store(
                source_type=body.source_type,
                source_id=body.source_id,
                department_id=body.department_id,
                quantity=body.amount_co2e,  # treat amount_co2e as quantity here
                unit="units",
                db=db,
                notes=body.notes,
            )
        except ValueError as exc:
            # Fallback: store manually if no factor
            col = get_carbon_transactions_collection()
            doc = body.model_dump()
            doc["created_at"] = datetime.utcnow()
            result = await col.insert_one(doc)
            doc["_id"] = result.inserted_id
    else:
        col = get_carbon_transactions_collection()
        doc = body.model_dump()
        doc["created_at"] = datetime.utcnow()
        result = await col.insert_one(doc)
        doc["_id"] = result.inserted_id

    return _str(doc)


@router.get("/carbon-transactions/{tx_id}", response_model=CarbonTransactionResponse)
async def get_carbon_transaction(tx_id: str, _: dict = Depends(get_current_active_user)):
    col = get_carbon_transactions_collection()
    doc = await col.find_one({"_id": _oid(tx_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return _str(doc)


@router.put("/carbon-transactions/{tx_id}", response_model=CarbonTransactionResponse)
async def update_carbon_transaction(
    tx_id: str,
    body: CarbonTransactionUpdate,
    _: dict = Depends(get_manager_or_admin),
):
    col = get_carbon_transactions_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await col.update_one({"_id": _oid(tx_id)}, {"$set": data})
    doc = await col.find_one({"_id": _oid(tx_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return _str(doc)


@router.delete("/carbon-transactions/{tx_id}", status_code=204)
async def delete_carbon_transaction(
    tx_id: str, _: dict = Depends(get_manager_or_admin)
):
    col = get_carbon_transactions_collection()
    result = await col.delete_one({"_id": _oid(tx_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")


# ==========================================================================
# CARBON TRACKING (aggregated)
# ==========================================================================

@router.get("/carbon-tracking")
async def carbon_tracking(
    department_id: Optional[str] = None,
    group_by: str = Query("source_type", pattern="^(source_type|department_id|date)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    _: dict = Depends(get_current_active_user),
):
    col = get_carbon_transactions_collection()
    query: dict = {}
    if department_id:
        query["department_id"] = department_id
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = start_date
        if end_date:
            query["date"]["$lte"] = end_date

    raw = await col.find(query).to_list(length=None)
    if not raw:
        return {"aggregation": [], "total_co2e": 0}

    df = pd.DataFrame(raw)
    df["amount_co2e"] = pd.to_numeric(df.get("amount_co2e", 0), errors="coerce").fillna(0)

    if group_by == "date":
        df["date"] = pd.to_datetime(df.get("date", pd.NaT))
        df["date_key"] = df["date"].dt.strftime("%Y-%m-%d")
        agg = (
            df.groupby("date_key")["amount_co2e"]
            .sum()
            .reset_index()
            .rename(columns={"date_key": "label", "amount_co2e": "total_co2e"})
        )
    else:
        agg = (
            df.groupby(group_by)["amount_co2e"]
            .sum()
            .reset_index()
            .rename(columns={group_by: "label", "amount_co2e": "total_co2e"})
        )

    agg["total_co2e"] = agg["total_co2e"].round(4)
    return {
        "aggregation": agg.to_dict(orient="records"),
        "total_co2e": round(float(df["amount_co2e"].sum()), 4),
    }


# ==========================================================================
# ENVIRONMENTAL GOALS
# ==========================================================================

@router.get("/goals")
async def list_goals(
    department_id: Optional[str] = None,
    _: dict = Depends(get_current_active_user),
):
    col = get_environmental_goals_collection()
    query: dict = {}
    if department_id:
        query["department_id"] = department_id
    docs = await col.find(query).to_list(length=None)
    return [_str(d) for d in docs]


@router.post("/goals", status_code=201)
async def create_goal(body: dict, _: dict = Depends(get_manager_or_admin)):
    col = get_environmental_goals_collection()
    body["created_at"] = datetime.utcnow()
    result = await col.insert_one(body)
    doc = await col.find_one({"_id": result.inserted_id})
    return _str(doc)


@router.get("/goals/{goal_id}")
async def get_goal(goal_id: str, _: dict = Depends(get_current_active_user)):
    col = get_environmental_goals_collection()
    doc = await col.find_one({"_id": _oid(goal_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Gap analysis
    dept_id: str = doc.get("department_id", "")
    target_pct: float = doc.get("target_reduction_pct", 0.0)
    baseline: float = doc.get("baseline_co2e", 0.0)

    tx_col = get_carbon_transactions_collection()
    pipeline = [
        {"$match": {"department_id": dept_id}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_co2e"}}},
    ]
    result = await tx_col.aggregate(pipeline).to_list(1)
    actual = result[0]["total"] if result else 0.0
    target_co2e = baseline * (1 - target_pct / 100)
    gap = actual - target_co2e

    doc["gap_analysis"] = {
        "actual_co2e": round(actual, 4),
        "target_co2e": round(target_co2e, 4),
        "gap_co2e": round(gap, 4),
        "on_track": gap <= 0,
    }
    return _str(doc)


@router.put("/goals/{goal_id}")
async def update_goal(
    goal_id: str, body: dict, _: dict = Depends(get_manager_or_admin)
):
    col = get_environmental_goals_collection()
    body.pop("_id", None)
    await col.update_one({"_id": _oid(goal_id)}, {"$set": body})
    doc = await col.find_one({"_id": _oid(goal_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _str(doc)


@router.delete("/goals/{goal_id}", status_code=204)
async def delete_goal(goal_id: str, _: dict = Depends(get_manager_or_admin)):
    col = get_environmental_goals_collection()
    result = await col.delete_one({"_id": _oid(goal_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")


# ==========================================================================
# PRODUCT ESG PROFILES
# ==========================================================================

@router.get("/product-profiles")
async def list_product_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_product_esg_profiles_collection()
    docs = await col.find().skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/product-profiles", status_code=201)
async def create_product_profile(body: dict, _: dict = Depends(get_manager_or_admin)):
    col = get_product_esg_profiles_collection()
    body["created_at"] = datetime.utcnow()
    result = await col.insert_one(body)
    doc = await col.find_one({"_id": result.inserted_id})
    return _str(doc)


@router.get("/product-profiles/{pid}")
async def get_product_profile(pid: str, _: dict = Depends(get_current_active_user)):
    col = get_product_esg_profiles_collection()
    doc = await col.find_one({"_id": _oid(pid)})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _str(doc)


@router.put("/product-profiles/{pid}")
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


@router.delete("/product-profiles/{pid}", status_code=204)
async def delete_product_profile(pid: str, _: dict = Depends(get_manager_or_admin)):
    col = get_product_esg_profiles_collection()
    result = await col.delete_one({"_id": _oid(pid)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
