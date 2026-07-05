# backend/src/modules/ddm/models/group.py
from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from backend.src.core.models.base import Base
from .base import TimestampMixin

class Group(Base, TimestampMixin):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # Many‑to‑many with File
    files = relationship(
        "File",
        secondary="file_group",   # table name defined in file model
        back_populates="groups"
    )

    # Many‑to‑many with User
    users = relationship(
        "User",
        secondary="user_group",
        back_populates="groups"
    )

    # Many‑to‑many with Announcement
    announcements = relationship(
        "Announcement",
        secondary="announcement_groups",
        back_populates="groups"
    )
# end of backend/src/modules/ddm/models/group.py