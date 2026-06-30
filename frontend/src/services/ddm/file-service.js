// RCA/frontend/src/services/ddm/file-service.js
import { apiClient } from "../api-client.js";

export async function fetchUserFiles() {
  const response = await apiClient.get("/api/ddm/files");
  return response.data;
}

export async function downloadFile(fileId) {
  // For simple download, we can trigger a direct link; here we return the URL
  return `/api/ddm/api/files/${fileId}/download`;
}

export async function submitUploadRequest(formData) {
  const response = await apiClient.post("/api/ddm/files/request", formData);
  return response.data;
}

// Admin operations (can be in admin-service, but placed here for completeness)
export async function fetchFiles() {
  const response = await apiClient.get("/api/ddm/admin/");
  return response.data;
}

export async function deleteFile(fileId) {
  await apiClient.delete(`/api/ddm/admin/${fileId}`);
}

export async function bulkDeleteFiles(fileIds) {
  await apiClient.delete("/api/ddm/admin/bulk", { data: fileIds });
}

export async function replaceFile(fileId, formData) {
  const response = await apiClient.put(`/api/ddm/admin/${fileId}/content`, formData);
  return response.data;
}
// end of RCA/frontend/src/services/ddm/file-service.js