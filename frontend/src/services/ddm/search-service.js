// RCA/frontend/src/services/ddm/search-service.js
import { apiClient } from "../api-client.js";

export const searchService = {
  async search(query, content = false, page = 1, perPage = 20, type = '') {
    const params = { q: query, content, page, per_page: perPage };
    if (type) params.type = type;
    // apiClient.get already parses and returns the response JSON
    return await apiClient.get("/ddm/search", { params });
  }
};
// end of RCA/frontend/src/services/ddm/search-service.js