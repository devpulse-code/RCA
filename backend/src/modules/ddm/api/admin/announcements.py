# RCA/backend/src/modules/ddm/api/admin/announcements.py
from fastapi import APIRouter

router = APIRouter(prefix="/announcements", tags=["admin-announcements"])

# Placeholder endpoint – to be fully implemented later
@router.get("/")
async def list_announcements():
    return []
# end of RCA/backend/src/modules/ddm/api/admin/announcements.py