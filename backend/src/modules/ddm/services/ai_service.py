# RCA/backend/src/modules/ddm/services/ai_service.py
import logging
import httpx
import json
from backend.src.config.settings import settings
from backend.src.modules.ddm.services.search_service import search_files

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


# --- Intent detection ---
async def detect_intent(user_message: str, has_file_context: bool) -> str:
    """
    Classify the user's intent using the LLM.
    Returns one of: "file_finding", "content_qa", "summarize", "general"
    """
    system = (
        "You are an intent classifier for a document management AI. "
        "Classify the user's message into exactly one of these categories:\n"
        "- file_finding: user wants to locate files by name, type, or description\n"
        "- content_qa: user asks a question that requires reading inside documents\n"
        "- summarize: user wants a summary of a specific file (especially if a file is already attached)\n"
        "- general: casual conversation or small talk\n\n"
        "Respond with ONLY the category name, no extra text."
    )
    if has_file_context:
        prompt = f"User message (a file is attached): {user_message}"
    else:
        prompt = f"User message: {user_message}"

    result = await _call_llm(prompt, system_instruction=system)
    if result:
        result = result.strip().lower()
        if "summarize" in result:
            return "summarize"
        elif "content_qa" in result or "qa" in result:
            return "content_qa"
        elif "file_finding" in result or "file" in result:
            return "file_finding"
        else:
            return "general"
    # Fallback: simple keyword heuristic if LLM fails
    msg_lower = user_message.lower()
    if has_file_context and any(w in msg_lower for w in ["summarize", "summary", "summarise"]):
        return "summarize"
    if any(w in msg_lower for w in ["find", "search", "show", "list", "get", "locate"]):
        return "file_finding"
    if any(w in msg_lower for w in ["what", "how", "why", "explain", "describe", "define"]):
        return "content_qa"
    return "general"


# --- File content fetching from Meilisearch ---
async def get_file_content_from_meili(file_id: int) -> str | None:
    """
    Retrieve the full text content of a file from Meilisearch index.
    Assumes index name 'files' and field 'content'.
    """
    try:
        url = f"{settings.meili_url}/indexes/files/documents/{file_id}"
        headers = {"Authorization": f"Bearer {settings.meili_master_key}"}
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                doc = resp.json()
                return doc.get("content", "") or ""
            else:
                logger.warning(f"Meilisearch content fetch failed for file {file_id}: {resp.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error fetching content from Meilisearch: {e}")
        return None


# --- Summarization ---
async def summarize_file(file_content: str, user_message: str) -> str:
    """
    Summarize the content of a file. The user_message may contain instructions.
    """
    system = "You are a helpful assistant that summarizes documents concisely."
    prompt = (
        f"Please summarize the following document content. "
        f"The user said: \"{user_message}\"\n\n"
        f"Document content:\n{file_content[:4000]}\n\n"
        f"Summary:"
    )
    result = await _call_llm(prompt, system_instruction=system)
    return result or "Sorry, I couldn't generate a summary right now."


# --- Answer question with provided file contents ---
async def answer_question(user_message: str, file_contents: list[dict]) -> str:
    """
    file_contents: list of dicts with 'name' and 'content' (each already trimmed).
    Returns a synthesized answer with citations.
    """
    if not file_contents:
        return "I couldn't find any relevant files to answer your question."

    # Build context from provided files
    context_parts = []
    for f in file_contents:
        name = f["name"]
        content = f.get("content", "")
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
    result = await _call_llm(prompt, system_instruction=system)
    return result or "I wasn't able to generate an answer at this time."


# --- Generate search query (existing, kept as is) ---
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


# --- Keyword fallback search (existing, kept for potential use) ---
async def keyword_fallback_search(query: str, group_ids: list[int]) -> list[dict]:
    """
    Fallback: use raw user message as search query and return top files.
    """
    hits, _, _ = await search_files(query=query, group_ids=group_ids, search_content=True, page=1, per_page=5)
    return [
        {"id": h["id"], "name": h.get("name", ""), "description": h.get("description", "")}
        for h in hits
    ]
# end of RCA/backend/src/modules/ddm/services/ai_service.py