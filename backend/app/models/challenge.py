from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class ChallengeCreate(BaseModel):
    title: str
    description: str
    category_id: str
    difficulty: str = Field(pattern="^(easy|medium|hard|expert)$")
    xp_reward: int
    points_reward: int
    deadline: datetime
    department_id: Optional[str] = None


class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    difficulty: Optional[str] = None
    xp_reward: Optional[int] = None
    points_reward: Optional[int] = None
    deadline: Optional[datetime] = None
    department_id: Optional[str] = None
    status: Optional[str] = None


class ChallengeResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    description: str
    category_id: str
    difficulty: str
    xp_reward: int
    points_reward: int
    deadline: Optional[datetime] = None
    department_id: Optional[str] = None
    status: str = "draft"
    participant_count: int = 0
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class ChallengeParticipationCreate(BaseModel):
    challenge_id: str
    employee_id: str
    notes: Optional[str] = None


class ChallengeParticipationResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    challenge_id: str
    employee_id: str
    status: str = "enrolled"
    progress: int = Field(default=0, ge=0, le=100)
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
