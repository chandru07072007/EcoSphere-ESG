from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ReportFilter(BaseModel):
    department_id: Optional[str] = None
    employee_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    module: Optional[str] = Field(default="all", pattern="^(E|S|G|all)$")
    category_id: Optional[str] = None
    challenge_id: Optional[str] = None


class ReportResponse(BaseModel):
    report_type: str
    data: Dict[str, Any] = {}
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    download_url: Optional[str] = None
