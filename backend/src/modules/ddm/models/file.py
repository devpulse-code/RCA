# RCA/backend/src/modules/ddm/models/file.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SAEnum, Table, ForeignKey
from sqlalchemy.orm import relationship
from backend.src.core.models.base import Base
from .base import TimestampMixin
import enum


class StorageType(str, enum.Enum):
    LOCAL = "local"
    TERABOX = "terabox"


file_group_association = Table(
    "file_group",
    Base.metadata,
    Column("file_id", Integer, ForeignKey("files.id"), primary_key=True),
    Column("group_id", Integer, ForeignKey("groups.id"), primary_key=True),
)


class File(Base, TimestampMixin):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    storage_type = Column(SAEnum(StorageType), nullable=False)
    local_path = Column(String, nullable=True)               # for local files
    encrypted_terabox_url = Column(String, nullable=True)    # encrypted URL
    mime_type = Column(String, nullable=True)
    size = Column(Integer, nullable=True)                    # in bytes
    uploader_id = Column(Integer, nullable=True)              # admin or user id
    uploader_type = Column(String, nullable=True)             # 'admin' or 'user'
    status = Column(String, default="active")                 # active, pending, rejected
    # File-group many-to-many
    groups = relationship("Group", secondary=file_group_association, back_populates="files")
# end of RCA/backend/src/modules/ddm/models/file.py