from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class CarbonTransactionCreate(BaseModel):
    source_type: str
    source_id: Optional[str] = None
    department_id: str
    amount_co2e: float
    date: datetime
    notes: Optional[str] = None
    auto_generated: bool = False


class CarbonTransactionResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    source_type: str
    source_id: Optional[str] = None
    department_id: str
    amount_co2e: float
    quantity: Optional[float] = None
    unit: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
    auto_generated: bool = False
    emission_factor_id: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class CarbonTransactionUpdate(BaseModel):
    amount_co2e: Optional[float] = None
    notes: Optional[str] = None
    date: Optional[datetime] = None
