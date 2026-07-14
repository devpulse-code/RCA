// RCA/frontend/src/services/ddm/notification-service.js
import { apiClient } from "../api-client.js";

export async function fetchNotifications() {
  return await apiClient.get("/ddm/notifications");
}

export async function markNotificationsRead(ids) {
  return await apiClient.put("/ddm/notifications/read", { ids });
}
// end of RCA/frontend/src/services/ddm/notification-service.js