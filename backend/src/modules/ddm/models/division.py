# RCA/backend/src/modules/ddm/models/division.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.src.core.models.base import Base
from .base import TimestampMixin


class Division(Base, TimestampMixin):
    __tablename__ = "groups"   # keep table name for compatibility

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    files = relationship(
        "File",
        secondary="file_group",
        back_populates="groups"
    )

    users = relationship(
        "User",
        secondary="user_group",
        back_populates="groups"
    )

    announcements = relationship(
        "Announcement",
        secondary="announcement_groups",
        back_populates="groups"
    )
# end of RCA/backend/src/modules/ddm/models/division.py