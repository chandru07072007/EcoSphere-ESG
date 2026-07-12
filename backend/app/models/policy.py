from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class PolicyCreate(BaseModel):
    title: str
    scope: str
    version: str
    content: str
    department_ids: List[str] = []


class PolicyUpdate(BaseModel):
    title: Optional[str] = None
    scope: Optional[str] = None
    version: Optional[str] = None
    content: Optional[str] = None
    department_ids: Optional[List[str]] = None


class PolicyResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    scope: str
    version: str
    content: str
    department_ids: List[str] = []
    acknowledgement_count: int = 0
    total_required: int = 0
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class AcknowledgementResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    policy_id: str
    employee_id: str
    employee_name: Optional[str] = None
    acknowledged_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class AuditCreate(BaseModel):
    policy_id: str
    department_id: str
    findings: str
    auditor_id: str
    date: datetime


class AuditResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    policy_id: str
    department_id: str
    findings: str
    auditor_id: str
    date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
