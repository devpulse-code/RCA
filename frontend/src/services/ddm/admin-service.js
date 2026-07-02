// RCA/frontend/src/services/ddm/admin-service.js
import { apiClient } from "../api-client.js";

// Users
export async function getUsers() {
  return apiClient.get("/ddm/admin/users/");
}
export async function createUser(data) {
  return apiClient.post("/ddm/admin/users/", data);
}
export async function updateUser(id, data) {
  return apiClient.put(`/ddm/admin/users/${id}`, data);
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

// Groups
export async function fetchGroups() {
  return apiClient.get("/ddm/admin/groups/");
}

// Files (admin)
export async function getFiles() {
  return apiClient.get("/ddm/admin/");
}
export async function deleteFile(id) {
  await apiClient.delete(`/ddm/admin/${id}`);
}
export async function bulkDeleteFiles(ids) {
  await apiClient.delete("/ddm/admin/bulk", { data: ids });
}

// Upload requests
export async function getUploadRequests() {
  return apiClient.get("/ddm/admin/upload-requests");
}
export async function approveUploadRequest(fileId) {
  await apiClient.post(`/ddm/admin/upload-requests/${fileId}/approve`);
}
export async function rejectUploadRequest(fileId) {
  await apiClient.post(`/ddm/admin/upload-requests/${fileId}/reject`);
}

// Announcements
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

// Settings
export async function fetchSettings() {
  return apiClient.get("/ddm/admin/settings");
}
export async function updateSettings(data) {
  return apiClient.put("/ddm/admin/settings", data);
}

// Audit Log
export async function fetchAuditLogs(params = {}) {
  return apiClient.get("/ddm/admin/audit-log", { params });
}
// end of RCA/frontend/src/services/ddm/admin-service.js