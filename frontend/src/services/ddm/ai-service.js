// RCA/frontend/src/services/ddm/ai-service.js
import { apiClient } from "../api-client.js";

export const aiService = {
  async chat(message, contentSearchEnabled, fileId = null) {
    const payload = {
      message,
      content_search_enabled: contentSearchEnabled,
    };
    if (fileId) payload.file_id = fileId;
    // apiClient.post returns the parsed JSON directly
    return await apiClient.post("/ddm/ai/chat", payload);
  },
};
// end of RCA/frontend/src/services/ddm/ai-service.js