// RCA/frontend/src/components/ddm/notification-panel.js
import { fetchNotifications } from "../../services/ddm/notification-service.js";

export default class NotificationPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.notifications = [];
    this.announcements = [];
    this.pollInterval = null;
    this.render();
    this.startPolling();
  }

  render() {
    this.container.innerHTML = `
      <div class="notification-bell" id="notification-bell">
        <i class="fa-solid fa-bell"></i>
        <span class="notification-badge hidden" id="notification-badge">0</span>
      </div>
      <div class="notification-dropdown" id="notification-dropdown"></div>
    `;
    document.getElementById("notification-bell").addEventListener("click", () => {
      const dd = document.getElementById("notification-dropdown");
      dd.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        document.getElementById("notification-dropdown")?.classList.remove("open");
      }
    });
  }

  async loadNotifications() {
    try {
      const data = await fetchNotifications();
      this.notifications = Array.isArray(data) ? data : [];
    } catch {
      this.notifications = [];
    }
    try {
      const res = await fetch('/api/ddm/announcements/', { credentials: 'include' });
      if (res.ok) {
        this.announcements = await res.json();
      } else {
        this.announcements = [];
      }
    } catch {
      this.announcements = [];
    }
    this.updateUI();
  }

  updateUI() {
    const badge = document.getElementById("notification-badge");
    const dropdown = document.getElementById("notification-dropdown");
    if (!badge || !dropdown) return;

    const unreadCount = this.notifications.filter(n => !n.read).length;
    badge.textContent = unreadCount;
    badge.classList.toggle("hidden", unreadCount === 0);

    let html = '';
    if (this.announcements.length) {
      html += '<div class="notification-section-title">Announcements</div>';
      this.announcements.forEach(a => {
        html += `
          <div class="notification-item announcement-item-notif">
            <strong>${a.title}</strong>
            <p>${a.body}</p>
            <div class="time">${new Date(a.created_at).toLocaleDateString()}</div>
          </div>
        `;
      });
    }

    if (this.notifications.length) {
      html += '<div class="notification-section-title">Notifications</div>';
      this.notifications.forEach(n => {
        html += `
          <div class="notification-item">
            <div>${n.message}</div>
            <div class="time">${new Date(n.created_at).toLocaleString()}</div>
          </div>
        `;
      });
    }

    if (!this.announcements.length && !this.notifications.length) {
      html = '<div class="notification-item">No notifications or announcements.</div>';
    }

    dropdown.innerHTML = html;
  }

  startPolling() {
    this.loadNotifications();
    this.pollInterval = setInterval(() => this.loadNotifications(), 30000);
  }
}
// end of RCA/frontend/src/components/ddm/notification-panel.js