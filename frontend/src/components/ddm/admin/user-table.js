// RCA/frontend/src/components/ddm/admin/user-table.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast, showPasscodeToast } from "../../ui/toast.js";
import { openModal, confirmModal } from "../../ui/modal.js";

export class UserTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.users = [];
    this.selected = new Set();
    this.divisions = [];
    this.render();
    this.load();
  }

  async load() {
    try {
      this.users = await AdminService.getUsers();
      this.divisions = await AdminService.fetchDivisions();
      this.selected.clear();
      this.render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    const selectedCount = this.selected.size;
    const totalCount = this.users.length;
    const allSelected = selectedCount === totalCount && totalCount > 0;

    let html = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-100">Users</h2>
        <button class="btn btn-primary" id="btn-create-user">Create User</button>
      </div>
      <div class="flex items-center gap-2 mb-4">
        <button id="btn-select-all" class="btn btn-secondary btn-sm">
          ${allSelected ? "Deselect All" : "Select All"}
        </button>
        <span id="selection-count" class="text-sm text-muted">
          ${selectedCount > 0 ? `${selectedCount} selected` : ""}
        </span>
        <button id="btn-bulk-revoke" class="btn btn-warning btn-sm" ${selectedCount === 0 ? "disabled" : ""}>
          Revoke Selected Passcodes
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Divisions</th>
              <th>Passcode Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="user-tbody">
            ${this.users.map(u => {
              const isSelected = this.selected.has(u.id);
              return `
                <tr data-id="${u.id}" class="user-row ${isSelected ? "row-selected" : ""}">
                  <td>${u.name}</td>
                  <td>${u.contact || ''}</td>
                  <td>${(u.divisions || []).join(', ')}</td>
                  <td>${u.passcode_active ? 'Active' : 'Revoked'}</td>
                  <td>
                    <button class="edit-btn btn btn-sm btn-primary" data-id="${u.id}">Edit</button>
                    <button class="revoke-btn btn btn-sm btn-warning" data-id="${u.id}">Revoke</button>
                    <button class="set-passcode-btn btn btn-sm btn-info" data-id="${u.id}">Set Passcode</button>
                    <button class="delete-btn btn btn-sm btn-danger" data-id="${u.id}">Delete</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    document.getElementById("btn-create-user")?.addEventListener("click", () => this.showCreateModal());
    document.getElementById("btn-bulk-revoke")?.addEventListener("click", () => this.bulkRevoke());
    document.getElementById("btn-select-all")?.addEventListener("click", () => this.toggleSelectAll());

    // Row click for selection
    this.container.querySelectorAll(".user-row").forEach(row => {
      row.addEventListener("click", (e) => {
        // Don't trigger if the click landed on a button or link inside the row
        if (e.target.closest("button") || e.target.closest("a")) return;
        const id = parseInt(row.dataset.id);
        this.toggleRowSelection(id);
      });
    });

    // Action buttons
    this.container.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent row selection
        const id = parseInt(btn.dataset.id);
        const user = this.users.find(u => u.id === id);
        if (user) this.showEditModal(user);
      });
    });

    this.container.querySelectorAll(".revoke-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const user = this.users.find(u => u.id === id);
        confirmModal({
          title: "Revoke Passcode",
          message: `Are you sure you want to revoke the passcode for ${user.name}? A new random passcode will be generated.`,
          confirmText: "Revoke",
          danger: true,
          onConfirm: async () => {
            try {
              const res = await AdminService.revokePasscode(id);
              showPasscodeToast("New passcode generated:", res.passcode);
              this.load();
            } catch (e) {
              showToast(e.message, "error");
            }
          },
        });
      });
    });

    this.container.querySelectorAll(".set-passcode-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const user = this.users.find(u => u.id === id);
        this.showSetPasscodeModal(user);
      });
    });

    this.container.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const user = this.users.find(u => u.id === id);
        confirmModal({
          title: "Delete User",
          message: `Are you sure you want to permanently delete ${user.name}? This cannot be undone.`,
          confirmText: "Delete",
          danger: true,
          onConfirm: async () => {
            try {
              await AdminService.deleteUser(id);
              showToast("User deleted", "success");
              this.load();
            } catch (e) {
              showToast(e.message, "error");
            }
          },
        });
      });
    });
  }

  toggleRowSelection(id) {
    if (this.selected.has(id)) {
      this.selected.delete(id);
    } else {
      this.selected.add(id);
    }
    this.updateVisuals();
  }

  toggleSelectAll() {
    const allIds = this.users.map(u => u.id);
    const allSelected = allIds.every(id => this.selected.has(id));
    if (allSelected) {
      this.selected.clear();
    } else {
      allIds.forEach(id => this.selected.add(id));
    }
    this.updateVisuals();
  }

  updateVisuals() {
    // Update selected class on each row
    this.container.querySelectorAll(".user-row").forEach(row => {
      const id = parseInt(row.dataset.id);
      row.classList.toggle("row-selected", this.selected.has(id));
    });

    // Update toolbar elements
    const selectedCount = this.selected.size;
    const totalCount = this.users.length;
    const allSelected = selectedCount === totalCount && totalCount > 0;

    const selectAllBtn = document.getElementById("btn-select-all");
    if (selectAllBtn) {
      selectAllBtn.textContent = allSelected ? "Deselect All" : "Select All";
    }

    const countSpan = document.getElementById("selection-count");
    if (countSpan) {
      countSpan.textContent = selectedCount > 0 ? `${selectedCount} selected` : "";
    }

    const bulkBtn = document.getElementById("btn-bulk-revoke");
    if (bulkBtn) {
      bulkBtn.disabled = selectedCount === 0;
    }
  }

  async bulkRevoke() {
    const ids = Array.from(this.selected);
    if (ids.length === 0) return;
    confirmModal({
      title: "Bulk Revoke Passcodes",
      message: `Are you sure you want to revoke passcodes for ${ids.length} selected users? New passcodes will be generated.`,
      confirmText: "Revoke All",
      danger: true,
      onConfirm: async () => {
        try {
          const results = await AdminService.bulkRevokePasscodes(ids);
          // Show results in a modal with copy/download options
          const rows = results.map(r => `
            <tr>
              <td class="px-2 py-1">${r.user_id}</td>
              <td class="px-2 py-1"><code class="bg-gray-700 px-1 rounded">${r.passcode}</code></td>
              <td class="px-2 py-1"><button class="copy-single-btn btn btn-sm btn-primary" data-passcode="${r.passcode}">Copy</button></td>
            </tr>
          `).join("");
          const content = `
            <div class="space-y-3">
              <p class="font-semibold">New passcodes generated:</p>
              <table class="w-full text-sm">
                <thead><tr><th>User ID</th><th>Passcode</th><th></th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
              <div class="flex gap-2">
                <button id="bulk-copy-all" class="btn btn-primary btn-sm">Copy All</button>
                <button id="bulk-download-csv" class="btn btn-sm" style="background:#4B5563;">Download CSV</button>
              </div>
            </div>
          `;
          openModal(content, (modal) => {
            modal.querySelectorAll(".copy-single-btn").forEach(btn => {
              btn.addEventListener("click", () => {
                navigator.clipboard.writeText(btn.dataset.passcode).then(() => {
                  btn.textContent = "Copied!";
                  setTimeout(() => { btn.textContent = "Copy"; }, 2000);
                });
              });
            });
            modal.querySelector("#bulk-copy-all")?.addEventListener("click", () => {
              const allPasscodes = results.map(r => r.passcode).join("\n");
              navigator.clipboard.writeText(allPasscodes).then(() => {
                showToast("All passcodes copied", "success");
              });
            });
            modal.querySelector("#bulk-download-csv")?.addEventListener("click", () => {
              const csvContent = "User ID,Name,Passcode\n" +
                results.map(r => `${r.user_id},"","${r.passcode}"`).join("\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "passcodes.csv"; a.click();
              URL.revokeObjectURL(url);
            });
          });
          this.load();
        } catch (e) {
          showToast(e.message, "error");
        }
      },
    });
  }

  // -------------------------------------------------------------------
  // Modal methods unchanged (except they don’t need checkbox related code)
  // -------------------------------------------------------------------
  showCreateModal() {
    const divisionOptions = this.divisions.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    const content = `
      <form id="create-user-form" class="space-y-4">
        <label class="form-label">Name</label>
        <input type="text" name="name" required class="form-input" placeholder="Full name">
        <label class="form-label">Contact (optional)</label>
        <input type="text" name="contact" class="form-input" placeholder="Email or phone">
        <label class="form-label">Divisions (at least 2)</label>
        <select name="divisions" multiple class="form-select">${divisionOptions}</select>
        <button type="submit" class="btn btn-primary w-full">Create User</button>
      </form>
    `;
    openModal(content, async (modal) => {
      modal.querySelector("#create-user-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const selectedDivisions = Array.from(form.divisions.selectedOptions).map(o => o.value);
        if (selectedDivisions.length < 2) {
          showToast("Please select at least 2 divisions", "error");
          return;
        }
        const data = {
          name: form.name.value,
          contact: form.contact.value || null,
          divisions: selectedDivisions,
        };
        try {
          const res = await AdminService.createUser(data);
          showPasscodeToast("User created. Passcode:", res.passcode);
          modal.close();
          this.load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  showEditModal(user) {
    const divisionOptions = this.divisions.map(d =>
      `<option value="${d.name}" ${user.divisions.includes(d.name)?'selected':''}>${d.name}</option>`
    ).join('');
    const content = `
      <form id="edit-user-form" class="space-y-4">
        <label class="form-label">Name</label>
        <input type="text" name="name" value="${user.name}" required class="form-input">
        <label class="form-label">Contact</label>
        <input type="text" name="contact" value="${user.contact || ''}" class="form-input">
        <label class="form-label">Divisions (at least 2)</label>
        <select name="divisions" multiple class="form-select">${divisionOptions}</select>
        <button type="submit" class="btn btn-primary w-full">Save Changes</button>
      </form>
    `;
    openModal(content, (modal) => {
      modal.querySelector("#edit-user-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const selectedDivisions = Array.from(form.divisions.selectedOptions).map(o => o.value);
        if (selectedDivisions.length < 2) {
          showToast("Please select at least 2 divisions", "error");
          return;
        }
        const data = {
          name: form.name.value,
          contact: form.contact.value || null,
          divisions: selectedDivisions,
        };
        try {
          await AdminService.updateUser(user.id, data);
          showToast("User updated", "success");
          modal.close();
          this.load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  showSetPasscodeModal(user) {
    const content = `
      <form id="set-passcode-form" class="space-y-4">
        <label class="form-label">New Passcode for ${user.name}</label>
        <input type="text" name="passcode" required minlength="8" maxlength="64" class="form-input" placeholder="Enter new passcode">
        <button type="submit" class="btn btn-primary w-full">Set Passcode</button>
      </form>
    `;
    openModal(content, (modal) => {
      modal.querySelector("#set-passcode-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const passcode = e.target.passcode.value;
        try {
          await AdminService.setPasscode(user.id, passcode);
          showToast("Passcode updated", "success");
          modal.close();
          this.load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }
}
// end of RCA/frontend/src/components/ddm/admin/user-table.js