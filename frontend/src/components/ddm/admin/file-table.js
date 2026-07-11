// RCA/frontend/src/components/ddm/admin/file-table.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";
import { openModal } from "../../ui/modal.js";

export class FileTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.selected = new Set();
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
          <button id="btn-upload-file" class="bg-green-600 text-white px-4 py-2 rounded mr-2">Upload File</button>
          <button id="btn-bulk-delete" class="bg-red-500 text-white px-3 py-1 rounded" disabled>Delete Selected</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full bg-gray-900 rounded shadow">
          <thead class="bg-gray-800">
            <tr>
              <th class="p-2"><input type="checkbox" id="select-all-files"></th>
              <th class="p-2 text-left text-gray-200">Name</th>
              <th class="p-2 text-left text-gray-200">Type</th>
              <th class="p-2 text-left text-gray-200">Groups</th>
              <th class="p-2 text-left text-gray-200">Size</th>
              <th class="p-2 text-left text-gray-200">Status</th>
              <th class="p-2 text-left text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.files.map(f => `
              <tr data-id="${f.id}" class="border-b border-gray-700">
                <td class="p-2"><input type="checkbox" class="file-checkbox" value="${f.id}"></td>
                <td class="p-2 text-gray-200">${f.name}</td>
                <td class="p-2 text-gray-200">${f.storage_type}</td>
                <td class="p-2 text-gray-200">${(f.groups || []).join(', ')}</td>
                <td class="p-2 text-gray-200">${f.size ? (f.size/1024).toFixed(1)+' KB' : ''}</td>
                <td class="p-2 text-gray-200">${f.status}</td>
                <td class="p-2">
                  <button class="delete-file-btn text-red-400 hover:underline" data-id="${f.id}">Delete</button>
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

  async showUploadModal() {
    let groups = [];
    try {
      const data = await AdminService.fetchGroups();
      groups = Array.isArray(data) ? data : [];
    } catch (e) { /* ignore */ }

    const groupOptions = groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

    const content = `
      <form id="upload-file-form" class="space-y-4">
        <input type="text" name="name" placeholder="File name" required class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        <textarea name="description" placeholder="Description (optional)" class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded"></textarea>
        <div>
          <label class="block text-sm font-medium text-gray-200">Storage Type</label>
          <select name="storage_type" id="storage-type-select" class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
            <option value="local">Local File</option>
            <option value="terabox">Terabox Link</option>
          </select>
        </div>
        <div id="local-file-section">
          <label class="block text-sm font-medium text-gray-200">Choose File</label>
          <input type="file" name="file" class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        </div>
        <div id="terabox-section" class="hidden">
          <label class="block text-sm font-medium text-gray-200">Terabox Share Link</label>
          <input type="text" name="terabox_url" placeholder="https://..." class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-200">Target Groups</label>
          <select name="groups" multiple class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">${groupOptions}</select>
          <p class="text-xs text-gray-400">Hold Ctrl/Cmd to select multiple</p>
        </div>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
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