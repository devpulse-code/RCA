# RCA/backend/src/modules/ddm/api/admin/__init__.py
from fastapi import APIRouter
from .users import router as users_router
from .divisions import router as divisions_router          # was groups
from .files import router as files_router
from .upload_requests import router as upload_requests_router
from .announcements import router as announcements_router
from .settings import router as settings_router
from .audit_log import router as audit_log_router

admin_router = APIRouter()
admin_router.include_router(users_router)
admin_router.include_router(divisions_router)             # prefix now /divisions
admin_router.include_router(files_router)
admin_router.include_router(upload_requests_router)
admin_router.include_router(announcements_router)
admin_router.include_router(settings_router)
admin_router.include_router(audit_log_router)
# end of RCA/backend/src/modules/ddm/api/admin/__init__.py