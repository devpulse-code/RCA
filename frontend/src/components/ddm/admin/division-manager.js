// RCA/frontend/src/components/ddm/admin/division-manager.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";
import { confirmModal, openModal } from "../../ui/modal.js";

export class DivisionManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.divisions = [];
    this.load();
  }

  async load() {
    try {
      this.divisions = await AdminService.fetchDivisions();
      this.render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    let html = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-100">Divisions</h2>
        <button id="btn-create-division" class="btn btn-primary">Create Division</button>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Name</th><th>Actions</th></tr></thead>
          <tbody>
            ${this.divisions.map(d => `
              <tr>
                <td>${d.name}</td>
                <td>
                  <button class="delete-division-btn btn btn-sm btn-danger" data-id="${d.id}" data-name="${d.name}">Delete</button>
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
    document.getElementById("btn-create-division")?.addEventListener("click", () => this.showCreateModal());
    this.container.querySelectorAll(".delete-division-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const name = btn.dataset.name;
        confirmModal({
          title: "Delete Division",
          message: `Are you sure you want to delete the division "${name}"? This may affect users and files.`,
          confirmText: "Delete",
          danger: true,
          onConfirm: async () => {
            try {
              await AdminService.deleteDivision(id);
              showToast("Division deleted", "success");
              this.load();
            } catch (e) {
              showToast(e.message, "error");
            }
          },
        });
      });
    });
  }

  showCreateModal() {
    const content = `
      <form id="create-division-form" class="space-y-4">
        <label class="form-label">Division Name</label>
        <input type="text" name="name" required class="form-input" placeholder="e.g. Visual Division">
        <button type="submit" class="btn btn-primary w-full">Create</button>
      </form>
    `;
    openModal(content, (modal) => {
      modal.querySelector("#create-division-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        try {
          await AdminService.createDivision(name);
          showToast("Division created", "success");
          modal.close();
          this.load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }
}
// end of RCA/frontend/src/components/ddm/admin/division-manager.js