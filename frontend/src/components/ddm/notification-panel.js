// RCA/frontend/src/components/ddm/notification-panel.js
export default class NotificationPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.notifications = [];
    this.hiddenIds = this._loadHidden();
    this.render();
    this.fetchNotifications();
  }

  _loadHidden() {
    try {
      return JSON.parse(localStorage.getItem('ddm_hidden_announcements') || '[]');
    } catch { return []; }
  }

  _saveHidden() {
    localStorage.setItem('ddm_hidden_announcements', JSON.stringify(this.hiddenIds));
  }

  async fetchNotifications() {
    try {
      const res = await fetch('/api/ddm/announcements', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      this.notifications = Array.isArray(data) ? data : (data.announcements || data.results || []);
      this.updateBadge();
      this.renderDropdownContent();
    } catch (e) {
      console.warn('Notification fetch error:', e);
      if (this.list) this.list.innerHTML = '<div class="notification-item notification-error">Unable to load notifications</div>';
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="notification-bell-wrapper">
        <button class="notification-bell" id="notification-bell" aria-label="Notifications">
          <i class="fa-solid fa-bell"></i>
          <span id="notification-badge" class="notification-badge" style="display:none;">0</span>
        </button>
        <div id="notification-dropdown" class="notification-dropdown">
          <div class="notification-dropdown-header">
            <span>Notifications</span>
          </div>
          <div id="notification-list" class="notification-list"></div>
        </div>
      </div>
    `;
    this.bell = document.getElementById('notification-bell');
    this.dropdown = document.getElementById('notification-dropdown');
    this.badge = document.getElementById('notification-badge');
    this.list = document.getElementById('notification-list');

    this.bell.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.dropdown.classList.remove('open');
      }
    });
  }

  updateBadge() {
    const visible = this.notifications.filter(n => !this.hiddenIds.includes(n.id));
    const count = visible.length;
    if (count > 0) {
      this.badge.textContent = count > 99 ? '99+' : count;
      this.badge.style.display = 'flex';
    } else {
      this.badge.style.display = 'none';
    }
  }

  renderDropdownContent() {
    if (!this.list) return;
    const visible = this.notifications.filter(n => !this.hiddenIds.includes(n.id));
    if (visible.length === 0) {
      this.list.innerHTML = '<div class="notification-item notification-empty">No new announcements</div>';
      return;
    }
    this.list.innerHTML = visible.map(n => `
      <div class="notification-item" data-id="${n.id}">
        <div class="notification-item-content">
          <strong class="notification-title">${n.title || 'Announcement'}</strong>
          <p class="notification-message">${n.message || n.body || ''}</p>
          <span class="notification-time">${this._formatTime(n.created_at)}</span>
        </div>
        <button class="hide-notification-btn" data-id="${n.id}" title="Hide this announcement">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join('');

    this.list.querySelectorAll('.hide-notification-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (id && !this.hiddenIds.includes(id)) {
          this.hiddenIds.push(id);
          this._saveHidden();
          this.updateBadge();
          this.renderDropdownContent();
        }
      });
    });
  }

  _formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  }
}
// end of RCA/frontend/src/components/ddm/notification-panel.js