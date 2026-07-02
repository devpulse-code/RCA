// RCA/frontend/src/components/ddm/admin/upload-queue.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";

export class UploadQueue {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.requests = [];
    this.selected = new Set();
    this.load();
  }

  async load() {
    try {
      this.requests = await AdminService.getUploadRequests();
      this.selected.clear();
      this.render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    if (this.requests.length === 0) {
      this.container.innerHTML = "<p>No pending upload requests.</p>";
      return;
    }
    let html = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Upload Requests</h2>
        <div>
          <button id="btn-approve-selected" class="bg-green-500 text-white px-3 py-1 rounded mr-2" disabled>Approve Selected</button>
          <button id="btn-reject-selected" class="bg-red-500 text-white px-3 py-1 rounded" disabled>Reject Selected</button>
        </div>
      </div>
      <div class="space-y-4">
        ${this.requests.map(r => `
          <div class="bg-white p-4 rounded shadow flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <input type="checkbox" class="request-checkbox" value="${r.id}">
              <div>
                <h3 class="font-semibold">${r.name}</h3>
                <p class="text-sm text-gray-600">${r.description || ''}</p>
                <span class="text-xs">${r.size ? (r.size/1024).toFixed(1)+' KB' : ''}</span>
              </div>
            </div>
            <div class="space-x-2">
              <button class="approve-btn bg-green-500 text-white px-3 py-1 rounded" data-id="${r.id}">Approve</button>
              <button class="reject-btn bg-red-500 text-white px-3 py-1 rounded" data-id="${r.id}">Reject</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    const checkboxes = this.container.querySelectorAll(".request-checkbox");
    checkboxes.forEach(cb => {
      cb.addEventListener("change", () => this.updateSelection());
    });

    this.container.querySelectorAll(".approve-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id);
        await AdminService.approveUploadRequest(id);
        showToast("Request approved", "success");
        this.load();
      });
    });

    this.container.querySelectorAll(".reject-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id);
        await AdminService.rejectUploadRequest(id);
        showToast("Request rejected", "success");
        this.load();
      });
    });

    document.getElementById("btn-approve-selected")?.addEventListener("click", () => this.bulkApprove());
    document.getElementById("btn-reject-selected")?.addEventListener("click", () => this.bulkReject());
  }

  updateSelection() {
    this.selected.clear();
    this.container.querySelectorAll(".request-checkbox:checked").forEach(cb => this.selected.add(parseInt(cb.value)));
    document.getElementById("btn-approve-selected").disabled = this.selected.size === 0;
    document.getElementById("btn-reject-selected").disabled = this.selected.size === 0;
  }

  async bulkApprove() {
    const ids = Array.from(this.selected);
    if (!ids.length) return;
    if (!confirm(`Approve ${ids.length} requests?`)) return;
    try {
      for (const id of ids) {
        await AdminService.approveUploadRequest(id);
      }
      showToast("Selected requests approved", "success");
      this.load();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async bulkReject() {
    const ids = Array.from(this.selected);
    if (!ids.length) return;
    if (!confirm(`Reject ${ids.length} requests?`)) return;
    try {
      for (const id of ids) {
        await AdminService.rejectUploadRequest(id);
      }
      showToast("Selected requests rejected", "success");
      this.load();
    } catch (e) {
      showToast(e.message, "error");
    }
  }
}
// end of RCA/frontend/src/components/ddm/admin/upload-queue.js