// RCA/frontend/src/js/ddm-dashboard.js
console.log("✅ Dashboard v2.1.0 (drag-drop, preview, AI per file) loaded");

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

// View toggle handler
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

// ---------- Drag & Drop Upload Initialization ----------
function initDropZone() {
    const container = document.getElementById("file-list-container");
    if (!container) return;

    // Insert drop zone before file list
    const dropZone = document.createElement("div");
    dropZone.id = "drop-zone";
    dropZone.innerHTML = `
        <p>Drag & drop files here or click to browse</p>
        <input type="file" id="drop-file-input" multiple hidden>
        <div class="upload-progress hidden">
            <div class="upload-progress-bar" style="width:0%"></div>
        </div>
    `;
    container.parentNode.insertBefore(dropZone, container);

    const fileInput = document.getElementById("drop-file-input");
    const progressContainer = dropZone.querySelector(".upload-progress");
    const progressBar = progressContainer.querySelector(".upload-progress-bar");

    // Click to open file dialog
    dropZone.addEventListener("click", () => fileInput.click());

    // Drag events
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener("change", () => {
        handleFiles(fileInput.files);
        fileInput.value = "";
    });

    async function handleFiles(fileList) {
        if (!fileList.length) return;
        // We'll upload one by one for progress visibility
        for (const file of fileList) {
            progressContainer.classList.remove("hidden");
            progressBar.style.width = "0%";
            try {
                const formData = new FormData();
                formData.append("file", file);
                // Provide a default name and description; user can edit via request queue
                formData.append("name", file.name);
                formData.append("description", "");

                const { uploadFileWithProgress } = await import("../services/ddm/file-service.js");
                await uploadFileWithProgress(formData, (percent) => {
                    progressBar.style.width = percent + "%";
                });
                progressBar.style.width = "100%";
                // Refresh file list
                document.dispatchEvent(new Event('refresh-files'));
            } catch (err) {
                import("../components/ui/toast.js").then(({ showToast }) => {
                    showToast("Upload failed: " + (err.message || "unknown"), "error");
                });
            } finally {
                setTimeout(() => {
                    progressContainer.classList.add("hidden");
                    progressBar.style.width = "0%";
                }, 1500);
            }
        }
    }
}

(async function init() {
    const authenticated = await verifySession();
    if (!authenticated) return;

    // Initialize drop zone
    initDropZone();

    // Load Announcement Panel
    try {
        const { default: AnnouncementPanel } = await import("../components/ddm/announcement-panel.js");
        new AnnouncementPanel("announcements-container");
    } catch (err) {
        console.warn("Announcements panel not available:", err);
    }

    // Load Search Bar
    try {
        const { default: SearchBar } = await import("../components/ddm/search-bar.js");
        const searchBar = new SearchBar("search-container", (results) => {
            document.dispatchEvent(new CustomEvent('search-results', { detail: results }));
        });
    } catch (err) {
        console.error("Search bar failed to load:", err);
    }

    // Load File List with view mode support
    let fileList;
    try {
        const { FileList } = await import("../components/ddm/file-list.js");
        fileList = new FileList("file-list-container");
        document.addEventListener('search-results', (e) => {
            fileList.setFiles(e.detail.results || []);
        });
        document.addEventListener('refresh-files', () => {
            fileList.load(); // reload from server
        });
    } catch (err) {
        document.getElementById("file-list-container").innerHTML =
            `<p class="text-red-500">Failed to load file list: ${err.message}</p>`;
        console.error(err);
    }

    // Load AI Chat Panel (floating button)
    try {
        const { default: AiChatPanel } = await import("../components/ddm/ai-chat-panel.js");
        window.aiChatPanel = new AiChatPanel(); // make accessible for file cards
    } catch (err) {
        console.warn("AI Chat panel not available:", err);
    }

    // Load File Preview Panel
    try {
        const { default: FilePreviewPanel } = await import("../components/ddm/file-preview-panel.js");
        window.filePreviewPanel = new FilePreviewPanel();
    } catch (err) {
        console.warn("File preview panel not available:", err);
    }
})();
// end of RCA/frontend/src/js/ddm-dashboard.js