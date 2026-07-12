from fastapi import APIRouter, Depends, HTTPException

from app.database import get_settings_collection
from app.dependencies import get_current_active_user, get_manager_or_admin
from app.models.settings import OrgSettings, OrgSettingsUpdate

router = APIRouter()

_SETTINGS_KEY = {"_type": "org_settings"}


@router.get("", response_model=OrgSettings)
async def get_settings(_: dict = Depends(get_current_active_user)):
    col = get_settings_collection()
    doc = await col.find_one(_SETTINGS_KEY)
    if not doc:
        return OrgSettings()
    return OrgSettings(**{k: v for k, v in doc.items() if k != "_id" and k != "_type"})


@router.put("", response_model=OrgSettings)
async def update_settings(
    body: OrgSettingsUpdate, _: dict = Depends(get_manager_or_admin)
):
    col = get_settings_collection()
    current_doc = await col.find_one(_SETTINGS_KEY) or {}
    current = OrgSettings(
        **{k: v for k, v in current_doc.items() if k not in ("_id", "_type")}
    )

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    merged = current.model_dump()
    merged.update(update_data)

    # Validate weights sum to 100
    e = merged.get("e_weight", 40.0)
    s = merged.get("s_weight", 30.0)
    g = merged.get("g_weight", 30.0)
    total = round(e + s + g, 6)
    if abs(total - 100.0) > 0.001:
        raise HTTPException(
            status_code=422,
            detail=f"e_weight + s_weight + g_weight must equal 100. Got: {total}",
        )

    await col.update_one(
        _SETTINGS_KEY,
        {"$set": {**merged, **_SETTINGS_KEY}},
        upsert=True,
    )
    return OrgSettings(**merged)
