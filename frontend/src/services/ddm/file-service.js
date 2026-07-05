// RCA/frontend/src/services/ddm/file-service.js
import { apiClient } from "../api-client.js";

export async function fetchUserFiles() {
  // Remove the leading "/api" — apiClient already adds it
  return await apiClient.get("/ddm/files");
}

export async function downloadFile(fileId) {
  const response = await fetch(`/api/ddm/files/${fileId}/download`, { credentials: 'include' });
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'download';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

export async function submitUploadRequest(formData) {
  const { apiUpload } = await import("../api-client.js");
  // Same here – remove the "/api" prefix
  return await apiUpload("/ddm/files/request", formData);
}

// Admin operations (unchanged – they already use correct paths)
export async function fetchFiles() {
  return await apiClient.get("/ddm/admin/");
}

export async function deleteFile(fileId) {
  await apiClient.delete(`/ddm/admin/${fileId}`);
}

export async function bulkDeleteFiles(fileIds) {
  await apiClient.delete("/ddm/admin/bulk", { data: fileIds });
}

export async function replaceFile(fileId, formData) {
  const response = await fetch(`/api/ddm/admin/${fileId}/content`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) throw new Error('File replacement failed');
  return response.json();
}
// end of RCA/frontend/src/services/ddm/file-service.js