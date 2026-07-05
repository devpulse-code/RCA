// RCA/frontend/src/services/ddm/admin-service.js
import { apiClient } from "../api-client.js";

// --------------- Utility to ensure an array from API response ---------------
function asArray(response) {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object') {
    // Common wrapping keys
    for (const key of ['data', 'files', 'results', 'items']) {
      if (Array.isArray(response[key])) return response[key];
    }
  }
  // Fallback: return empty array so .map() never fails
  return [];
}

// --------------- Users ---------------
export async function getUsers() {
  return asArray(await apiClient.get("/ddm/admin/users/"));
}
export async function createUser(data) {
  return apiClient.post("/ddm/admin/users/", data);
}
export async function updateUser(id, data) {
  return apiClient.patch(`/ddm/admin/users/${id}`, data);
}
export async function deleteUser(id) {
  await apiClient.delete(`/ddm/admin/users/${id}`);
}
export async function revokePasscode(id) {
  return apiClient.post(`/ddm/admin/users/${id}/revoke-passcode`);
}
export async function bulkRevokePasscodes(ids) {
  return apiClient.post("/ddm/admin/users/bulk-revoke-passcodes", ids);
}

// --------------- Groups ---------------
export async function fetchGroups() {
  const data = await apiClient.get("/ddm/admin/groups/");
  return asArray(data);
}

// --------------- Files (admin) ---------------
export async function getFiles() {
  const data = await apiClient.get("/ddm/admin/");
  return asArray(data);
}
export async function deleteFile(id) {
  await apiClient.delete(`/ddm/admin/${id}`);
}
export async function bulkDeleteFiles(ids) {
  await apiClient.delete("/ddm/admin/bulk", { data: ids });
}
export async function uploadFile(formData) {
  const response = await fetch('/api/ddm/admin/', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    let msg = `Upload failed (${response.status})`;
    try {
      const err = await response.json();
      msg = err.detail || err.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return response.json();
}

// --------------- Upload requests ---------------
export async function getUploadRequests() {
  return apiClient.get("/ddm/admin/upload-requests");
}
export async function approveUploadRequest(fileId) {
  await apiClient.post(`/ddm/admin/upload-requests/${fileId}/approve`);
}
export async function rejectUploadRequest(fileId) {
  await apiClient.post(`/ddm/admin/upload-requests/${fileId}/reject`);
}

// --------------- Announcements ---------------
export async function fetchAnnouncements() {
  return apiClient.get("/ddm/admin/announcements/");
}
export async function createAnnouncement(data) {
  return apiClient.post("/ddm/admin/announcements/", data);
}
export async function updateAnnouncement(id, data) {
  return apiClient.put(`/ddm/admin/announcements/${id}`, data);
}
export async function deleteAnnouncement(id) {
  await apiClient.delete(`/ddm/admin/announcements/${id}`);
}
export async function bulkDeleteAnnouncements(ids) {
  await apiClient.delete("/ddm/admin/announcements/bulk", { data: ids });
}

// --------------- Settings ---------------
export async function fetchSettings() {
  return apiClient.get("/ddm/admin/settings");
}
export async function updateSettings(data) {
  return apiClient.put("/ddm/admin/settings", data);
}

// --------------- Audit Log ---------------
export async function fetchAuditLogs(params = {}) {
  return apiClient.get("/ddm/admin/audit-log", { params });
}
// end of RCA/frontend/src/services/ddm/admin-service.js