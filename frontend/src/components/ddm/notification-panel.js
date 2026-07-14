// RCA/frontend/src/components/ddm/notification-panel.js
import { fetchNotifications, markNotificationsRead } from "../../services/ddm/notification-service.js";

export default class NotificationPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.notifications = [];
    this.pollInterval = null;
    this.render();
    this.startPolling();
  }

  render() {
    this.container.innerHTML = `
      <div class="notification-bell" id="notification-bell">
        🔔
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
    this.updateUI();
  }

  updateUI() {
    const badge = document.getElementById("notification-badge");
    const dropdown = document.getElementById("notification-dropdown");
    if (!badge || !dropdown) return;

    const unreadCount = this.notifications.filter(n => !n.read).length;
    badge.textContent = unreadCount;
    badge.classList.toggle("hidden", unreadCount === 0);

    dropdown.innerHTML = this.notifications.length
      ? this.notifications.map(n => `
        <div class="notification-item">
          <div>${n.message}</div>
          <div class="time">${new Date(n.created_at).toLocaleString()}</div>
        </div>
      `).join('')
      : '<div class="notification-item">No notifications</div>';
  }

  startPolling() {
    this.loadNotifications();
    this.pollInterval = setInterval(() => this.loadNotifications(), 30000);
  }
}
// end of RCA/frontend/src/components/ddm/notification-panel.js