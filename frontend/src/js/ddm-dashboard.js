// RCA/frontend/src/js/ddm-dashboard.js
console.log("✅ Dashboard v1.0.4 (redesigned) loaded");

function showError(msg) {
    const banner = document.getElementById("error-banner");
    if (banner) {
        banner.textContent = msg;
        banner.style.display = "block";
    }
}

async function verifySession() {
    try {
        const res = await fetch('/api/ddm/auth/session', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            if (data.user_id || data.role === 'user') {
                return true;
            }
        }
        navigateTo('/pages/ddm/login.html');
        return false;
    } catch (e) {
        showError('Backend unreachable – redirecting to login');
        setTimeout(() => { navigateTo('/pages/ddm/login.html'); }, 2000);
        return false;
    }
}

document.getElementById("logout-btn").addEventListener("click", () => {
    document.cookie = "user_session=; Max-Age=0; path=/";
    navigateTo("/pages/ddm/login.html");
});

(async function init() {
    const authenticated = await verifySession();
    if (!authenticated) return;

    try {
        const { default: AnnouncementPanel } = await import("../components/ddm/announcement-panel.js");
        new AnnouncementPanel("announcements-container");
    } catch (err) {
        console.warn("Announcements panel not available:", err);
    }

    try {
        const { FileList } = await import("../components/ddm/file-list.js");
        new FileList("file-list-container");
    } catch (err) {
        document.getElementById("file-list-container").innerHTML =
            `<p class="text-red-500">Failed to load file list: ${err.message}</p>`;
        console.error(err);
    }
})();
// end of RCA/frontend/src/js/ddm-dashboard.js