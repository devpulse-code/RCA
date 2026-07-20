# RCA/backend/src/modules/ddm/services/ai_service.py
import logging
import httpx
from backend.src.config.settings import settings

logger = logging.getLogger(__name__)

PROVIDER_GEMINI = "gemini"
PROVIDER_TOGETHER = "together"
PROVIDER_GROQ = "groq"

def _get_gemini_endpoint(model: str, api_key: str) -> str:
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

def _get_together_endpoint() -> str:
    return "https://api.together.xyz/v1/completions"

def _get_groq_endpoint() -> str:
    return "https://api.groq.com/openai/v1/chat/completions"

async def _call_llm(prompt: str, system_instruction: str = None, ai_settings: dict = None) -> str | None:
    """
    Generic call to the configured LLM provider.
    Accepts an optional `ai_settings` dictionary with keys:
      - provider, api_key, model
    Falls back to global settings if not provided.
    """
    if ai_settings is None:
        ai_settings = {}

    provider = ai_settings.get("provider") or settings.ddm_ai_provider
    api_key = ai_settings.get("api_key") or settings.ddm_ai_api_key
    model = ai_settings.get("model") or settings.ddm_ai_model

    if not api_key:
        logger.warning("No AI API key configured")
        return None

    try:
        if provider.lower() == PROVIDER_GEMINI:
            return await _call_gemini(prompt, system_instruction, model, api_key)
        elif provider.lower() == PROVIDER_TOGETHER:
            return await _call_together(prompt, system_instruction, model, api_key)
        elif provider.lower() == PROVIDER_GROQ:
            return await _call_groq(prompt, system_instruction, model, api_key)
        else:
            logger.error(f"Unknown AI provider: {provider}")
            return None
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return None

async def _call_gemini(prompt: str, system_instruction: str, model: str, api_key: str) -> str | None:
    url = _get_gemini_endpoint(model, api_key)
    headers = {"Content-Type": "application/json"}
    contents = [{"parts": [{"text": prompt}]}]
    if system_instruction:
        payload = {"contents": contents, "system_instruction": {"parts": [{"text": system_instruction}]}}
    else:
        payload = {"contents": contents}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code != 200:
            logger.error(f"Gemini API error {resp.status_code}: {resp.text}")
            return None
        data = resp.json()
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"]
        return None

async def _call_together(prompt: str, system_instruction: str, model: str, api_key: str) -> str | None:
    # Placeholder – implement according to Together API docs
    logger.warning("Together AI not implemented")
    return None

async def _call_groq(prompt: str, system_instruction: str, model: str, api_key: str) -> str | None:
    # Placeholder – implement according to Groq API docs
    logger.warning("Groq not implemented")
    return None


async def detect_intent(user_message: str, has_file_context: bool, ai_settings: dict = None) -> str:
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

    result = await _call_llm(prompt, system_instruction=system, ai_settings=ai_settings)
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
    # Fallback heuristic
    msg_lower = user_message.lower()
    if has_file_context and any(w in msg_lower for w in ["summarize", "summary", "summarise"]):
        return "summarize"
    if any(w in msg_lower for w in ["find", "search", "show", "list", "get", "locate"]):
        return "file_finding"
    if any(w in msg_lower for w in ["what", "how", "why", "explain", "describe", "define"]):
        return "content_qa"
    return "general"


async def get_file_content_from_meili(file_id: int) -> str | None:
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


async def summarize_file(file_content: str, user_message: str, ai_settings: dict = None) -> str:
    system = "You are a helpful assistant that summarizes documents concisely."
    prompt = (
        f"Please summarize the following document content. "
        f"The user said: \"{user_message}\"\n\n"
        f"Document content:\n{file_content[:4000]}\n\n"
        f"Summary:"
    )
    result = await _call_llm(prompt, system_instruction=system, ai_settings=ai_settings)
    return result or "Sorry, I couldn't generate a summary right now."


async def answer_question(user_message: str, file_contents: list[dict], ai_settings: dict = None) -> str:
    if not file_contents:
        return "I couldn't find any relevant files to answer your question."

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
    result = await _call_llm(prompt, system_instruction=system, ai_settings=ai_settings)
    return result or "I wasn't able to generate an answer at this time."


async def generate_search_query(user_message: str, ai_settings: dict = None) -> str | None:
    system = (
        "You are a search query generator for a file management system. "
        "The user will ask for files in natural language. "
        "Convert their request into a short, precise search query suitable for a Meilisearch engine. "
        "Return ONLY the query string, no additional text, no quotes."
    )
    result = await _call_llm(user_message, system_instruction=system, ai_settings=ai_settings)
    if result:
        return result.strip()
    return None


async def keyword_fallback_search(query: str, group_ids: list[int]) -> list[dict]:
    # Reuse existing search
    from backend.src.modules.ddm.services.search_service import search_files
    hits, _, _ = await search_files(query=query, group_ids=group_ids, search_content=True, page=1, per_page=5)
    return [
        {"id": h["id"], "name": h.get("name", ""), "description": h.get("description", "")}
        for h in hits
    ]

# end of RCA/backend/src/modules/ddm/services/ai_service.py