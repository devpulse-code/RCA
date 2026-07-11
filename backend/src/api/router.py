# RCA/backend/src/api/router.py
from fastapi import APIRouter
from backend.src.modules.ddm.api.router import router as ddm_router
from backend.src.modules.ddm.api.public import router as public_router

router = APIRouter(prefix="/api")

# DDM sub‑router under /api/ddm
router.include_router(ddm_router)

# Public endpoints under /api/public (no authentication needed)
router.include_router(public_router, prefix="/public")

# end of RCA/backend/src/api/router.py