// RCA/frontend/src/components/ddm/group-filter.js
import { uiStore } from "../../stores/ui-store.js";
import * as FileService from "../../services/ddm/file-service.js";

export default class GroupFilter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.groups = [];
    this.activeGroupId = null;
    this.render();
    this.loadGroups();
  }

  async loadGroups() {
    try {
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
    this.renderDropdownItems();
  }

  render() {
    this.container.innerHTML = `
      <div class="group-filter-custom">
        <button id="group-filter-btn" class="group-filter-btn">
          <span id="group-filter-label">All Groups</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div id="group-filter-dropdown" class="group-filter-dropdown hidden">
          <div class="group-filter-item" data-id="">All Groups</div>
        </div>
      </div>
    `;
    this.btn = document.getElementById('group-filter-btn');
    this.dropdown = document.getElementById('group-filter-dropdown');
    this.label = document.getElementById('group-filter-label');

    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.dropdown.classList.add('hidden');
      }
    });
  }

  renderDropdownItems() {
    if (!this.dropdown) return;
    let html = '<div class="group-filter-item" data-id="">All Groups</div>';
    this.groups.forEach(g => {
      html += `<div class="group-filter-item" data-id="${g.id}">${g.name}</div>`;
    });
    this.dropdown.innerHTML = html;

    this.dropdown.querySelectorAll('.group-filter-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        this.activeGroupId = id || null;
        this.label.textContent = id ? item.textContent : 'All Groups';
        uiStore.setGroupFilter(this.activeGroupId);
        this.dropdown.classList.add('hidden');
        // Highlight active item
        this.dropdown.querySelectorAll('.group-filter-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });

    // Set initial active if needed
    if (this.activeGroupId) {
      const activeItem = this.dropdown.querySelector(`[data-id="${this.activeGroupId}"]`);
      if (activeItem) activeItem.classList.add('active');
    }
  }
}
// end of RCA/frontend/src/components/ddm/group-filter.js