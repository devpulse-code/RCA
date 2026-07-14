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
        <h2 class="text-primary">Audit Log</h2>
        <div class="flex flex-wrap gap-2 items-center">
          <input type="date" id="filter-date-from" placeholder="From" class="form-input" style="width:auto">
          <input type="date" id="filter-date-to" placeholder="To" class="form-input" style="width:auto">
          <input type="text" id="filter-admin" placeholder="Admin username" class="form-input" style="width:auto">
          <input type="text" id="filter-action" placeholder="Action" class="form-input" style="width:auto">
          <button id="btn-apply-filters" class="btn btn-primary">Filter</button>
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
    this.tableContainer.innerHTML = `
      <div class="table-container">
        <p style="padding:1rem;color:var(--text-secondary);">
          No log entries found.
        </p>
      </div>
    `;
    return;
  }

  this.tableContainer.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Target</th>
            <th>Details</th>
            <th>IP Address</th>
          </tr>
        </thead>

        <tbody>
          ${this.logs.map(log => `
            <tr>
              <td>${new Date(log.timestamp).toLocaleString()}</td>
              <td>${log.admin_username ?? ""}</td>
              <td>${log.action}</td>
              <td>${log.target_type} #${log.target_id}</td>
              <td><code>${JSON.stringify(log.details)}</code></td>
              <td>${log.ip_address ?? ""}</td>
            </tr>
          `).join("")}
        </tbody>

      </table>
    </div>
  `;
}

  renderPagination(data) {

  if (!this.paginationContainer) return;

  const { page, total_pages, total } = data;

  this.paginationContainer.innerHTML = `
    <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-top:1rem;
        gap:1rem;
        flex-wrap:wrap;
    ">

      <span style="color:var(--text-secondary);">
        ${total} entries
      </span>

      <div style="display:flex;gap:.75rem;align-items:center;">

        <button
          class="btn"
          data-page="${page-1}"
          ${page<=1 ? "disabled" : ""}
        >
          Previous
        </button>

        <span style="color:var(--text-primary);">
          Page ${page} of ${total_pages}
        </span>

        <button
          class="btn"
          data-page="${page+1}"
          ${page>=total_pages ? "disabled" : ""}
        >
          Next
        </button>

      </div>

    </div>
  `;

  this.paginationContainer
      .querySelectorAll("button[data-page]")
      .forEach(btn => {

          btn.onclick = () => {

              const newPage = Number(btn.dataset.page);

              if(newPage>=1 && newPage<=total_pages){

                  this.load(newPage);

              }

          };

      });
  }
} 
// end of RCA/frontend/src/components/ddm/admin/audit-log-viewer.js