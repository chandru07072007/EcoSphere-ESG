from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class CSRActivityCreate(BaseModel):
    title: str
    description: str
    category_id: str
    department_id: str
    xp_reward: int = 100
    points_reward: int = 50
    start_date: datetime
    end_date: datetime


class CSRActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    department_id: Optional[str] = None
    xp_reward: Optional[int] = None
    points_reward: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CSRActivityResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    description: str
    category_id: str
    department_id: str
    xp_reward: int = 100
    points_reward: int = 50
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    participant_count: int = 0
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class CSRParticipationCreate(BaseModel):
    activity_id: str
    employee_id: str
    notes: Optional[str] = None


class CSRParticipationResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    activity_id: str
    employee_id: str
    status: str = "pending"
    proof_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
