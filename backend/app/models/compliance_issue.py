from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class ComplianceIssueCreate(BaseModel):
    title: str
    description: str
    severity: str = Field(pattern="^(low|medium|high|critical)$")
    owner_id: str
    due_date: datetime
    department_id: str
    category: Optional[str] = None


class ComplianceIssueUpdate(BaseModel):
    status: Optional[str] = Field(
        default=None, pattern="^(open|in_progress|resolved|closed)$"
    )
    resolution_notes: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    owner_id: Optional[str] = None
    due_date: Optional[datetime] = None
    department_id: Optional[str] = None
    category: Optional[str] = None


class ComplianceIssueResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    description: str
    severity: str
    owner_id: str
    due_date: Optional[datetime] = None
    department_id: str
    category: Optional[str] = None
    status: str = "open"
    resolution_notes: Optional[str] = None
    is_overdue: bool = False
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
