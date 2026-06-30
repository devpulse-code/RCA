# RCA/backend/src/modules/ddm/api/router.py
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.core.db.database import get_db
from backend.src.core.db.redis import get_redis
from backend.src.core.utils.encryption import verify_password
from backend.src.modules.ddm.models.admin import Admin
from sqlalchemy import select
import uuid

router = APIRouter(prefix="/api/ddm")

# Temporary admin login (Phase 1 will replace with full TOTP flow)
@router.post("/auth/admin/login")
async def admin_login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    result = await db.execute(select(Admin).where(Admin.username == username))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = str(uuid.uuid4())
    await redis.set(f"admin_session:{session_id}", str(admin.id), ex=28800)

    response = {"message": "Login successful"}
    from fastapi.responses import JSONResponse
    resp = JSONResponse(content=response)
    resp.set_cookie(
        key="admin_session",
        value=session_id,
        httponly=True,
        secure=False,  # True for production
        samesite="strict",
        max_age=28800,
    )
    return resp

# Include admin routes
from backend.src.modules.ddm.api.admin.users import router as admin_users_router
from backend.src.modules.ddm.api.admin.groups import router as admin_groups_router
from backend.src.modules.ddm.api.admin.files import router as admin_files_router
from backend.src.modules.ddm.api.admin.upload_requests import router as admin_upload_router
from backend.src.modules.ddm.api.admin.announcements import router as admin_announcements_router
from backend.src.modules.ddm.api.admin.settings import router as admin_settings_router
from backend.src.modules.ddm.api.admin.audit_log import router as admin_audit_log_router

router.include_router(admin_users_router, prefix="/admin")
router.include_router(admin_groups_router, prefix="/admin")
router.include_router(admin_files_router, prefix="/admin")
router.include_router(admin_upload_router, prefix="/admin")
router.include_router(admin_announcements_router, prefix="/admin")
router.include_router(admin_settings_router, prefix="/admin")
router.include_router(admin_audit_log_router, prefix="/admin")

# Include file download (public with user session)
from backend.src.modules.ddm.api.files.download import router as download_router
router.include_router(download_router)

# Include upload routes (admin and user)
from backend.src.modules.ddm.api.files.upload import router as upload_router
router.include_router(upload_router)

# Include user file list
from backend.src.modules.ddm.api.files.list import router as list_router
router.include_router(list_router)

# Include search endpoint
from backend.src.modules.ddm.api.search.search import router as search_router
router.include_router(search_router)

# Include user announcements
from backend.src.modules.ddm.api.announcements.announcements import router as user_announcements_router
router.include_router(user_announcements_router)

# Include AI chat endpoint
from backend.src.modules.ddm.api.ai.chat import router as ai_router
router.include_router(ai_router, prefix="/ai")

# Temporary passcode login (Phase 1 will be replaced)
from backend.src.modules.ddm.api.auth.passcode_login import router as passcode_router
router.include_router(passcode_router)
# end of RCA/backend/src/modules/ddm/api/router.py