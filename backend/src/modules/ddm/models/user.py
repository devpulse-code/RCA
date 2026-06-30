# RCA/backend/src/modules/ddm/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from backend.src.core.models.base import Base
from .base import TimestampMixin

user_group_association = Table(
    "user_group",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("group_id", Integer, ForeignKey("groups.id"), primary_key=True),
)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=True)
    encrypted_passcode = Column(String, nullable=False)
    passcode_active = Column(Boolean, default=True)
    groups = relationship("Group", secondary=user_group_association, back_populates="users")
# end of RCA/backend/src/modules/ddm/models/user.py