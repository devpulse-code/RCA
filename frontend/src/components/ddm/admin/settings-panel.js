// RCA/frontend/src/components/ddm/admin/settings-panel.js
import * as AdminService from "../../../services/ddm/admin-service.js";
import { showToast } from "../../ui/toast.js";

export class SettingsPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.settings = null;   // null = not loaded yet
    this.load();
  }

  async load() {
    try {
      const data = await AdminService.fetchSettings();
      this.settings = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    } catch (e) {
      showToast("Failed to load settings", "error");
      this.settings = {};
    }
    this.render();
  }

  render() {
    if (!this.container) return;

    // If settings haven't loaded yet, show a loading indicator
    if (!this.settings) {
      this.container.innerHTML = '<p class="text-gray-500">Loading settings...</p>';
      return;
    }

    const s = this.settings;
    this.container.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">System Settings</h2>
      <form id="settings-form" class="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label class="block text-sm font-medium">Session Duration (hours)</label>
          <input type="number" name="session_duration_hours" value="${s.session_duration_hours || 8}" class="w-full border p-2">
        </div>
        <div>
          <label class="block text-sm font-medium">Inactivity Timeout (minutes)</label>
          <input type="number" name="session_inactivity_minutes" value="${s.session_inactivity_minutes || 30}" class="w-full border p-2">
        </div>
        <div>
          <label class="flex items-center space-x-2">
            <input type="checkbox" name="single_session_mode" ${s.single_session_mode === 'true' ? 'checked' : ''}>
            <span>Single Session Mode</span>
          </label>
        </div>
        <div>
          <label class="flex items-center space-x-2">
            <input type="checkbox" name="ddm_ai_enabled" ${s.ddm_ai_enabled === 'true' ? 'checked' : ''}>
            <span>Enable AI Assistant</span>
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium">Admin Upload Limit (MB)</label>
          <input type="number" name="ddm_admin_upload_limit_mb" value="${s.ddm_admin_upload_limit_mb || 500}" class="w-full border p-2">
        </div>
        <div>
          <label class="block text-sm font-medium">User Upload Limit (MB)</label>
          <input type="number" name="ddm_user_upload_limit_mb" value="${s.ddm_user_upload_limit_mb || 100}" class="w-full border p-2">
        </div>
        <div>
          <label class="block text-sm font-medium">Audit Log Retention (days, 0 = indefinite)</label>
          <input type="number" name="audit_log_retention_days" value="${s.audit_log_retention_days || 1095}" class="w-full border p-2">
        </div>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Save Settings</button>
      </form>
    `;

    this.container.querySelector("#settings-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        session_duration_hours: form.session_duration_hours.value,
        session_inactivity_minutes: form.session_inactivity_minutes.value,
        single_session_mode: form.single_session_mode.checked.toString(),
        ddm_ai_enabled: form.ddm_ai_enabled.checked.toString(),
        ddm_admin_upload_limit_mb: form.ddm_admin_upload_limit_mb.value,
        ddm_user_upload_limit_mb: form.ddm_user_upload_limit_mb.value,
        audit_log_retention_days: form.audit_log_retention_days.value,
      };
      try {
        await AdminService.updateSettings(data);
        showToast("Settings saved", "success");
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }
}
// end of RCA/frontend/src/components/ddm/admin/settings-panel.js