# RCA/backend/src/modules/ddm/api/admin/settings.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_admin
from backend.src.modules.ddm.models.system_setting import SystemSetting
from backend.src.modules.ddm.services.audit_service import log_audit
from backend.src.core.db.redis import get_redis
import json

router = APIRouter(tags=["admin-settings"])

DEFAULTS = {
    "session_duration_hours": "8",
    "session_inactivity_minutes": "30",
    "single_session_mode": "false",
    "ddm_ai_enabled": "true",
    "ddm_admin_upload_limit_mb": "500",
    "ddm_user_upload_limit_mb": "100",
    "audit_log_retention_days": "1095",  # 3 years
}

@router.get("/settings")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(select(SystemSetting))
    db_settings = {s.key: s.value for s in result.scalars().all()}
    # Merge with defaults for any missing keys
    merged = {**DEFAULTS, **db_settings}
    return merged


@router.put("/settings")
async def update_settings(
    request: Request,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
    redis=Depends(get_redis),
):
    allowed_keys = set(DEFAULTS.keys())
    for key, value in payload.items():
        if key not in allowed_keys:
            raise HTTPException(status_code=400, detail=f"Unknown setting: {key}")
        # Upsert the setting
        setting = await db.get(SystemSetting, key)
        if setting:
            setting.value = str(value)
        else:
            db.add(SystemSetting(key=key, value=str(value)))
    await db.commit()

    # Invalidate Redis cache for settings (optional)
    await redis.delete("system_settings_cache")

    await log_audit(
        db,
        action="update_system_settings",
        admin_username=admin.username,
        target_type="system",
        target_id="settings",
        details=payload,
        ip_address=request.client.host,
    )
    return {"message": "Settings updated"}
# end of RCA/backend/src/modules/ddm/api/admin/settings.py