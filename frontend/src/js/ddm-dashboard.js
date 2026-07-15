// RCA/frontend/src/js/ddm-dashboard.js
console.log("✅ Dashboard v3.0 (Exact Design Matching) loaded");

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
        window.location.href = '/pages/ddm/login.html';
        return false;
    } catch (e) {
        showError('Backend unreachable – redirecting to login');
        setTimeout(() => { window.location.href = '/pages/ddm/login.html'; }, 2000);
        return false;
    }
}

async function init() {
    const authenticated = await verifySession();
    if (!authenticated) return;

    // Upload Form (Right Sidebar)
    try {
        const { default: UploadForm } = await import("../components/ddm/upload-form.js");
        new UploadForm("upload-container");
    } catch (err) {
        console.warn("Upload form not available:", err);
    }

    // Search Bar
    try {
        const { default: SearchBar } = await import("../components/ddm/search-bar.js");
        new SearchBar("search-container", (results) => {
            document.dispatchEvent(new CustomEvent('search-results', { detail: results }));
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
            fileList.setFiles(e.detail.results || []);
        });
        document.addEventListener('refresh-files', () => {
            fileList.load();
        });
    } catch (err) {
        document.getElementById("file-list-container").innerHTML = `<p class="text-red-500">Failed to load file list: ${err.message}</p>`;
        console.error(err);
    }

    // Notification Panel
    try {
        const { default: NotificationPanel } = await import("../components/ddm/notification-panel.js");
        new NotificationPanel("notification-bell-container");
    } catch (err) {
        console.warn("Notification panel not available:", err);
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

    // Popular Tags
    document.querySelectorAll('.popular-tags .tag').forEach(tagBtn => {
        tagBtn.addEventListener('click', () => {
            const tag = tagBtn.dataset.tag;
            const searchInput = document.getElementById("search-input");
            if(searchInput) {
                searchInput.value = tag;
                // Trigger search if function is available
                document.dispatchEvent(new CustomEvent('auto-search', { detail: { query: tag } }));
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", init);
// end of RCA/frontend/src/js/ddm-dashboard.js