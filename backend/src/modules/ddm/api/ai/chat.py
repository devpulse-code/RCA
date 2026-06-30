# RCA/backend/src/modules/ddm/api/ai/chat.py
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.services.ai_service import (
    generate_search_query,
    answer_question,
    keyword_fallback_search,
)
from backend.src.modules.ddm.services.search_service import search_files
from backend.src.config.settings import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ai"])

class ChatRequest(BaseModel):
    message: str
    content_search_enabled: bool = False  # must match user's toggle state

class ChatResponse(BaseModel):
    mode: str  # "file_finding" or "content_qa" or "fallback" or "error"
    message: str | None = None
    files: list[dict] = []  # list of {id, name, description}
    answer: str | None = None
    citations: list[str] = []  # file names cited in answer

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    payload: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    if not settings.ddm_ai_enabled:
        raise HTTPException(status_code=503, detail="AI assistant is disabled")

    user_group_ids = [g.id for g in user.groups]

    # Determine mode based on content toggle
    if payload.content_search_enabled:
        # Content Q&A mode
        # First, find top files using a keyword search from the user's message
        # We'll use the raw message as query to get candidate files
        try:
            from backend.src.modules.ddm.services.search_service import search_files
            hits, _, _ = await search_files(
                query=payload.message,
                group_ids=user_group_ids,
                search_content=True,
                page=1,
                per_page=3,
            )
        except Exception as e:
            logger.error(f"Search for AI failed: {e}")
            return ChatResponse(mode="error", message="Search failed. Please try again.")

        if not hits:
            return ChatResponse(mode="content_qa", message="No relevant files found to answer your question.", files=[])

        # Get full content for these top hits (already in search index)
        file_contents = []
        for hit in hits:
            # For content, we use the stored content from Meilisearch (the `content` field)
            # It's already returned in hits (we stored it), but we didn't include it in search results by default.
            # We need to fetch the full content from Meilisearch? Actually, we stored the whole content in the index,
            # but our search results only return a preview. To get full content we need a separate getDocument call.
            # For simplicity, we'll use the `content_preview` we already have; that's enough.
            # The spec says "only the top‑ranked search results (maximum 3 files) have their indexed text sent to the API."
            # We'll fetch the document from Meilisearch.
            try:
                from backend.src.modules.ddm.services.search_service import index
                doc = index.get_document(str(hit["id"]))
                content = doc.get("content", "")
            except Exception:
                content = ""
            file_contents.append({
                "id": hit["id"],
                "name": hit.get("name", ""),
                "content": content[:2000]  # truncate per spec
            })

        # Ask AI to answer
        answer = await answer_question(payload.message, file_contents)
        if answer is None:
            # fallback to keyword-based file suggestions
            fallback_files = await keyword_fallback_search(payload.message, user_group_ids)
            return ChatResponse(
                mode="fallback",
                message="AI service is currently unavailable. Here are files matching your keywords instead.",
                files=fallback_files,
            )

        citations = [f["name"] for f in file_contents]
        return ChatResponse(
            mode="content_qa",
            answer=answer,
            citations=citations,
            files=[],
        )

    else:
        # File finding mode (content toggle OFF)
        # Ask AI to generate a search query
        search_query = await generate_search_query(payload.message)
        if search_query is None:
            # Fallback to keyword matching using raw message
            files = await keyword_fallback_search(payload.message, user_group_ids)
            return ChatResponse(
                mode="fallback",
                message="AI service is currently unavailable. Here are files matching your keywords instead.",
                files=files,
            )

        # Execute search with AI-generated query
        try:
            hits, _, _ = await search_files(
                query=search_query,
                group_ids=user_group_ids,
                search_content=False,  # only name/description
                page=1,
                per_page=5,
            )
        except Exception as e:
            logger.error(f"Search after AI query failed: {e}")
            return ChatResponse(mode="error", message="Search failed. Please try again.")

        files = [{"id": h["id"], "name": h.get("name", ""), "description": h.get("description", "")} for h in hits]
        return ChatResponse(
            mode="file_finding",
            message=None,
            files=files,
        )
# end of RCA/backend/src/modules/ddm/api/ai/chat.py