// RCA/frontend/src/components/ddm/admin/user-table.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";
import { openModal } from "../../ui/modal.js";

export class UserTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.users = [];
    this.selected = new Set();
    this.groups = [];
    this.render();
    this.load();
  }

  async load() {
    try {
      // Use getUsers (not fetchUsers) as defined in admin-service.js
      this.users = await AdminService.getUsers();
      this.groups = await AdminService.fetchGroups();
      this.render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    let html = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Users</h2>
        <button class="bg-blue-600 text-white px-4 py-2 rounded" id="btn-create-user">Create User</button>
      </div>
      <div class="flex gap-2 mb-4">
        <button id="btn-bulk-revoke" class="bg-yellow-500 text-white px-3 py-1 rounded" disabled>Revoke Selected Passcodes</button>
      </div>
      <table class="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all"></th>
            <th>Name</th>
            <th>Contact</th>
            <th>Groups</th>
            <th>Passcode Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="user-tbody">
          ${this.users.map(u => `
            <tr data-id="${u.id}">
              <td><input type="checkbox" class="user-checkbox" value="${u.id}"></td>
              <td>${u.name}</td>
              <td>${u.contact || ''}</td>
              <td>${(u.groups || []).join(', ')}</td>
              <td>${u.passcode_active ? 'Active' : 'Revoked'}</td>
              <td>
                <button class="edit-btn text-blue-600 hover:underline" data-id="${u.id}">Edit</button>
                <button class="revoke-btn text-yellow-600 hover:underline ml-2" data-id="${u.id}">Revoke</button>
                <button class="delete-btn text-red-600 hover:underline ml-2" data-id="${u.id}">Delete</button>
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
    document.getElementById("btn-create-user")?.addEventListener("click", () => this.showCreateModal());
    document.getElementById("btn-bulk-revoke")?.addEventListener("click", () => this.bulkRevoke());
    document.getElementById("select-all")?.addEventListener("change", (e) => {
      const checkboxes = this.container.querySelectorAll(".user-checkbox");
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      this.updateSelection();
    });

    this.container.querySelectorAll(".user-checkbox").forEach(cb => {
      cb.addEventListener("change", () => this.updateSelection());
    });

    this.container.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const user = this.users.find(u => u.id == id);
        if (user) this.showEditModal(user);
      });
    });

    this.container.querySelectorAll(".revoke-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Revoke passcode and generate a new one?")) {
          try {
            const res = await AdminService.revokePasscode(parseInt(id));
            showToast(`New passcode: ${res.passcode}`, "success");
            this.load();
          } catch (e) {
            showToast(e.message, "error");
          }
        }
      });
    });

    this.container.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Delete this user?")) {
          try {
            await AdminService.deleteUser(parseInt(id));
            showToast("User deleted", "success");
            this.load();
          } catch (e) {
            showToast(e.message, "error");
          }
        }
      });
    });
  }

  updateSelection() {
    const checkboxes = this.container.querySelectorAll(".user-checkbox");
    this.selected.clear();
    checkboxes.forEach(cb => { if (cb.checked) this.selected.add(parseInt(cb.value)); });
    const bulkBtn = document.getElementById("btn-bulk-revoke");
    bulkBtn.disabled = this.selected.size === 0;
  }

  async bulkRevoke() {
    const ids = Array.from(this.selected);
    if (ids.length === 0) return;
    if (!confirm(`Revoke passcodes for ${ids.length} users?`)) return;
    try {
      const results = await AdminService.bulkRevokePasscodes(ids);
      let msg = results.map(r => `ID ${r.user_id}: ${r.passcode}`).join("\n");
      alert("New passcodes:\n" + msg);
      showToast("Passcodes revoked", "success");
      this.load();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  showCreateModal() {
    const groupOptions = this.groups.map(g => `<option value="${g.name}">${g.name}</option>`).join('');
    const content = `
      <form id="create-user-form" class="space-y-4">
        <input type="text" name="name" placeholder="Name" required class="w-full border p-2">
        <input type="text" name="contact" placeholder="Contact (optional)" class="w-full border p-2">
        <label>Groups</label>
        <select name="groups" multiple class="w-full border p-2">${groupOptions}</select>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
      </form>
    `;
    openModal(content, async (modal) => {
      modal.querySelector("#create-user-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const selectedGroups = Array.from(form.groups.selectedOptions).map(o => o.value);
        const data = {
          name: form.name.value,
          contact: form.contact.value || null,
          groups: selectedGroups,
        };
        try {
          const res = await AdminService.createUser(data);
          showToast(`User created. Passcode: ${res.passcode}`, "success");
          modal.close();
          this.load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  showEditModal(user) {
    const groupOptions = this.groups.map(g => `<option value="${g.name}" ${user.groups.includes(g.name)?'selected':''}>${g.name}</option>`).join('');
    const content = `
      <form id="edit-user-form" class="space-y-4">
        <input type="text" name="name" value="${user.name}" required class="w-full border p-2">
        <input type="text" name="contact" value="${user.contact || ''}" class="w-full border p-2">
        <label>Groups</label>
        <select name="groups" multiple class="w-full border p-2">${groupOptions}</select>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    `;
    openModal(content, (modal) => {
      modal.querySelector("#edit-user-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const selectedGroups = Array.from(form.groups.selectedOptions).map(o => o.value);
        const data = {
          name: form.name.value,
          contact: form.contact.value || null,
          groups: selectedGroups,
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
}
// end of RCA/frontend/src/components/ddm/admin/user-table.js