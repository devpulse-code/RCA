# RCA/backend/src/modules/ddm/api/ai/chat.py
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.services.search_service import search_files
from backend.src.modules.ddm.services.ai_service import (
    detect_intent,
    generate_search_query,
    summarize_file,
    answer_question,
    get_file_content_from_meili,
    keyword_fallback_search,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    content_search_enabled: bool = False
    file_id: Optional[int] = None

class ChatResponse(BaseModel):
    mode: str  # "file_finding", "content_qa", "summarize", "general", "fallback"
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
    AI chat endpoint powered by Gemini.
    Detects intent and routes to file search, content QA, or summarization.
    """
    user_message = payload.message.strip()
    file_id = payload.file_id
    content_search_enabled = payload.content_search_enabled
    group_ids = [g.id for g in user.groups] if hasattr(user, "groups") else []

    # ---- Step 1: intent detection ----
    intent = await detect_intent(user_message, file_id is not None)
    logger.info(f"AI chat intent: {intent} | user={user.id} | message={user_message[:100]}")

    # ---- Step 2: route based on intent ----
    try:
        # ========== SUMMARIZATION ==========
        if intent == "summarize" and file_id is not None:
            content = await get_file_content_from_meili(file_id)
            if not content:
                return ChatResponse(
                    mode="fallback",
                    message="I couldn't retrieve the content of that file. It may not be fully indexed yet.",
                )
            summary = await summarize_file(content, user_message)
            return ChatResponse(
                mode="summarize",
                answer=summary,
                citations=[f"File #{file_id}"],
            )

        # ========== CONTENT Q&A ==========
        if intent == "content_qa":
            if not content_search_enabled:
                # User hasn't enabled deep content search – fallback to file finding
                intent = "file_finding"
            else:
                # Perform content search to gather relevant files
                hits, total, _ = await search_files(
                    query=user_message,
                    group_ids=group_ids,
                    search_content=True,
                    page=1,
                    per_page=5,
                )
                if not hits:
                    return ChatResponse(
                        mode="fallback",
                        message="I couldn't find any relevant files to answer your question.",
                    )

                # Fetch full content for the top hits (Meilisearch may only return snippets)
                file_contents = []
                for hit in hits[:3]:  # Limit to top 3 to keep context manageable
                    fid = hit["id"]
                    full_content = await get_file_content_from_meili(fid)
                    if full_content:
                        file_contents.append({
                            "name": hit.get("name", "Unknown"),
                            "content": full_content[:3000],  # trim per file
                        })
                    else:
                        file_contents.append({
                            "name": hit.get("name", "Unknown"),
                            "content": hit.get("content", "")[:3000],
                        })

                if not file_contents:
                    return ChatResponse(
                        mode="fallback",
                        message="I found some files but couldn't read their contents.",
                        files=[{"id": h["id"], "name": h["name"], "description": h.get("description", "")} for h in hits],
                    )

                answer = await answer_question(user_message, file_contents)
                citations = [fc["name"] for fc in file_contents]
                return ChatResponse(
                    mode="content_qa",
                    answer=answer,
                    citations=citations,
                )

        # ========== FILE FINDING (default and fallback) ==========
        if intent == "file_finding" or intent == "general":
            # Use LLM to refine the search query
            refined_query = await generate_search_query(user_message)
            if not refined_query:
                refined_query = user_message  # LLM failed, use raw input

            hits, total, _ = await search_files(
                query=refined_query,
                group_ids=group_ids,
                search_content=content_search_enabled,
                page=1,
                per_page=5,
            )

            if hits:
                files = [{"id": h["id"], "name": h.get("name", ""), "description": h.get("description", "")} for h in hits]
                return ChatResponse(
                    mode="file_finding",
                    message=f"I found {len(files)} files that might help:",
                    files=files,
                )
            else:
                # No results – maybe user just chatting
                return ChatResponse(
                    mode="general",
                    message="I didn't find any matching files. You can ask me to search for something else, or if you've enabled content search, try a more specific question.",
                )

        # ========== UNKNOWN / FALLBACK ==========
        return ChatResponse(
            mode="fallback",
            message="I'm not sure how to help with that. Try asking me to find files, answer a question about your documents, or summarize a file.",
        )

    except Exception as e:
        logger.exception(f"AI chat error: {e}")
        return ChatResponse(
            mode="fallback",
            message="Something went wrong while processing your request. Please try again later.",
        )

# end of RCA/backend/src/modules/ddm/api/ai/chat.py