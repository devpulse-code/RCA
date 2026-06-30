// RCA/frontend/src/services/ddm/ai-service.js
import { apiClient } from "../api-client.js";

export const aiService = {
  /**
   * Send a chat message to the AI assistant.
   * @param {string} message
   * @param {boolean} contentSearchEnabled - current state of the content toggle
   * @returns {Promise<Object>} response shape: {mode, message, files, answer, citations}
   */
  async chat(message, contentSearchEnabled) {
    const response = await apiClient.post("/api/ddm/ai/chat", {
      message,
      content_search_enabled: contentSearchEnabled,
    });
    return response.data;
  },
};
// end of RCA/frontend/src/services/ddm/ai-service.js