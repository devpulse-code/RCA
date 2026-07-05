# RCA/backend/src/modules/ddm/api/admin/__init__.py

from fastapi import APIRouter, Depends
from backend.src.modules.ddm.api.deps import get_current_admin

router = APIRouter()

@router.get("/")
async def admin_root(admin=Depends(get_current_admin)):
    """
    Admin panel health check.
    Verifies that the admin session is valid and returns the admin username.
    """
    return {"status": "ok", "admin": admin.username}

# end of RCA/backend/src/modules/ddm/api/admin/__init__.py