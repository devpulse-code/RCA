// RCA/frontend/src/services/ddm/ai-service.js
import { apiClient } from "../api-client.js";

export const aiService = {
  /**
   * Send a chat message to the AI assistant.
   * @param {string} message
   * @param {boolean} contentSearchEnabled
   * @param {number|null} fileId - optional file context
   * @returns {Promise<Object>}
   */
  async chat(message, contentSearchEnabled, fileId = null) {
    const payload = {
      message,
      content_search_enabled: contentSearchEnabled,
    };
    if (fileId) payload.file_id = fileId;
    const response = await apiClient.post("/api/ddm/ai/chat", payload);
    return response.data;
  },
};
// end of RCA/frontend/src/services/ddm/ai-service.js