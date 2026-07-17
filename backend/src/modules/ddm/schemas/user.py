# RCA/backend/src/modules/ddm/schemas/user.py
from pydantic import BaseModel, Field
from typing import Optional, List


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    contact: Optional[str] = None
    divisions: List[str] = []               # was groups


class UserUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    divisions: Optional[List[str]] = None   # was groups


class UserOut(BaseModel):
    id: int
    name: str
    contact: Optional[str]
    divisions: List[str]                    # was groups
    passcode_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PasscodeResponse(BaseModel):
    user_id: int
    passcode: str


class SetPasscodeRequest(BaseModel):        # new for custom passcode
    passcode: str = Field(..., min_length=8, max_length=64)
# end of RCA/backend/src/modules/ddm/schemas/user.py