// RCA/frontend/src/components/ddm/admin/upload-queue.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";
import { confirmModal } from "../../ui/modal.js";
import FilePreviewPanel from "../file-preview-panel.js";

export class UploadQueue {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.requests = [];
    this.selected = new Set();
    this.previewPanel = new FilePreviewPanel();
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
      this.container.innerHTML = "<p class=\"text-gray-400\">No pending upload requests.</p>";
      return;
    }
    let html = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-100">Upload Requests</h2>
        <div>
          <button id="btn-approve-selected" class="btn btn-success btn-sm mr-2" disabled>Approve Selected</button>
          <button id="btn-reject-selected" class="btn btn-danger btn-sm" disabled>Reject Selected</button>
        </div>
      </div>
      <div class="space-y-4">
        ${this.requests.map(r => `
          <div class="card">
            <div class="flex items-center space-x-3">
              <input type="checkbox" class="request-checkbox" value="${r.id}">
              <div>
                <h3 class="font-semibold text-gray-200">${r.name}</h3>
                <p class="text-sm text-gray-400">${r.description || ''}</p>
                <span class="text-xs text-gray-400">${r.size ? (r.size/1024).toFixed(1)+' KB' : ''}</span>
              </div>
            </div>
            <div class="space-x-2">
              <button class="preview-btn btn btn-sm btn-info" data-id="${r.id}">Preview</button>
              <button class="approve-btn btn btn-sm btn-success" data-id="${r.id}">Approve</button>
              <button class="reject-btn btn btn-sm btn-danger" data-id="${r.id}">Reject</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelectorAll(".request-checkbox").forEach(cb => {
      cb.addEventListener("change", () => this.updateSelection());
    });

    this.container.querySelectorAll(".preview-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const req = this.requests.find(r => r.id == id);
        if (req) {
          // Use admin preview endpoint
          const previewUrl = `/api/ddm/admin/upload-requests/${id}/preview`;
          this.previewPanel.open({ id, name: req.name, downloadUrl: previewUrl });
        }
      });
    });

    this.container.querySelectorAll(".approve-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const req = this.requests.find(r => r.id == id);
        confirmModal({
          title: "Approve Upload",
          message: `Are you sure you want to approve "${req.name}"?`,
          confirmText: "Approve",
          onConfirm: async () => {
            try {
              await AdminService.approveUploadRequest(id);
              showToast("Request approved", "success");
              this.load();
            } catch (e) {
              showToast(e.message, "error");
            }
          },
        });
      });
    });

    this.container.querySelectorAll(".reject-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const req = this.requests.find(r => r.id == id);
        confirmModal({
          title: "Reject Upload",
          message: `Are you sure you want to reject and delete "${req.name}"?`,
          confirmText: "Reject",
          danger: true,
          onConfirm: async () => {
            try {
              await AdminService.rejectUploadRequest(id);
              showToast("Request rejected", "success");
              this.load();
            } catch (e) {
              showToast(e.message, "error");
            }
          },
        });
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
    confirmModal({
      title: "Bulk Approve",
      message: `Are you sure you want to approve ${ids.length} selected requests?`,
      confirmText: "Approve All",
      onConfirm: async () => {
        try {
          for (const id of ids) {
            await AdminService.approveUploadRequest(id);
          }
          showToast("Selected requests approved", "success");
          this.load();
        } catch (e) {
          showToast(e.message, "error");
        }
      },
    });
  }

  async bulkReject() {
    const ids = Array.from(this.selected);
    if (!ids.length) return;
    confirmModal({
      title: "Bulk Reject",
      message: `Are you sure you want to reject and delete ${ids.length} selected requests?`,
      confirmText: "Reject All",
      danger: true,
      onConfirm: async () => {
        try {
          for (const id of ids) {
            await AdminService.rejectUploadRequest(id);
          }
          showToast("Selected requests rejected", "success");
          this.load();
        } catch (e) {
          showToast(e.message, "error");
        }
      },
    });
  }
}
// end of RCA/frontend/src/components/ddm/admin/upload-queue.js