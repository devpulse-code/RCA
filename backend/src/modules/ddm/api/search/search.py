# RCA/backend/src/modules/ddm/api/search/search.py
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.services.search_service import search_files
from typing import List, Dict, Any

router = APIRouter(tags=["search"])


@router.get("/search")
async def search(
    request: Request,
    q: str = Query(..., description="Search query"),
    content: bool = Query(False, description="Enable full-text content search"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user),
):
    """
    Fuzzy search files. Group filter is applied automatically.
    Pagination: page and per_page.
    """
    group_ids = [g.id for g in user.groups] if hasattr(user, "groups") else []
    hits, total, total_pages = await search_files(
        query=q,
        group_ids=group_ids,
        search_content=content,
        page=page,
        per_page=per_page,
    )

    # Format results to match FileOut-like structure (id, name, description, groups)
    results = []
    for hit in hits:
        results.append({
            "id": hit["id"],
            "name": hit.get("name", ""),
            "description": hit.get("description", ""),
            # For groups we could fetch from DB if needed, but we stored group_ids only.
            # The spec doesn't require group names in search results; we can return group_ids.
            "group_ids": hit.get("group_ids", []),
            "content_preview": hit.get("content", "")[:200] if content else "",
        })

    return {
        "results": results,
        "total": total,
        "page": page,
        "total_pages": total_pages,
        "per_page": per_page,
    }
# end of RCA/backend/src/modules/ddm/api/search/search.py