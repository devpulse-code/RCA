# RCA/backend/src/modules/ddm/api/router.py
from fastapi import APIRouter, Request, Depends
from backend.src.core.db.database import get_db
from backend.src.core.db.redis import get_redis

router = APIRouter(prefix="/ddm")

# Admin sub-routers
from backend.src.modules.ddm.api.admin.users import router as admin_users_router
from backend.src.modules.ddm.api.admin.groups import router as admin_groups_router
from backend.src.modules.ddm.api.admin.files import router as admin_files_router
from backend.src.modules.ddm.api.admin.upload_requests import router as admin_upload_router
from backend.src.modules.ddm.api.admin.announcements import router as admin_announcements_router
from backend.src.modules.ddm.api.admin.settings import router as admin_settings_router
from backend.src.modules.ddm.api.admin.audit_log import router as admin_audit_log_router
from backend.src.modules.ddm.api.admin import router as admin_root_router

router.include_router(admin_root_router, prefix="/admin")
router.include_router(admin_users_router, prefix="/admin")
router.include_router(admin_groups_router, prefix="/admin")
router.include_router(admin_files_router, prefix="/admin")
router.include_router(admin_upload_router, prefix="/admin")
router.include_router(admin_announcements_router, prefix="/admin")
router.include_router(admin_settings_router, prefix="/admin")
router.include_router(admin_audit_log_router, prefix="/admin")

# Auth routes
from backend.src.modules.ddm.api.auth.passcode_login import router as passcode_router
from backend.src.modules.ddm.api.auth.admin_login import router as admin_login_router
from backend.src.modules.ddm.api.auth.session import router as session_router

router.include_router(passcode_router)
router.include_router(admin_login_router, prefix="/auth")
router.include_router(session_router, prefix="/auth")

# File routes
from backend.src.modules.ddm.api.files.download import router as download_router
from backend.src.modules.ddm.api.files.upload import router as upload_router
from backend.src.modules.ddm.api.files.list import router as list_router
router.include_router(download_router)
router.include_router(upload_router)
router.include_router(list_router)

# Search
from backend.src.modules.ddm.api.search.search import router as search_router
router.include_router(search_router)

# Announcements (user side, requires login)
from backend.src.modules.ddm.api.announcements.announcements import router as user_announcements_router
router.include_router(user_announcements_router)

# AI
from backend.src.modules.ddm.api.ai.chat import router as ai_router
router.include_router(ai_router, prefix="/ai")

# NOTE: public endpoints are now mounted in the top-level API router,
# so they are accessible at /api/public/stats and /api/public/announcements.

# end of RCA/backend/src/modules/ddm/api/router.py