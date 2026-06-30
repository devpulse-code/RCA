# RCA/backend/src/modules/ddm/schemas/file.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FileCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    storage_type: str              # 'local' or 'terabox'
    group_ids: List[int] = []      # group IDs allowed to see file
    terabox_url: Optional[str] = None


class FileOut(BaseModel):
    id: int
    name: str
    description: str
    storage_type: str
    mime_type: Optional[str]
    size: Optional[int]
    groups: List[str]              # group names
    uploader_type: Optional[str]
    uploader_id: Optional[int]
    status: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class UploadRequestCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    group_ids: List[int] = []


class UploadRequestOut(BaseModel):
    id: int
    name: str
    description: str
    mime_type: Optional[str]
    size: Optional[int]
    status: str
    uploader_id: Optional[int]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class FileReplace(BaseModel):
    """For replacing the content of an existing file record."""
    storage_type: Optional[str] = None   # if changed from local to terabox or vice versa (optional)
    terabox_url: Optional[str] = None
    file: Optional[bytes] = None         # not used as pydantic field – it's multipart
# end of RCA/backend/src/modules/ddm/schemas/file.py