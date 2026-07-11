# RCA/backend/src/modules/ddm/models/announcement.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from backend.src.core.models.base import Base
from .base import TimestampMixin

# Association table for Announcement <-> Group many‑to‑many
announcement_group_association = Table(
    "announcement_groups",
    Base.metadata,
    Column("announcement_id", Integer, ForeignKey("announcements.id"), primary_key=True),
    Column("group_id", Integer, ForeignKey("groups.id"), primary_key=True),
)

class Announcement(Base, TimestampMixin):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    expiry = Column(DateTime, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)

    groups = relationship(
        "Group",
        secondary=announcement_group_association,
        back_populates="announcements"
    )
# end of RCA/backend/src/modules/ddm/models/announcement.py