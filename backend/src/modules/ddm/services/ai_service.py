# RCA/backend/src/modules/ddm/services/ai_service.py
import logging
import httpx
import json
from backend.src.config.settings import settings

logger = logging.getLogger(__name__)

# Provider configuration
PROVIDER_GEMINI = "gemini"
PROVIDER_TOGETHER = "together"
PROVIDER_GROQ = "groq"

def _get_gemini_endpoint(model: str) -> str:
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.ddm_ai_api_key}"

def _get_together_endpoint() -> str:
    return "https://api.together.xyz/v1/completions"

def _get_groq_endpoint() -> str:
    return "https://api.groq.com/openai/v1/chat/completions"

async def _call_llm(prompt: str, system_instruction: str = None) -> str | None:
    """
    Generic call to the configured LLM provider.
    Returns the text response, or None on failure.
    """
    provider = settings.ddm_ai_provider.lower()
    api_key = settings.ddm_ai_api_key
    if not api_key:
        logger.warning("No AI API key configured")
        return None

    try:
        if provider == PROVIDER_GEMINI:
            return await _call_gemini(prompt, system_instruction)
        elif provider == PROVIDER_TOGETHER:
            return await _call_together(prompt, system_instruction)
        elif provider == PROVIDER_GROQ:
            return await _call_groq(prompt, system_instruction)
        else:
            logger.error(f"Unknown AI provider: {provider}")
            return None
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return None

async def _call_gemini(prompt: str, system_instruction: str = None) -> str | None:
    model = settings.ddm_ai_model
    url = _get_gemini_endpoint(model)
    headers = {"Content-Type": "application/json"}
    contents = [{"parts": [{"text": prompt}]}]
    if system_instruction:
        # Gemini uses 'system_instruction' field at top level
        payload = {"contents": contents, "system_instruction": {"parts": [{"text": system_instruction}]}}
    else:
        payload = {"contents": contents}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code != 200:
            logger.error(f"Gemini API error {resp.status_code}: {resp.text}")
            return None
        data = resp.json()
        # Extract text from response
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"]
        return None

async def _call_together(prompt: str, system_instruction: str = None) -> str | None:
    # Stub for Together AI
    logger.warning("Together AI not implemented – falling back")
    return None

async def _call_groq(prompt: str, system_instruction: str = None) -> str | None:
    # Stub for Groq
    logger.warning("Groq not implemented – falling back")
    return None


# --- AI functions used by endpoints ---

async def generate_search_query(user_message: str) -> str | None:
    """
    Uses LLM to turn natural language into a concise search query string.
    Returns the query string, or None if it fails (to trigger fallback).
    """
    system = (
        "You are a search query generator for a file management system. "
        "The user will ask for files in natural language. "
        "Convert their request into a short, precise search query suitable for a Meilisearch engine. "
        "Return ONLY the query string, no additional text, no quotes."
    )
    result = await _call_llm(user_message, system_instruction=system)
    if result:
        return result.strip()
    return None

async def answer_question(user_message: str, file_contents: list[dict]) -> str | None:
    """
    file_contents: list of dicts with 'name' and 'content' (truncated to ~2000 chars each).
    Returns a synthesized answer with citations, or None.
    """
    if not file_contents:
        return "I couldn't find any relevant files to answer your question."

    # Build context from top files
    context_parts = []
    for f in file_contents:
        name = f["name"]
        content = f.get("content", "")[:2000]  # limit per file
        context_parts.append(f"--- File: {name} ---\n{content}")
    context = "\n\n".join(context_parts)

    prompt = (
        f"Use the following file contents to answer the user's question. "
        f"Answer concisely and cite the file names when you use information from them.\n\n"
        f"Context:\n{context}\n\n"
        f"User question: {user_message}\n\n"
        f"Answer:"
    )
    system = (
        "You are a helpful assistant that answers questions based only on the provided file contents. "
        "If the answer cannot be found, say so."
    )
    return await _call_llm(prompt, system_instruction=system)

async def keyword_fallback_search(query: str, group_ids: list[int]) -> list[dict]:
    """
    Fallback: use raw user message as search query and return top files.
    """
    from backend.src.modules.ddm.services.search_service import search_files
    hits, _, _ = await search_files(query=query, group_ids=group_ids, search_content=True, page=1, per_page=5)
    return [
        {"id": h["id"], "name": h.get("name", ""), "description": h.get("description", "")}
        for h in hits
    ]
# end of RCA/backend/src/modules/ddm/services/ai_service.py