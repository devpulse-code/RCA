# RCA/backend/src/modules/ddm/schemas/announcement.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AnnouncementBase(BaseModel):
    title: str
    body: str
    expiry: Optional[datetime] = None
    group_ids: List[int] = []
    is_public: bool = False

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    expiry: Optional[datetime] = None
    group_ids: Optional[List[int]] = None
    is_public: Optional[bool] = None

class AnnouncementOut(BaseModel):
    id: int
    title: str
    body: str
    expiry: Optional[datetime] = None
    groups: List[str]  # group names
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
# end of RCA/backend/src/modules/ddm/schemas/announcement.py