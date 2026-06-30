# RCA/backend/src/modules/ddm/services/text_extraction.py
import logging
import httpx
import os
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.core.db.database import async_session
from backend.src.modules.ddm.models.file import File
from backend.src.config.settings import settings

logger = logging.getLogger(__name__)

TIKA_URL = settings.tika_url.rstrip("/") + "/tika"


async def extract_text(file_path: str) -> str:
    """Send file to Apache Tika and return extracted text."""
    with open(file_path, "rb") as f:
        response = httpx.put(TIKA_URL, content=f.read(), headers={"Accept": "text/plain"})
    if response.status_code == 200:
        return response.text.strip()
    else:
        logger.warning(f"Tika extraction failed for {file_path}: {response.status_code}")
        return ""


async def extract_text_task(file_id: int):
    """Background task: extract text and push to Meilisearch."""
    try:
        async with async_session() as db:
            file_record = await db.get(File, file_id)
            if not file_record or not file_record.local_path:
                return
            from backend.src.modules.ddm.services.file_service import UPLOAD_DIR, TEMP_UPLOAD_DIR
            file_path = None
            for base in [UPLOAD_DIR, TEMP_UPLOAD_DIR]:
                candidate = os.path.join(base, file_record.local_path)
                if os.path.exists(candidate):
                    file_path = candidate
                    break
            if not file_path:
                logger.warning(f"File not found on disk for extraction: {file_record.id}")
                return

            extracted = await extract_text(file_path)
            if extracted:
                logger.info(f"Extracted {len(extracted)} chars from file {file_id}")
                # Phase 4: update Meilisearch content
                from backend.src.modules.ddm.services.search_service import update_file_content
                await update_file_content(file_id, extracted)
            else:
                logger.info(f"No text extracted from file {file_id}")
                # Mark content as empty to avoid stale old content
                from backend.src.modules.ddm.services.search_service import update_file_content
                await update_file_content(file_id, "")
    except Exception as e:
        logger.error(f"Text extraction error for file {file_id}: {e}")
# end of RCA/backend/src/modules/ddm/services/text_extraction.py