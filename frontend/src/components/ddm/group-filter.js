// RCA/frontend/src/components/ddm/group-filter.js
import { uiStore } from "../../stores/ui-store.js";
import * as FileService from "../../services/ddm/file-service.js";

export default class GroupFilter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.groups = [];
    this.render();
    this.loadGroups();
  }

  async loadGroups() {
    try {
      // We assume the user file list already contains group info; extract unique groups
      const files = await FileService.fetchUserFiles();
      const groupMap = new Map();
      files.forEach(file => {
        if (Array.isArray(file.groups)) {
          file.groups.forEach(g => {
            if (!groupMap.has(g.id)) {
              groupMap.set(g.id, { id: g.id, name: g.name || `Group ${g.id}` });
            }
          });
        }
      });
      this.groups = Array.from(groupMap.values());
    } catch (e) {
      console.warn("Could not load groups for filter", e);
    }
    this.renderDropdown();
  }

  render() {
    this.container.innerHTML = `
      <div class="flex items-center gap-2">
        <label class="text-sm font-semibold">Filter by Group:</label>
        <select id="group-filter-select" class="border p-1 rounded bg-[var(--input-bg)] text-[var(--text-primary)]">
          <option value="">All Groups</option>
        </select>
      </div>
    `;
    this.renderDropdown();
    document.getElementById("group-filter-select").addEventListener("change", (e) => {
      const val = e.target.value;
      uiStore.setGroupFilter(val || null);
    });
  }

  renderDropdown() {
    const select = document.getElementById("group-filter-select");
    if (!select) return;
    select.innerHTML = '<option value="">All Groups</option>';
    this.groups.forEach(g => {
      select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
    });
  }
}
// end of RCA/frontend/src/components/ddm/group-filter.js