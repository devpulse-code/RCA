// RCA/frontend/src/components/ddm/notification-panel.js
export default class NotificationPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.notifications = [];
    this.unreadCount = 0;
    this.render();
    this.fetchNotifications();
  }

  async fetchNotifications() {
    try {
      // Update this endpoint to the one that returns announcements/notifications
      const res = await fetch('/api/ddm/announcements', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      this.notifications = Array.isArray(data) ? data : (data.announcements || data.results || []);
      this.unreadCount = this.notifications.filter(n => !n.is_read).length;
      this.updateBadge();
      this.renderDropdownContent();
    } catch (e) {
      console.warn('Notification fetch error:', e);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="notification-bell" id="notification-bell">
        <i class="fa-solid fa-bell"></i>
        <span id="notification-badge" class="notification-badge">0</span>
      </div>
      <div id="notification-dropdown" class="notification-dropdown">
        <div class="notification-section-title">Notifications</div>
        <div id="notification-list"></div>
      </div>
    `;
    this.bell = document.getElementById('notification-bell');
    this.dropdown = document.getElementById('notification-dropdown');
    this.badge = document.getElementById('notification-badge');
    this.list = document.getElementById('notification-list');

    this.bell.addEventListener('click', () => {
      this.dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.dropdown.classList.remove('open');
      }
    });

    // Mark all as read when bell clicked (optional)
    this.bell.addEventListener('click', () => {
      if (this.unreadCount > 0) {
        this.markAllRead();
      }
    });
  }

  updateBadge() {
    if (this.unreadCount > 0) {
      this.badge.textContent = this.unreadCount;
      this.badge.style.display = 'flex';
    } else {
      this.badge.style.display = 'none';
    }
  }

  renderDropdownContent() {
    if (!this.list) return;
    if (this.notifications.length === 0) {
      this.list.innerHTML = '<div class="notification-item">No new notifications</div>';
      return;
    }
    this.list.innerHTML = this.notifications
      .map(n => {
        const readClass = n.is_read ? 'text-gray-400' : '';
        const seenButton = !n.is_read
          ? `<button class="mark-seen-btn" data-id="${n.id}" style="margin-top:4px; font-size:12px; color:var(--accent); background:none; border:none; cursor:pointer;">Mark as read</button>`
          : '';
        return `
          <div class="notification-item ${readClass}" data-id="${n.id}">
            <strong>${n.title || 'Announcement'}</strong>
            <p>${n.message || ''}</p>
            ${seenButton}
          </div>
        `;
      })
      .join('');

    // Attach "mark as read" events
    this.list.querySelectorAll('.mark-seen-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.markAsRead(id);
      });
    });
  }

  async markAsRead(id) {
    try {
      await fetch(`/api/ddm/announcements/${id}/read`, { method: 'POST', credentials: 'include' });
      // Update local data
      const notif = this.notifications.find(n => n.id == id);
      if (notif) {
        notif.is_read = true;
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        this.updateBadge();
        this.renderDropdownContent();
      }
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  }

  async markAllRead() {
    try {
      await fetch('/api/ddm/announcements/read-all', { method: 'POST', credentials: 'include' });
      this.notifications.forEach(n => n.is_read = true);
      this.unreadCount = 0;
      this.updateBadge();
      this.renderDropdownContent();
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  }
}
// end of RCA/frontend/src/components/ddm/notification-panel.js