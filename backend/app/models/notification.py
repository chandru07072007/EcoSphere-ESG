from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.dependencies import PyObjectId


class NotificationCreate(BaseModel):
    recipient_id: str
    type: str = Field(pattern="^(compliance|social|badge|policy|system)$")
    message: str
    link: Optional[str] = None


class NotificationResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    recipient_id: str
    type: str
    message: str
    link: Optional[str] = None
    read: bool = False
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
