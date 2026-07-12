from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class EmissionFactorCreate(BaseModel):
    name: str
    source_type: str = Field(pattern="^(purchase|manufacturing|fleet|expense)$")
    coefficient: float
    unit: str
    description: Optional[str] = None
    effective_date: datetime


class EmissionFactorResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    source_type: str
    coefficient: float
    unit: str
    description: Optional[str] = None
    effective_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class EmissionFactorUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[str] = None
    coefficient: Optional[float] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    effective_date: Optional[datetime] = None
