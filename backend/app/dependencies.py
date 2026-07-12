from typing import Optional, Annotated
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema

from app.config import settings
from app.database import get_users_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class PyObjectId(str):
    """Custom type for MongoDB ObjectId that serializes as string."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_wrap_validator_function(
            cls._validate,
            core_schema.str_schema(),
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def _validate(cls, value: any, handler) -> "PyObjectId":
        if isinstance(value, ObjectId):
            return cls(str(value))
        str_value = handler(value)
        if not ObjectId.is_valid(str_value):
            raise ValueError(f"Invalid ObjectId: {str_value}")
        return cls(str_value)

    def __repr__(self) -> str:
        return f"PyObjectId({super().__repr__()})"


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        if email is None or user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    users_col = get_users_collection()
    user = await users_col.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


async def get_admin_user(current_user: dict = Depends(get_current_active_user)):
    if current_user.get("role") not in ("admin",):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


async def get_manager_or_admin(current_user: dict = Depends(get_current_active_user)):
    if current_user.get("role") not in ("admin", "manager"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin access required",
        )
    return current_user
