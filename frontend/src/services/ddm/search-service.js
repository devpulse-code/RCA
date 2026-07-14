// RCA/frontend/src/services/ddm/search-service.js
import { apiClient } from "../api-client.js";

export const searchService = {
  /**
   * Perform a fuzzy search with optional type filter.
   */
  async search(query, content = false, page = 1, perPage = 20, type = '') {
    const params = { q: query, content, page, per_page: perPage };
    if (type) params.type = type;
    const response = await apiClient.get("/api/ddm/search", { params });
    return response.data;
  }
};
// end of RCA/frontend/src/services/ddm/search-service.js