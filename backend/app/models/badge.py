from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class BadgeCreate(BaseModel):
    name: str
    description: str
    icon: str
    rarity: str = Field(pattern="^(common|rare|epic|legendary)$")
    unlock_rule_type: str = Field(pattern="^(xp_threshold|challenge_count)$")
    unlock_rule_value: int


class BadgeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    rarity: Optional[str] = None
    unlock_rule_type: Optional[str] = None
    unlock_rule_value: Optional[int] = None


class BadgeResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    description: str
    icon: str
    rarity: str
    unlock_rule_type: str
    unlock_rule_value: int
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class EmployeeBadgeResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    employee_id: str
    badge_id: str
    badge: Optional[BadgeResponse] = None
    awarded_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
