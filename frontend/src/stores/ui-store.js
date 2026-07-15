// RCA/frontend/src/stores/ui-store.js
export const uiStore = {
  viewMode: 'list',
  groupFilter: null,
  listeners: [],
  filterListeners: [],

  setViewMode(mode) {
    if (['grid', 'list', 'category'].includes(mode)) {
      this.viewMode = mode;
      this.notify();
    }
  },

  setGroupFilter(groupId) {
    this.groupFilter = groupId;
    this.filterListeners.forEach(cb => cb(this.groupFilter));
  },

  onViewChange(callback) {
    this.listeners.push(callback);
  },

  onFilterChange(callback) {
    this.filterListeners.push(callback);
  },

  notify() {
    this.listeners.forEach(cb => cb(this.viewMode));
  }
};
// end of RCA/frontend/src/stores/ui-store.js