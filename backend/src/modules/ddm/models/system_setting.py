# RCA/backend/src/modules/ddm/models/system_setting.py
from sqlalchemy import Column, String
from backend.src.core.models.base import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
# end of RCA/backend/src/modules/ddm/models/system_setting.py