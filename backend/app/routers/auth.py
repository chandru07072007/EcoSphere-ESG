from datetime import datetime, timedelta
from typing import Any, Dict

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_users_collection
from app.dependencies import get_current_active_user
from app.models.user import Token, UserCreate, UserResponse, UserUpdate
from app.services.email_service import email_service

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: Dict[str, Any], expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _serialize_user(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    col = get_users_collection()
    existing = await col.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    now = datetime.utcnow()
    doc = {
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": hash_password(user_in.password),
        "role": user_in.role,
        "department_id": user_in.department_id,
        "xp": 0,
        "points": 0,
        "is_active": True,
        "created_at": now,
    }
    result = await col.insert_one(doc)
    user_id = str(result.inserted_id)

    # Fire welcome email (non-blocking)
    await email_service.send_welcome_email(user_in.email, user_in.name)

    token = create_access_token(
        {"sub": user_in.email, "user_id": user_id, "role": user_in.role}
    )
    return Token(access_token=token, token_type="bearer")


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    col = get_users_collection()
    user = await col.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    token = create_access_token(
        {"sub": user["email"], "user_id": str(user["_id"]), "role": user.get("role", "employee")}
    )
    return Token(access_token=token, token_type="bearer")


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_active_user)):
    return _serialize_user(current_user)


# ---------------------------------------------------------------------------
# PUT /auth/me
# ---------------------------------------------------------------------------
@router.put("/me", response_model=UserResponse)
async def update_me(
    update: UserUpdate,
    current_user: dict = Depends(get_current_active_user),
):
    col = get_users_collection()
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    await col.update_one(
        {"_id": current_user["_id"]}, {"$set": update_data}
    )
    updated = await col.find_one({"_id": current_user["_id"]})
    return _serialize_user(updated)
