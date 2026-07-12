from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.dependencies import PyObjectId


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    department_id: Optional[str] = None
    role: str = Field(default="employee", pattern="^(admin|manager|employee)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: str
    hashed_password: str
    role: str = "employee"
    department_id: Optional[str] = None
    xp: int = 0
    points: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class UserResponse(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: str
    role: str
    department_id: Optional[str] = None
    xp: int = 0
    points: int = 0
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    department_id: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
