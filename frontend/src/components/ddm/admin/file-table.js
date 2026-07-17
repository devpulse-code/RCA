// RCA/frontend/src/components/ddm/admin/file-table.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";
import { openModal, confirmModal } from "../../ui/modal.js";
import FilePreviewPanel from "../file-preview-panel.js";

export class FileTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.selected = new Set();
    this.previewPanel = new FilePreviewPanel();
    this.load();
  }

  async load() {
    try {
      const data = await AdminService.getFiles();
      this.files = Array.isArray(data) ? data : [];
      this.render();
    } catch (e) {
      showToast(e.message, "error");
      this.files = [];
      this.render();
    }
  }

  render() {
    if (!this.container) return;
    let html = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-100">Files</h2>
        <div>
          <button id="btn-upload-file" class="btn btn-success mr-2">Upload File</button>
          <button id="btn-bulk-delete" class="btn btn-danger btn-sm" disabled>Delete Selected</button>
        </div>
      </div>
      <div class="table-container">
        <table>
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
                  <button class="preview-file-btn btn btn-sm btn-info" data-id="${f.id}">Preview</button>
                  <button class="delete-file-btn btn btn-sm btn-danger" data-id="${f.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    document.getElementById("btn-upload-file")?.addEventListener("click", () => this.showUploadModal());
    document.getElementById("select-all-files")?.addEventListener("change", (e) => {
      this.container.querySelectorAll(".file-checkbox").forEach(cb => cb.checked = e.target.checked);
      this.updateSelection();
    });
    this.container.querySelectorAll(".file-checkbox").forEach(cb => cb.addEventListener("change", () => this.updateSelection()));

    this.container.querySelectorAll(".preview-file-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const file = this.files.find(f => f.id == id);
        if (file) {
          // Use the download URL; the preview panel will handle it
          const downloadUrl = `/api/ddm/files/${file.id}/download`;
          this.previewPanel.open({ id: file.id, name: file.name, downloadUrl });
        }
      });
    });

    this.container.querySelectorAll(".delete-file-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const file = this.files.find(f => f.id == id);
        confirmModal({
          title: "Delete File",
          message: `Are you sure you want to permanently delete "${file.name}"?`,
          confirmText: "Delete",
          danger: true,
          onConfirm: async () => {
            try {
              await AdminService.deleteFile(id);
              showToast("File deleted", "success");
              this.load();
            } catch (e) {
              showToast(e.message, "error");
            }
          },
        });
      });
    });

    document.getElementById("btn-bulk-delete")?.addEventListener("click", () => {
      const ids = Array.from(this.selected);
      if (ids.length === 0) return;
      confirmModal({
        title: "Bulk Delete Files",
        message: `Are you sure you want to permanently delete ${ids.length} selected files?`,
        confirmText: "Delete All",
        danger: true,
        onConfirm: async () => {
          try {
            await AdminService.bulkDeleteFiles(ids);
            showToast("Files deleted", "success");
            this.selected.clear();
            this.load();
          } catch (e) {
            showToast(e.message, "error");
          }
        },
      });
    });
  }

  updateSelection() {
    this.selected.clear();
    this.container.querySelectorAll(".file-checkbox:checked").forEach(cb => this.selected.add(parseInt(cb.value)));
    const bulkBtn = document.getElementById("btn-bulk-delete");
    if (bulkBtn) bulkBtn.disabled = this.selected.size === 0;
  }

  async showUploadModal() {
    let groups = [];
    try {
      groups = await AdminService.fetchDivisions();   // now divisions
    } catch (e) {}

    const groupOptions = groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

    const content = `
      <form id="upload-file-form" class="space-y-4">
        <label class="form-label">File Name</label>
        <input type="text" name="name" required class="form-input" placeholder="e.g. Project Alpha">
        <label class="form-label">Description (optional)</label>
        <textarea name="description" class="form-textarea" placeholder="Brief description..."></textarea>
        <label class="form-label">Storage Type</label>
        <select name="storage_type" id="storage-type-select" class="form-select">
          <option value="local">Local File</option>
          <option value="terabox">Terabox Link</option>
        </select>
        <div id="local-file-section">
          <label class="form-label">Choose File</label>
          <input type="file" name="file" class="form-input">
        </div>
        <div id="terabox-section" class="hidden">
          <label class="form-label">Terabox Share Link</label>
          <input type="text" name="terabox_url" class="form-input" placeholder="https://...">
        </div>
        <label class="form-label">Target Divisions</label>
        <select name="groups" multiple class="form-select">${groupOptions}</select>
        <p class="text-xs text-gray-400">Hold Ctrl/Cmd to select multiple</p>
        <button type="submit" class="btn btn-primary w-full">Upload</button>
      </form>
    `;

    openModal(content, (modal) => {
      const storageSelect = modal.querySelector("#storage-type-select");
      const localSection = modal.querySelector("#local-file-section");
      const teraboxSection = modal.querySelector("#terabox-section");

      storageSelect.addEventListener("change", () => {
        if (storageSelect.value === "local") {
          localSection.classList.remove("hidden");
          teraboxSection.classList.add("hidden");
        } else {
          localSection.classList.add("hidden");
          teraboxSection.classList.remove("hidden");
        }
      });

      modal.querySelector("#upload-file-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData();
        formData.append("name", form.name.value);
        formData.append("description", form.description.value || "");
        formData.append("storage_type", form.storage_type.value);
        const selectedGroups = Array.from(form.groups.selectedOptions).map(o => parseInt(o.value, 10));
        formData.append("groups", JSON.stringify(selectedGroups));
        if (form.storage_type.value === "local") {
          const fileInput = form.file;
          if (!fileInput.files.length) {
            showToast("Please select a file", "error");
            return;
          }
          formData.append("file", fileInput.files[0]);
        } else {
          const url = form.terabox_url.value.trim();
          if (!url) {
            showToast("Please enter a Terabox link", "error");
            return;
          }
          formData.append("terabox_url", url);
        }
        try {
          await AdminService.uploadFile(formData);
          showToast("File uploaded successfully", "success");
          modal.close();
          this.load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }
}
// end of RCA/frontend/src/components/ddm/admin/file-table.js