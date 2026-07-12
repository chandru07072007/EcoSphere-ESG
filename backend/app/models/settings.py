from typing import Optional
from pydantic import BaseModel, Field


class OrgSettings(BaseModel):
    auto_emission: bool = True
    evidence_required: bool = True
    badge_auto_award: bool = True
    e_weight: float = Field(default=40.0, ge=0, le=100)
    s_weight: float = Field(default=30.0, ge=0, le=100)
    g_weight: float = Field(default=30.0, ge=0, le=100)


class OrgSettingsUpdate(BaseModel):
    auto_emission: Optional[bool] = None
    evidence_required: Optional[bool] = None
    badge_auto_award: Optional[bool] = None
    e_weight: Optional[float] = Field(default=None, ge=0, le=100)
    s_weight: Optional[float] = Field(default=None, ge=0, le=100)
    g_weight: Optional[float] = Field(default=None, ge=0, le=100)
