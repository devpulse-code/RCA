# RCA/backend/src/modules/ddm/schemas/user.py
from pydantic import BaseModel, Field
from typing import Optional, List


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    contact: Optional[str] = None
    groups: List[str] = []  # group names


class UserUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    groups: Optional[List[str]] = None


class UserOut(BaseModel):
    id: int
    name: str
    contact: Optional[str]
    groups: List[str]
    passcode_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PasscodeResponse(BaseModel):
    user_id: int
    passcode: str  # displayed once
# end of RCA/backend/src/modules/ddm/schemas/user.py