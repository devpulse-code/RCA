# RCA/backend/src/modules/ddm/api/announcements/announcements.py
from fastapi import APIRouter

router = APIRouter(tags=["user-announcements"])

# Placeholder endpoint – will be fully implemented later
@router.get("/")
async def list_announcements():
    return []
# end of RCA/backend/src/modules/ddm/api/announcements/announcements.py