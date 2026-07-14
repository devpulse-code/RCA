// RCA/frontend/src/components/ddm/upload-tracker.js
import { fetchUserUploadRequests } from "../../services/ddm/file-service.js";

export default class UploadTracker {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.requests = [];
    this.load();
  }

  async load() {
    try {
      this.requests = await fetchUserUploadRequests();
    } catch (e) {
      this.requests = null;
    }
    this.render();
  }

  render() {
    if (!this.container) return;
    if (this.requests === null) {
      this.container.innerHTML = `<p class="text-red-400">Failed to load upload requests.</p>`;
      return;
    }
    if (!this.requests.length) {
      this.container.innerHTML = ``;
      return;
    }

    let html = `
      <div class="bg-[var(--bg-secondary)] rounded shadow p-4">
        <h3 class="font-semibold mb-2">Your Upload Requests</h3>
        <table class="upload-tracker-table">
          <thead><tr><th>File Name</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
    `;
    this.requests.forEach(req => {
      const statusClass = req.status === 'approved' ? 'status-approved' : req.status === 'rejected' ? 'status-rejected' : 'status-pending';
      html += `
        <tr>
          <td>${req.file_name || req.name || '—'}</td>
          <td class="${statusClass}">${req.status}</td>
          <td>${new Date(req.created_at).toLocaleDateString()}</td>
        </tr>
      `;
    });
    html += `</tbody></table></div>`;
    this.container.innerHTML = html;
  }
}
// end of RCA/frontend/src/components/ddm/upload-tracker.js