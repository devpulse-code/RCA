// RCA/frontend/src/stores/ui-store.js
export const uiStore = {
  viewMode: 'list', // 'grid', 'list', 'category'
  listeners: [],

  setViewMode(mode) {
    if (['grid', 'list', 'category'].includes(mode)) {
      this.viewMode = mode;
      this.notify();
    }
  },

  onViewChange(callback) {
    this.listeners.push(callback);
  },

  notify() {
    this.listeners.forEach(cb => cb(this.viewMode));
  }
};
// end of RCA/frontend/src/stores/ui-store.js