# RCA/backend/src/modules/ddm/models/admin.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.src.core.models.base import Base
from .base import TimestampMixin


class Admin(Base, TimestampMixin):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    must_change_password = Column(Boolean, default=True)
    totp_secret = Column(String, nullable=True)
    totp_enabled = Column(Boolean, default=False)
    recovery_codes_hashed = Column(String, nullable=True)  # JSON list of bcrypt hashes
    locked_until = Column(DateTime, nullable=True)
    failed_attempts = Column(Integer, default=0)
# end of RCA/backend/src/modules/ddm/models/admin.py