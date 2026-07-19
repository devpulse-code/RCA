  // RCA/frontend/src/stores/ui-store.js
  export const uiStore = {
    viewMode: 'grid',
    groupFilter: null,
    typeFilter: 'all',   // 'all', 'image', 'video', 'doc'
    listeners: [],
    filterListeners: [],
    typeListeners: [],

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

    onViewChange(callback) {
      this.listeners.push(callback);
    },

    onFilterChange(callback) {
      this.filterListeners.push(callback);
    },

    onTypeChange(callback) {
      this.typeListeners.push(callback);
    },

    notify() {
      this.listeners.forEach(cb => cb(this.viewMode));
    }
  };
  // end of RCA/frontend/src/stores/ui-store.js