# RCA/backend/src/api/router.py
"""
API main router.

This router aggregates all module‑level routers (currently only DDM)
and exposes a health‑check endpoint.
"""

from fastapi import APIRouter

# Absolute import matching the container package layout:
# The code lives under /app/backend/src/, so the base package is backend.src.
from backend.src.modules.ddm.api.router import router as ddm_router
from backend.src.modules.ddm.api.auth.admin_login import router as auth_router
from backend.src.modules.ddm.api.auth.session import router as session_router

router = APIRouter()

# Mount the DDM router (which already has its own prefix="/api/ddm")
router.include_router(ddm_router)

# Mount the admin auth router under /api/auth
router.include_router(auth_router, prefix="/api/auth")

# Mount the session check endpoint under /api/ddm/auth (public)
router.include_router(session_router, prefix="/api/ddm/auth")


@router.get("/api/health", tags=["health"])
async def health_check():
    """
    Lightweight health endpoint.
    Returns a simple JSON status message.
    """
    return {"status": "ok", "service": "DDM-Backend"}
# end of RCA/backend/src/api/router.py