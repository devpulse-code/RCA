// RCA/frontend/src/js/ddm-dashboard.js
let userName = "User";
let currentView = "files";

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
                userName = data.name || "User";
                document.getElementById("welcome-name").textContent = userName;
                document.getElementById("display-name").textContent = userName;
                return true;
            }
        }
        window.location.href = '/pages/ddm/login.html';
        return false;
    } catch (e) {
        showError('Backend unreachable – redirecting to login');
        setTimeout(() => { window.location.href = '/pages/ddm/login.html'; }, 2000);
        return false;
    }
}

function toggleView(view) {
    currentView = view;
    const fileListContainer = document.getElementById("file-list-container");
    let uploadTrackerContainer = document.getElementById("upload-tracker-container");
    if (!uploadTrackerContainer) {
        uploadTrackerContainer = document.createElement("div");
        uploadTrackerContainer.id = "upload-tracker-container";
        fileListContainer.parentNode.insertBefore(uploadTrackerContainer, fileListContainer);
    }

    if (view === "requests") {
        fileListContainer.style.display = "none";
        uploadTrackerContainer.style.display = "block";
        document.querySelector('.library-header').style.display = "none";
        document.querySelector('.load-more-container').style.display = "none";
        if (uploadTrackerContainer.childElementCount === 0) {
            import("../components/ddm/upload-tracker.js").then(({ default: UploadTracker }) => {
                new UploadTracker("upload-tracker-container");
            });
        }
    } else {
        fileListContainer.style.display = "block";
        uploadTrackerContainer.style.display = "none";
        document.querySelector('.library-header').style.display = "flex";
        document.querySelector('.load-more-container').style.display = "flex";
    }
}

async function init() {
    const authenticated = await verifySession();
    if (!authenticated) return;

    // Upload Form (right column of hero)
    try {
        const { default: UploadForm } = await import("../components/ddm/upload-form.js");
        new UploadForm("upload-container");
    } catch (err) {
        console.warn("Upload form not available:", err);
    }

    // Search Bar
    try {
        const { default: SearchBar } = await import("../components/ddm/search-bar.js");
        new SearchBar("search-container", (data) => {
            document.dispatchEvent(new CustomEvent('search-results', { detail: data }));
        });
    } catch (err) {
        console.error("Search bar failed to load:", err);
    }

    // Group Filter
    try {
        const { default: GroupFilter } = await import("../components/ddm/group-filter.js");
        window.groupFilter = new GroupFilter("group-filter-container");
    } catch (err) {
        console.warn("Group filter not available:", err);
    }

    // File List
    let fileList;
    try {
        const { FileList } = await import("../components/ddm/file-list.js");
        fileList = new FileList("file-list-container");
        document.addEventListener('search-results', (e) => {
            const results = e.detail.results || [];
            fileList.setFiles(results);
        });
        document.addEventListener('refresh-files', () => {
            fileList.load();
        });
    } catch (err) {
        document.getElementById("file-list-container").innerHTML = `<p class="text-red-500">Failed to load file list: ${err.message}</p>`;
        console.error(err);
    }

    // Notification Panel (includes announcements)
    try {
        const { default: NotificationPanel } = await import("../components/ddm/notification-panel.js");
        new NotificationPanel("notification-bell-container");
    } catch (err) {
        console.warn("Notification panel not available:", err);
    }

    // AI Chat Panel
    try {
        const { default: AiChatPanel } = await import("../components/ddm/ai-chat-panel.js");
        window.aiChatPanel = new AiChatPanel();
    } catch (err) {
        console.warn("AI chat panel not available:", err);
    }

    // View Toggle Handler
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.dataset.view;
            import("../stores/ui-store.js").then(({ uiStore }) => {
                uiStore.setViewMode(view);
            });
        });
    });

    // Profile dropdown logic
    const profileTrigger = document.getElementById("profile-trigger");
    const profileDropdown = document.getElementById("profile-dropdown");
    profileTrigger.addEventListener("click", () => {
        profileDropdown.classList.toggle("hidden");
    });

    document.getElementById("menu-my-requests").addEventListener("click", () => {
        toggleView("requests");
        profileDropdown.classList.add("hidden");
    });

    // Dark/light theme toggle via hidden button
    document.getElementById("menu-theme-toggle").addEventListener("click", () => {
        const themeToggleBtn = document.getElementById("theme-toggle");
        if (themeToggleBtn) themeToggleBtn.click();
        profileDropdown.classList.add("hidden");
    });

    document.getElementById("menu-logout").addEventListener("click", () => {
        document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/pages/ddm/login.html";
    });

    document.addEventListener("click", (e) => {
        if (!profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add("hidden");
        }
    });

    // Default view
    toggleView("files");
}

document.addEventListener("DOMContentLoaded", init);
// end of RCA/frontend/src/js/ddm-dashboard.js