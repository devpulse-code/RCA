# RCA/backend/src/modules/ddm/models/base.py
from sqlalchemy import Column, DateTime, func
from backend.src.core.models.base import Base
import datetime


class TimestampMixin:
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
# end of RCA/backend/src/modules/ddm/models/base.py