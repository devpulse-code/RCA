# RCA/backend/src/modules/ddm/api/public.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.src.core.db.database import get_db
from backend.src.core.db.redis import get_redis
from backend.src.modules.ddm.models.file import File

router = APIRouter(tags=["public"])

@router.get("/ddm/public/stats")
async def get_public_stats(db: Session = Depends(get_db)):
    total_docs = db.query(File).count()

    redis = get_redis()
    active_sessions = 0
    try:
        keys = redis.keys("user_session:*")
        active_sessions = len(keys)
    except Exception:
        pass

    last_file = db.query(File).order_by(File.updated_at.desc()).first()
    last_update = last_file.updated_at.isoformat() if last_file and last_file.updated_at else None

    return {
        "documents_indexed": total_docs,
        "active_sessions": active_sessions,
        "last_update": last_update
    }
# end of RCA/backend/src/modules/ddm/api/public.py