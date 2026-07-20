// RCA/frontend/src/stores/ui-store.js
export const uiStore = {
  viewMode: 'grid',
  groupFilter: null,
  typeFilter: 'all',
  selectMode: false,        // new: select mode toggle
  listeners: [],
  filterListeners: [],
  typeListeners: [],
  selectModeListeners: [],

  setViewMode(mode) {
    if (['grid', 'list'].includes(mode)) {
      this.viewMode = mode;
      this.notify();
    }
  },

  setGroupFilter(groupId) {
    this.groupFilter = groupId;
    this.filterListeners.forEach(cb => cb(this.groupFilter));
  },

  setTypeFilter(type) {
    this.typeFilter = type;
    this.typeListeners.forEach(cb => cb(type));
  },

  setSelectMode(enabled) {
    if (this.selectMode === enabled) return;
    this.selectMode = enabled;
    this.selectModeListeners.forEach(cb => cb(this.selectMode));
  },

  toggleSelectMode() {
    this.setSelectMode(!this.selectMode);
  },

  onViewChange(callback) {
    this.listeners.push(callback);
  },

  onFilterChange(callback) {
    this.filterListeners.push(callback);
  },

  onTypeChange(callback) {
    this.typeListeners.push(callback);
  },

  onSelectModeChange(callback) {
    this.selectModeListeners.push(callback);
  },

  notify() {
    this.listeners.forEach(cb => cb(this.viewMode));
  }
};
// end of RCA/frontend/src/stores/ui-store.js