# RCA/backend/src/modules/ddm/models/announcement.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.src.core.models.base import Base
from .base import TimestampMixin


class Announcement(Base, TimestampMixin):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    expiry = Column(DateTime, nullable=True)
    # target groups stored in separate table announcement_groups
# end of RCA/backend/src/modules/ddm/models/announcement.py