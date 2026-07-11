// RCA/frontend/src/components/ddm/admin/announcement-table.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";
import { openModal } from "../../ui/modal.js";

export class AnnouncementTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.announcements = [];
    this.selected = new Set();
    this.load();
  }

  async load() {
    try {
      this.announcements = await AdminService.fetchAnnouncements();
      this.render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    let html = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-100">Announcements</h2>
        <div>
          <button id="btn-create-announcement" class="bg-blue-600 text-white px-4 py-2 rounded mr-2">New Announcement</button>
          <button id="btn-bulk-delete-announcements" class="bg-red-500 text-white px-3 py-1 rounded" disabled>Delete Selected</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full bg-gray-900 rounded shadow">
          <thead class="bg-gray-800">
            <tr>
              <th class="p-2"><input type="checkbox" id="select-all-announcements"></th>
              <th class="p-2 text-left text-gray-200">Title</th>
              <th class="p-2 text-left text-gray-200">Expiry</th>
              <th class="p-2 text-left text-gray-200">Public</th>
              <th class="p-2 text-left text-gray-200">Groups</th>
              <th class="p-2 text-left text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.announcements.map(a => `
              <tr data-id="${a.id}" class="border-b border-gray-700">
                <td class="p-2"><input type="checkbox" class="announcement-checkbox" value="${a.id}"></td>
                <td class="p-2 text-gray-200">${a.title}</td>
                <td class="p-2 text-gray-200">${a.expiry ? new Date(a.expiry).toLocaleDateString() : 'Never'}</td>
                <td class="p-2 text-gray-200">${a.is_public ? 'Yes' : 'No'}</td>
                <td class="p-2 text-gray-200">${a.groups.join(', ') || '—'}</td>
                <td class="p-2">
                  <button class="edit-announcement-btn text-blue-400 hover:underline" data-id="${a.id}">Edit</button>
                  <button class="delete-announcement-btn text-red-400 hover:underline ml-2" data-id="${a.id}">Delete</button>
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
    document.getElementById("btn-create-announcement")?.addEventListener("click", () => this.showCreateModal());
    document.getElementById("btn-bulk-delete-announcements")?.addEventListener("click", () => this.bulkDelete());
    document.getElementById("select-all-announcements")?.addEventListener("change", (e) => {
      this.container.querySelectorAll(".announcement-checkbox").forEach(cb => cb.checked = e.target.checked);
      this.updateSelection();
    });

    this.container.querySelectorAll(".announcement-checkbox").forEach(cb => {
      cb.addEventListener("change", () => this.updateSelection());
    });

    this.container.querySelectorAll(".edit-announcement-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const ann = this.announcements.find(a => a.id === id);
        if (ann) this.showEditModal(ann);
      });
    });

    this.container.querySelectorAll(".delete-announcement-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id);
        if (confirm("Delete this announcement?")) {
          await AdminService.deleteAnnouncement(id);
          showToast("Announcement deleted", "success");
          this.load();
        }
      });
    });
  }

  updateSelection() {
    this.selected.clear();
    this.container.querySelectorAll(".announcement-checkbox:checked").forEach(cb => this.selected.add(parseInt(cb.value)));
    document.getElementById("btn-bulk-delete-announcements").disabled = this.selected.size === 0;
  }

  async bulkDelete() {
    const ids = Array.from(this.selected);
    if (!ids.length) return;
    if (confirm(`Delete ${ids.length} announcements?`)) {
      await AdminService.bulkDeleteAnnouncements(ids);
      showToast("Announcements deleted", "success");
      this.selected.clear();
      this.load();
    }
  }

  showCreateModal() {
    const content = `
      <form id="create-announcement-form" class="space-y-4">
        <input type="text" name="title" placeholder="Title" required class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        <textarea name="body" placeholder="Body" required class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded"></textarea>
        <input type="datetime-local" name="expiry" class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        <label class="flex items-center space-x-2 text-gray-200">
          <input type="checkbox" name="is_public" class="bg-gray-700 border-gray-600">
          <span>Public (visible to everyone)</span>
        </label>
        <label class="text-gray-200">Target Groups (if any)</label>
        <select name="groups" multiple class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        </select>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
      </form>
    `;
    openModal(content, async (modal) => {
      let groups = [];
      try {
        groups = await AdminService.fetchGroups();
        const select = modal.querySelector("select[name='groups']");
        groups.forEach(g => {
          const opt = document.createElement("option");
          opt.value = g.name;       // we'll map name->id later
          opt.textContent = g.name;
          select.appendChild(opt);
        });
      } catch (e) { /* ignore */ }

      modal.querySelector("#create-announcement-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const selectedGroupNames = Array.from(form.groups.selectedOptions).map(o => o.value);
        const groupIds = groups.filter(g => selectedGroupNames.includes(g.name)).map(g => g.id);
        const data = {
          title: form.title.value,
          body: form.body.value,
          expiry: form.expiry.value ? new Date(form.expiry.value).toISOString() : null,
          is_public: form.is_public.checked,
          group_ids: groupIds,
        };
        try {
          await AdminService.createAnnouncement(data);
          showToast("Announcement created", "success");
          modal.close();
          this.load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  showEditModal(announcement) {
    const content = `
      <form id="edit-announcement-form" class="space-y-4">
        <input type="text" name="title" value="${announcement.title}" required class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        <textarea name="body" required class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">${announcement.body}</textarea>
        <input type="datetime-local" name="expiry" value="${announcement.expiry ? new Date(announcement.expiry).toISOString().slice(0,16) : ''}" class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        <label class="flex items-center space-x-2 text-gray-200">
          <input type="checkbox" name="is_public" ${announcement.is_public ? 'checked' : ''} class="bg-gray-700 border-gray-600">
          <span>Public (visible to everyone)</span>
        </label>
        <label class="text-gray-200">Target Groups</label>
        <select name="groups" multiple class="w-full border border-gray-600 bg-gray-800 text-gray-200 p-2 rounded">
        </select>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    `;
    openModal(content, async (modal) => {
      const select = modal.querySelector("select[name='groups']");
      let groups = [];
      try {
        groups = await AdminService.fetchGroups();
        groups.forEach(g => {
          const opt = document.createElement("option");
          opt.value = g.name;
          opt.textContent = g.name;
          if (announcement.groups.includes(g.name)) opt.selected = true;
          select.appendChild(opt);
        });
      } catch (e) {}

      modal.querySelector("#edit-announcement-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const selectedGroupNames = Array.from(form.groups.selectedOptions).map(o => o.value);
        const groupIds = groups.filter(g => selectedGroupNames.includes(g.name)).map(g => g.id);
        const data = {
          title: form.title.value,
          body: form.body.value,
          expiry: form.expiry.value ? new Date(form.expiry.value).toISOString() : null,
          is_public: form.is_public.checked,
          group_ids: groupIds,
        };
        try {
          await AdminService.updateAnnouncement(announcement.id, data);
          showToast("Announcement updated", "success");
          modal.close();
          this.load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }
}
// end of RCA/frontend/src/components/ddm/admin/announcement-table.js