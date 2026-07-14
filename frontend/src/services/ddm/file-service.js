// RCA/frontend/src/services/ddm/file-service.js
import { apiClient } from "../api-client.js";

export async function fetchUserFiles() {
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
  return await apiUpload("/ddm/files/request", formData);
}

/**
 * Upload file with progress callback.
 * @param {FormData} formData - must contain 'file' and optional 'name', 'description', 'group_ids'
 * @param {function} onProgress - callback(percentComplete: number)
 * @returns {Promise<object>} - response data
 */
export function uploadFileWithProgress(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/ddm/files/request');
    xhr.withCredentials = true;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        let detail = 'Upload failed';
        try {
          const err = JSON.parse(xhr.responseText);
          detail = err.detail || detail;
        } catch {}
        reject(new Error(detail));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.send(formData);
  });
}

// Admin operations (unchanged)
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