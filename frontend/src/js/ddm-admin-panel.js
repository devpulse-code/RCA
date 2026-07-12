// RCA/frontend/src/js/ddm-admin-panel.js
const errorBanner = document.getElementById("error-banner");
function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.style.display = "block";
    console.error(msg);
}

async function verifySession() {
    try {
        const res = await fetch('/api/ddm/auth/session', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            if (data.role === 'admin') return true;
        }
        navigateTo('/pages/ddm/admin-login.html');
        return false;
    } catch (e) {
        showError('Backend unreachable');
        return false;
    }
}

const titleEl = document.getElementById("section-title");
const contentEl = document.getElementById("section-content");
const sectionTitles = {
    users: "User Management", groups: "Group Management",
    files: "File Management", "upload-queue": "Upload Request Queue",
    announcements: "Announcement Management", "audit-log": "Audit Log",
    settings: "System Settings"
};

async function loadComponent(section) {
    contentEl.innerHTML = '<p>Loading…</p>';
    try {
        switch (section) {
            case "users": {
                const { UserTable } = await import("../components/ddm/admin/user-table.js");
                return new UserTable("section-content");
            }
            case "files": {
                const { FileTable } = await import("../components/ddm/admin/file-table.js");
                return new FileTable("section-content");
            }
            case "upload-queue": {
                const { UploadQueue } = await import("../components/ddm/admin/upload-queue.js");
                return new UploadQueue("section-content");
            }
            case "announcements": {
                const { AnnouncementTable } = await import("../components/ddm/admin/announcement-table.js");
                return new AnnouncementTable("section-content");
            }
            case "audit-log": {
                const AuditLogViewer = (await import("../components/ddm/admin/audit-log-viewer.js")).default;
                return new AuditLogViewer("section-content");
            }
            case "settings": {
                const { SettingsPanel } = await import("../components/ddm/admin/settings-panel.js");
                return new SettingsPanel("section-content");
            }
            case "groups": {
                contentEl.innerHTML = `<p class="text-dim">Group management placeholder.</p>`;
                return null;
            }
            default: return null;
        }
    } catch (err) {
        contentEl.innerHTML = `<p class="text-red-500">Failed to load component: ${err.message}</p>`;
        console.error(err);
        return null;
    }
}

function loadSection(section) {
    document.querySelectorAll("[data-section]").forEach(link => {
        link.classList.toggle("active", link.dataset.section === section);
    });
    titleEl.textContent = sectionTitles[section] || section;
    contentEl.innerHTML = "";
    loadComponent(section);
}

document.getElementById("logout-btn").addEventListener("click", () => {
    document.cookie = "admin_session=; Max-Age=0; path=/";
    navigateTo("/pages/ddm/admin-login.html");
});

(async function init() {
    if (!(await verifySession())) return;

    document.querySelectorAll("[data-section]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            window.location.hash = section;
            loadSection(section);
        });
    });

    const initialSection = window.location.hash.replace("#", "") || "users";
    loadSection(initialSection);
})();
// end of RCA/frontend/src/js/ddm-admin-panel.js