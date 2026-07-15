# RCA/backend/src/modules/ddm/api/ai/chat.py
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.services.search_service import search_files

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    content_search_enabled: bool = False
    file_id: Optional[int] = None

class ChatResponse(BaseModel):
    mode: str  # "file_finding", "content_qa", "fallback"
    message: Optional[str] = None
    files: Optional[List[Dict[str, Any]]] = None
    answer: Optional[str] = None
    citations: Optional[List[str]] = None


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    request: Request,
    payload: ChatRequest,
    user=Depends(get_current_user),
):
    """
    Minimal AI chat endpoint. In a full implementation this would call an LLM.
    For now it returns a fallback response that suggests files based on the query.
    """
    # Perform a simple search to suggest files
    group_ids = [g.id for g in user.groups] if hasattr(user, "groups") else []
    hits, total, _ = await search_files(
        query=payload.message,
        group_ids=group_ids,
        search_content=payload.content_search_enabled,
        page=1,
        per_page=5,
    )

    suggested_files = []
    for hit in hits:
        suggested_files.append({
            "id": hit["id"],
            "name": hit.get("name", ""),
            "description": hit.get("description", ""),
        })

    if suggested_files:
        return ChatResponse(
            mode="file_finding",
            message="Here are some files that might help:",
            files=suggested_files,
        )
    else:
        return ChatResponse(
            mode="fallback",
            message="I couldn't find any matching files. Try refining your query.",
        )
# end of RCA/backend/src/modules/ddm/api/ai/chat.py