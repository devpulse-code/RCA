# RCA/backend/src/modules/ddm/api/admin/audit_log.py
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_admin
from backend.src.modules.ddm.models.audit_log import AuditLog
from typing import Optional

router = APIRouter(tags=["admin-audit-log"])

@router.get("/audit-log")
async def get_audit_logs(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    date_from: Optional[str] = None,   # ISO format
    date_to: Optional[str] = None,
    admin_filter: Optional[str] = None,
    action_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    query = select(AuditLog)
    filters = []
    if date_from:
        filters.append(AuditLog.timestamp >= date_from)
    if date_to:
        filters.append(AuditLog.timestamp <= date_to)
    if admin_filter:
        filters.append(AuditLog.admin_username == admin_filter)
    if action_filter:
        filters.append(AuditLog.action == action_filter)

    if filters:
        query = query.where(*filters)

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    logs = result.scalars().all()

    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "action": log.action,
            "admin_username": log.admin_username,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": log.details,
            "ip_address": log.ip_address,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, -(-total // per_page)),  # ceil
    }
# end of RCA/backend/src/modules/ddm/api/admin/audit_log.py