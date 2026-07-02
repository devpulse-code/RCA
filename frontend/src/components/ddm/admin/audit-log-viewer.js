// RCA/frontend/src/components/ddm/admin/audit-log-viewer.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";

export default class AuditLogViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.logs = [];
    this.total = 0;
    this.page = 1;
    this.perPage = 50;
    this.render();
    this.load();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-xl font-semibold">Audit Log</h2>
        <div class="flex flex-wrap gap-2 items-center">
          <input type="date" id="filter-date-from" placeholder="From" class="border p-2">
          <input type="date" id="filter-date-to" placeholder="To" class="border p-2">
          <input type="text" id="filter-admin" placeholder="Admin username" class="border p-2">
          <input type="text" id="filter-action" placeholder="Action" class="border p-2">
          <button id="btn-apply-filters" class="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
        </div>
        <div id="audit-log-table-container"></div>
        <div id="audit-log-pagination"></div>
      </div>
    `;
    this.tableContainer = document.getElementById("audit-log-table-container");
    this.paginationContainer = document.getElementById("audit-log-pagination");

    document.getElementById("btn-apply-filters").addEventListener("click", () => this.load(1));
  }

  async load(page = this.page) {
    // Collect filter values, skip empty strings to avoid sending "undefined"
    const dateFrom = document.getElementById("filter-date-from")?.value.trim();
    const dateTo = document.getElementById("filter-date-to")?.value.trim();
    const adminFilter = document.getElementById("filter-admin")?.value.trim();
    const actionFilter = document.getElementById("filter-action")?.value.trim();

    const params = { page, per_page: this.perPage };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (adminFilter) params.admin_filter = adminFilter;
    if (actionFilter) params.action_filter = actionFilter;

    try {
      const data = await AdminService.fetchAuditLogs(params);
      this.logs = data.items;
      this.total = data.total;
      this.page = data.page;
      this.renderTable();
      this.renderPagination(data);
    } catch (e) {
      showToast("Failed to load audit logs", "error");
    }
  }

  renderTable() {
    if (!this.tableContainer) return;
    if (!this.logs.length) {
      this.tableContainer.innerHTML = "<p>No log entries found.</p>";
      return;
    }
    let html = `
      <table class="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Target</th>
            <th>Details</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          ${this.logs.map(log => `
            <tr>
              <td class="text-sm">${new Date(log.timestamp).toLocaleString()}</td>
              <td>${log.admin_username || ''}</td>
              <td>${log.action}</td>
              <td>${log.target_type} #${log.target_id}</td>
              <td class="text-xs">${JSON.stringify(log.details)}</td>
              <td>${log.ip_address || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    this.tableContainer.innerHTML = html;
  }

  renderPagination(data) {
    if (!this.paginationContainer) return;
    const { page, total_pages, total } = data;
    let html = `<div class="flex items-center space-x-2 mt-2 text-sm">`;
    html += `<span>${total} entries</span>`;
    html += `<button class="px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${page <= 1 ? 'disabled' : ''} data-page="${page-1}">Previous</button>`;
    html += `<span>Page ${page} of ${total_pages}</span>`;
    html += `<button class="px-3 py-1 border rounded ${page >= total_pages ? 'opacity-50 cursor-not-allowed' : ''}" ${page >= total_pages ? 'disabled' : ''} data-page="${page+1}">Next</button>`;
    html += `</div>`;
    this.paginationContainer.innerHTML = html;
    this.paginationContainer.querySelectorAll("button[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        const newPage = parseInt(btn.dataset.page);
        if (newPage >= 1 && newPage <= total_pages) this.load(newPage);
      });
    });
  }
}
// end of RCA/frontend/src/components/ddm/admin/audit-log-viewer.js