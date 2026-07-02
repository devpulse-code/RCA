// RCA/frontend/src/components/ddm/admin/file-table.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../../ui/toast.js";

export class FileTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.selected = new Set();
    this.load();
  }

  async load() {
    try {
      this.files = await AdminService.getFiles();
      this.render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    let html = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Files</h2>
        <div>
          <button id="btn-bulk-delete" class="bg-red-500 text-white px-3 py-1 rounded mr-2" disabled>Delete Selected</button>
        </div>
      </div>
      <table class="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all-files"></th>
            <th>Name</th>
            <th>Type</th>
            <th>Groups</th>
            <th>Size</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.files.map(f => `
            <tr data-id="${f.id}">
              <td><input type="checkbox" class="file-checkbox" value="${f.id}"></td>
              <td>${f.name}</td>
              <td>${f.storage_type}</td>
              <td>${(f.groups || []).join(', ')}</td>
              <td>${f.size ? (f.size/1024).toFixed(1)+' KB' : ''}</td>
              <td>${f.status}</td>
              <td>
                <button class="delete-file-btn text-red-600 hover:underline" data-id="${f.id}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    document.getElementById("select-all-files")?.addEventListener("change", (e) => {
      this.container.querySelectorAll(".file-checkbox").forEach(cb => cb.checked = e.target.checked);
      this.updateSelection();
    });
    this.container.querySelectorAll(".file-checkbox").forEach(cb => cb.addEventListener("change", () => this.updateSelection()));
    this.container.querySelectorAll(".delete-file-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id);
        if (confirm("Delete this file?")) {
          try {
            await AdminService.deleteFile(id);
            showToast("File deleted", "success");
            this.load();
          } catch (e) {
            showToast(e.message, "error");
          }
        }
      });
    });
    document.getElementById("btn-bulk-delete")?.addEventListener("click", async () => {
      const ids = Array.from(this.selected);
      if (ids.length && confirm(`Delete ${ids.length} files?`)) {
        try {
          await AdminService.bulkDeleteFiles(ids);
          showToast("Files deleted", "success");
          this.selected.clear();
          this.load();
        } catch (e) {
          showToast(e.message, "error");
        }
      }
    });
  }

  updateSelection() {
    this.selected.clear();
    this.container.querySelectorAll(".file-checkbox:checked").forEach(cb => this.selected.add(parseInt(cb.value)));
    const bulkBtn = document.getElementById("btn-bulk-delete");
    if (bulkBtn) bulkBtn.disabled = this.selected.size === 0;
  }
}
// end of RCA/frontend/src/components/ddm/admin/file-table.js