# RCA/backend/src/modules/ddm/services/search_service.py
import logging
from meilisearch import Client
from backend.src.config.settings import settings

logger = logging.getLogger(__name__)

INDEX_NAME = "ddm_files"

_client = Client(settings.meili_url, settings.meili_master_key)

# Ensure the index exists (idempotent)
try:
    _client.get_index(INDEX_NAME)
except Exception:
    _client.create_index(INDEX_NAME, {"primaryKey": "id"})
    _client.index(INDEX_NAME).update_searchable_attributes(["name", "description", "content"])
    _client.index(INDEX_NAME).update_filterable_attributes(["group_ids"])
    logger.info(f"Created Meilisearch index '{INDEX_NAME}'")

index = _client.index(INDEX_NAME)


async def index_file(file_id: int, name: str, description: str, group_ids: list[int], content: str = ""):
    """Index or replace a file document in Meilisearch."""
    document = {
        "id": file_id,
        "name": name,
        "description": description,
        "content": content,
        "group_ids": group_ids,
    }
    try:
        index.add_documents([document], primary_key="id")
        logger.info(f"Indexed file {file_id}")
    except Exception as e:
        logger.error(f"Failed to index file {file_id}: {e}")


async def update_file_metadata(file_id: int, name: str, description: str, group_ids: list[int]):
    """Partially update metadata fields (name, description, groups)."""
    updates = {}
    if name is not None:
        updates["name"] = name
    if description is not None:
        updates["description"] = description
    if group_ids is not None:
        updates["group_ids"] = group_ids
    if not updates:
        return
    try:
        index.update_documents([{"id": file_id, **updates}], primary_key="id")
        logger.info(f"Updated metadata for file {file_id}")
    except Exception as e:
        logger.error(f"Failed to update file metadata {file_id}: {e}")


async def update_file_content(file_id: int, content: str):
    """Update only the content field (used after text extraction)."""
    try:
        index.update_documents([{"id": file_id, "content": content}], primary_key="id")
        logger.info(f"Updated content for file {file_id}")
    except Exception as e:
        logger.error(f"Failed to update content for file {file_id}: {e}")


async def delete_file_index(file_id: int):
    """Remove a file from the search index."""
    try:
        index.delete_document(str(file_id))
        logger.info(f"Deleted file {file_id} from index")
    except Exception as e:
        logger.error(f"Failed to delete file {file_id} from index: {e}")


async def search_files(query: str, group_ids: list[int], search_content: bool = False, page: int = 1, per_page: int = 20):
    """
    Perform a fuzzy search with group filtering and pagination.
    Returns (results, total_count, total_pages).
    """
    filter_expr = ""
    if group_ids:
        # Union: file visible if it shares any group with user
        group_filters = [f"group_ids = {gid}" for gid in group_ids]
        filter_expr = " OR ".join(group_filters)
    else:
        # If user has no groups, they see files with empty group_ids? Not typical; return empty.
        return [], 0, 0

    # Fields to search
    if search_content:
        attributes_to_search = ["name", "description", "content"]
    else:
        attributes_to_search = ["name", "description"]

    options = {
        "filter": filter_expr,
        "page": page,
        "hitsPerPage": per_page,
        "attributesToSearchOn": attributes_to_search,
    }

    try:
        results = index.search(query, options)
        hits = results["hits"]
        total = results.get("totalHits", len(hits))
        total_pages = results.get("totalPages", max(1, -(-total // per_page)))  # ceil division
        return hits, total, total_pages
    except Exception as e:
        logger.error(f"Search error: {e}")
        return [], 0, 0
# end of RCA/backend/src/modules/ddm/services/search_service.py