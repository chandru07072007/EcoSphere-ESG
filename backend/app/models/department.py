from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class DepartmentCreate(BaseModel):
    name: str
    code: str
    head_id: Optional[str] = None
    parent_id: Optional[str] = None
    employee_count: int = 0
    status: str = Field(default="active", pattern="^(active|inactive)$")


class DepartmentResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    code: str
    head_id: Optional[str] = None
    parent_id: Optional[str] = None
    employee_count: int = 0
    status: str = "active"
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    head_id: Optional[str] = None
    parent_id: Optional[str] = None
    employee_count: Optional[int] = None
    status: Optional[str] = None
