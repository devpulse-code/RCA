// RCA/frontend/src/services/ddm/search-service.js
import { apiClient } from "../api-client.js";

export const searchService = {
  /**
   * Perform a fuzzy search.
   * @param {string} query
   * @param {boolean} content - whether to search file contents
   * @param {number} page
   * @param {number} perPage
   * @returns {Promise<{results: Array, total: number, page: number, total_pages: number, per_page: number}>}
   */
  async search(query, content = false, page = 1, perPage = 20) {
    const params = { q: query, content, page, per_page: perPage };
    const response = await apiClient.get("/api/ddm/search", { params });
    return response.data;
  }
};
// end of RCA/frontend/src/services/ddm/search-service.js