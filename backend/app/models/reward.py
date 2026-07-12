from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class RewardCreate(BaseModel):
    name: str
    description: str
    points_cost: int
    stock: int
    image_url: Optional[str] = None


class RewardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    points_cost: Optional[int] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None


class RewardResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    description: str
    points_cost: int
    stock: int
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class RedemptionResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    employee_id: str
    reward_id: str
    reward: Optional[RewardResponse] = None
    points_deducted: int
    redeemed_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
