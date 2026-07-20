# RCA/backend/src/modules/ddm/api/ai/chat.py
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.src.core.db.database import get_db          # <-- was missing
from backend.src.modules.ddm.models.system_setting import SystemSetting
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.services.search_service import search_files
from backend.src.modules.ddm.services.ai_service import (
    detect_intent,
    generate_search_query,
    summarize_file,
    answer_question,
    get_file_content_from_meili,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    content_search_enabled: bool = False
    file_id: Optional[int] = None

class ChatResponse(BaseModel):
    mode: str
    message: Optional[str] = None
    files: Optional[List[Dict[str, Any]]] = None
    answer: Optional[str] = None
    citations: Optional[List[str]] = None


async def get_ai_settings(db: AsyncSession = Depends(get_db)) -> dict:
    from backend.src.config.settings import settings as global_settings
    try:
        result = await db.execute(select(SystemSetting).where(
            SystemSetting.key.in_(("ddm_ai_enabled", "ddm_ai_provider", "ddm_ai_api_key", "ddm_ai_model"))
        ))
        rows = result.scalars().all()
        db_settings = {row.key: row.value for row in rows}
    except Exception as e:
        logger.error(f"Failed to load AI settings from DB: {e}")
        db_settings = {}

    merged = {
        "enabled": db_settings.get("ddm_ai_enabled", str(global_settings.ddm_ai_enabled)),
        "provider": db_settings.get("ddm_ai_provider", global_settings.ddm_ai_provider),
        "api_key": db_settings.get("ddm_ai_api_key", global_settings.ddm_ai_api_key),
        "model": db_settings.get("ddm_ai_model", global_settings.ddm_ai_model),
    }
    logger.debug(f"AI settings: {merged}")
    return merged


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    request: Request,
    payload: ChatRequest,
    user=Depends(get_current_user),
    ai_settings: dict = Depends(get_ai_settings),
):
    if ai_settings.get("enabled", "true").lower() != "true":
        return ChatResponse(
            mode="fallback",
            message="AI assistant is currently disabled by the administrator.",
        )

    user_message = payload.message.strip()
    file_id = payload.file_id
    content_search_enabled = payload.content_search_enabled
    group_ids = [g.id for g in user.groups] if hasattr(user, "groups") else []

    intent = await detect_intent(user_message, file_id is not None, ai_settings)
    logger.info(f"AI chat intent: {intent} | user={user.id} | message={user_message[:100]}")

    try:
        if intent == "summarize" and file_id is not None:
            content = await get_file_content_from_meili(file_id)
            if not content:
                return ChatResponse(mode="fallback", message="I couldn't retrieve the content of that file.")
            summary = await summarize_file(content, user_message, ai_settings)
            return ChatResponse(mode="summarize", answer=summary, citations=[f"File #{file_id}"])

        if intent == "content_qa":
            if not content_search_enabled:
                intent = "file_finding"
            else:
                hits, total, _ = await search_files(
                    query=user_message, group_ids=group_ids, search_content=True, page=1, per_page=5)
                if not hits:
                    return ChatResponse(mode="fallback", message="I couldn't find any relevant files.")
                file_contents = []
                for hit in hits[:3]:
                    fid = hit["id"]
                    full = await get_file_content_from_meili(fid)
                    file_contents.append({
                        "name": hit.get("name", "Unknown"),
                        "content": (full or hit.get("content", ""))[:3000]
                    })
                if not file_contents:
                    return ChatResponse(mode="fallback", message="I found files but couldn't read them.",
                                        files=[{"id": h["id"], "name": h["name"]} for h in hits])
                answer = await answer_question(user_message, file_contents, ai_settings)
                return ChatResponse(mode="content_qa", answer=answer, citations=[fc["name"] for fc in file_contents])

        if intent == "file_finding" or intent == "general":
            refined_query = await generate_search_query(user_message, ai_settings) or user_message
            hits, total, _ = await search_files(
                query=refined_query, group_ids=group_ids, search_content=content_search_enabled, page=1, per_page=5)
            if hits:
                files = [{"id": h["id"], "name": h["name"], "description": h.get("description", "")} for h in hits]
                return ChatResponse(mode="file_finding", message=f"I found {len(files)} files.", files=files)
            return ChatResponse(mode="general", message="I didn't find any matching files.")

        return ChatResponse(mode="fallback", message="I'm not sure how to help with that.")
    except Exception as e:
        logger.exception("AI chat error")
        return ChatResponse(mode="fallback", message="Something went wrong. Please try again later.")

# end of RCA/backend/src/modules/ddm/api/ai/chat.py