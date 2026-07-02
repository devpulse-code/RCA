# RCA/backend/src/modules/ddm/models/group.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.src.core.models.base import Base
from .base import TimestampMixin
from .user import user_group_association
from .file import file_group_association
from .announcement import announcement_group_association  # new import

class Group(Base, TimestampMixin):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    users = relationship("User", secondary=user_group_association, back_populates="groups")
    files = relationship("File", secondary=file_group_association, back_populates="groups")
    announcements = relationship(
        "Announcement",
        secondary=announcement_group_association,
        back_populates="groups"
    )
# end of RCA/backend/src/modules/ddm/models/group.py