# RCA/backend/src/modules/ddm/models/notification.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.src.core.models.base import Base
from .base import TimestampMixin


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False)

    user = relationship("User", backref="notifications")
# end of RCA/backend/src/modules/ddm/models/notification.py