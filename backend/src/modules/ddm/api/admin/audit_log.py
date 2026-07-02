# RCA/backend/src/modules/ddm/api/admin/audit_log.py
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_admin
from backend.src.modules.ddm.models.audit_log import AuditLog
from typing import Optional
from datetime import date, datetime

router = APIRouter(tags=["admin-audit-log"])

@router.get("/audit-log")
async def get_audit_logs(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin_filter: Optional[str] = None,
    action_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    query = select(AuditLog)
    filters = []

    # Helper: return None if value is "undefined" or empty
    def clean(s: Optional[str]) -> Optional[str]:
        if s is None:
            return None
        stripped = s.strip()
        if stripped.lower() == "undefined" or stripped == "":
            return None
        return stripped

    date_from_clean = clean(date_from)
    date_to_clean = clean(date_to)
    admin_filter_clean = clean(admin_filter)
    action_filter_clean = clean(action_filter)

    if date_from_clean:
        try:
            # Parse ISO date string (YYYY-MM-DD), ignore time part if present
            parsed_date = datetime.fromisoformat(date_from_clean).date()
            filters.append(AuditLog.timestamp >= parsed_date)
        except ValueError:
            pass  # ignore invalid date

    if date_to_clean:
        try:
            parsed_date = datetime.fromisoformat(date_to_clean).date()
            # Include the whole day: timestamp <= end of that day
            filters.append(AuditLog.timestamp <= parsed_date)
        except ValueError:
            pass

    if admin_filter_clean:
        filters.append(AuditLog.admin_username == admin_filter_clean)

    if action_filter_clean:
        filters.append(AuditLog.action == action_filter_clean)

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
        "total_pages": max(1, -(-total // per_page)),
    }
# end of RCA/backend/src/modules/ddm/api/admin/audit_log.py