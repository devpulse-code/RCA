# RCA/backend/src/modules/ddm/services/audit_service.py
import json
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.modules.ddm.models.audit_log import AuditLog


async def log_audit(
    db: AsyncSession,
    action: str,
    admin_username: str | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
):
    entry = AuditLog(
        action=action,
        admin_username=admin_username,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(entry)
    await db.commit()
# end of RCA/backend/src/modules/ddm/services/audit_service.py