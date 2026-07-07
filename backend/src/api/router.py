# RCA/backend/src/api/router.py
from fastapi import APIRouter
from backend.src.modules.ddm.api.router import router as ddm_router

router = APIRouter(prefix="/api")

# Mount the entire DDM router under /api
router.include_router(ddm_router)

# end of RCA/backend/src/api/router.py