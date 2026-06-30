// RCA/frontend/src/services/ddm/admin-service.js
import { apiClient } from "../api-client.js";

// Users
export async function getUsers() {
  const response = await apiClient.get("/api/ddm/admin/users/");
  return response.data;
}
export async function createUser(data) {
  const response = await apiClient.post("/api/ddm/admin/users/", data);
  return response.data;
}
export async function updateUser(id, data) {
  const response = await apiClient.put(`/api/ddm/admin/users/${id}`, data);
  return response.data;
}
export async function deleteUser(id) {
  await apiClient.delete(`/api/ddm/admin/users/${id}`);
}
export async function revokePasscode(id) {
  const response = await apiClient.post(`/api/ddm/admin/users/${id}/revoke-passcode`);
  return response.data;
}
export async function bulkRevokePasscodes(ids) {
  const response = await apiClient.post("/api/ddm/admin/users/bulk-revoke-passcodes", ids);
  return response.data;
}

// Groups
export async function fetchGroups() {
  const response = await apiClient.get("/api/ddm/admin/groups/");
  return response.data;
}

// Files (admin)
export async function getFiles() {
  const response = await apiClient.get("/api/ddm/admin/");
  return response.data;
}
export async function deleteFile(id) {
  await apiClient.delete(`/api/ddm/admin/${id}`);
}
export async function bulkDeleteFiles(ids) {
  await apiClient.delete("/api/ddm/admin/bulk", { data: ids });
}

// Upload requests
export async function getUploadRequests() {
  const response = await apiClient.get("/api/ddm/admin/upload-requests");
  return response.data;
}
export async function approveUploadRequest(fileId) {
  await apiClient.post(`/api/ddm/admin/upload-requests/${fileId}/approve`);
}
export async function rejectUploadRequest(fileId) {
  await apiClient.post(`/api/ddm/admin/upload-requests/${fileId}/reject`);
}

// Announcements
export async function fetchAnnouncements() {
  const response = await apiClient.get("/api/ddm/admin/announcements/");
  return response.data;
}
export async function createAnnouncement(data) {
  const response = await apiClient.post("/api/ddm/admin/announcements/", data);
  return response.data;
}
export async function updateAnnouncement(id, data) {
  const response = await apiClient.put(`/api/ddm/admin/announcements/${id}`, data);
  return response.data;
}
export async function deleteAnnouncement(id) {
  await apiClient.delete(`/api/ddm/admin/announcements/${id}`);
}
export async function bulkDeleteAnnouncements(ids) {
  await apiClient.delete("/api/ddm/admin/announcements/bulk", { data: ids });
}

// Settings
export async function fetchSettings() {
  const response = await apiClient.get("/api/ddm/admin/settings");
  return response.data;
}
export async function updateSettings(data) {
  const response = await apiClient.put("/api/ddm/admin/settings", data);
  return response.data;
}

// Audit Log
export async function fetchAuditLogs(params = {}) {
  // params: page, per_page, date_from, date_to, admin_filter, action_filter
  const response = await apiClient.get("/api/ddm/admin/audit-log", { params });
  return response.data;
}
// end of RCA/frontend/src/services/ddm/admin-service.js