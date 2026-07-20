// RCA/frontend/src/js/ddm-dashboard.js

/**
 * DDM Dashboard — Enhanced JavaScript
 * Handles session, greeting, notifications, AI FAB, filters, select mode,
 * sticky header detection, and pagination.
 */

let userName = "User";
let currentView = "files";
let fileListInstance = null;
let searchBarInstance = null;

/* ──────────────── Toast System ──────────────── */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-exclamation',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info}" aria-hidden="true"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    const removeToast = () => {
        toast.classList.add('toast--removing');
        toast.addEventListener('animationend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, { once: true });
    };

    setTimeout(removeToast, duration);
}

/* ──────────────── Error Banner ──────────────── */
function showError(msg) {
    const banner = document.getElementById('error-banner');
    if (banner) {
        banner.textContent = msg;
        banner.style.display = 'block';
        setTimeout(() => {
            if (banner.textContent === msg) {
                banner.style.display = 'none';
            }
        }, 8000);
    }
    showToast(msg, 'error', 6000);
}

function hideError() {
    const banner = document.getElementById('error-banner');
    if (banner) banner.style.display = 'none';
}

/* ──────────────── Time Greeting ──────────────── */
function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function updateGreeting() {
    const greetingPrefix = document.getElementById('greeting-prefix');
    if (greetingPrefix) {
        greetingPrefix.textContent = getTimeGreeting();
    }
}

/* ──────────────── Session Verification ──────────────── */
async function verifySession() {
    try {
        const res = await fetch('/api/ddm/auth/session', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            userName = data.name || data.display_name || data.username || 'User';
            document.getElementById('welcome-name').textContent = userName;
            document.getElementById('display-name').textContent = userName;
            const dropdownName = document.getElementById('dropdown-display-name');
            if (dropdownName) dropdownName.textContent = userName;
            updateGreeting();
            hideError();
            return true;
        }
        window.location.href = '/pages/ddm/login.html';
        return false;
    } catch (e) {
        showError('Backend unreachable – redirecting to login');
        setTimeout(() => window.location.href = '/pages/ddm/login.html', 2500);
        return false;
    }
}

/* ──────────────── Skeleton & Empty States ──────────────── */
function showSkeletonLoader() {
    const el = document.getElementById('skeleton-loader');
    const empty = document.getElementById('empty-state');
    if (el) el.style.display = 'grid';
    if (empty) empty.style.display = 'none';
}

function hideSkeletonLoader() {
    const el = document.getElementById('skeleton-loader');
    if (el) el.style.display = 'none';
}

function showEmptyState() {
    const empty = document.getElementById('empty-state');
    const skel = document.getElementById('skeleton-loader');
    if (skel) skel.style.display = 'none';
    if (empty) empty.style.display = 'flex';
}

function hideEmptyState() {
    const empty = document.getElementById('empty-state');
    if (empty) empty.style.display = 'none';
}

/* ──────────────── View Toggle ──────────────── */
function toggleView(view) {
    currentView = view;
    const fileListContainer = document.getElementById('file-list-container');
    let uploadTrackerContainer = document.getElementById('upload-tracker-container');

    if (!uploadTrackerContainer) {
        uploadTrackerContainer = document.createElement('div');
        uploadTrackerContainer.id = 'upload-tracker-container';
        fileListContainer.parentNode.insertBefore(uploadTrackerContainer, fileListContainer);
    }

    const libraryHeader = document.querySelector('.library-header');
    const loadMoreContainer = document.querySelector('.load-more-container');
    const skeletonLoader = document.getElementById('skeleton-loader');
    const emptyState = document.getElementById('empty-state');

    if (view === 'requests') {
        fileListContainer.style.display = 'none';
        if (skeletonLoader) skeletonLoader.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        uploadTrackerContainer.style.display = 'block';
        if (libraryHeader) libraryHeader.style.display = 'none';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';

        if (uploadTrackerContainer.childElementCount === 0) {
            import('../components/ddm/upload-tracker.js')
                .then(({ default: UploadTracker }) => {
                    new UploadTracker('upload-tracker-container');
                })
                .catch(err => console.warn('Upload tracker failed to load:', err));
        }
    } else {
        fileListContainer.style.display = 'block';
        uploadTrackerContainer.style.display = 'none';
        if (libraryHeader) libraryHeader.style.display = 'flex';
        if (loadMoreContainer) loadMoreContainer.style.display = 'flex';
        if (fileListContainer && fileListContainer.children.length === 0) {
            showSkeletonLoader();
        }
    }

    const profileTrigger = document.getElementById('profile-trigger');
    if (profileTrigger) profileTrigger.setAttribute('aria-expanded', 'false');
}

/* ──────────────── Scroll Reveal ──────────────── */
function initScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });

    const librarySection = document.querySelector('.library-section');
    if (librarySection) {
        librarySection.style.opacity = '0';
        librarySection.style.transform = 'translateY(16px)';
        librarySection.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        revealObserver.observe(librarySection);
    }
}

/* ──────────────── File Count Indicator ──────────────── */
function updateFileCount(count) {
    const indicator = document.getElementById('file-count-indicator');
    if (indicator) {
        if (count !== undefined && count !== null) {
            indicator.textContent = `${count} file${count !== 1 ? 's' : ''}`;
            indicator.style.display = 'inline-block';
        } else {
            indicator.style.display = 'none';
        }
    }
}

/* ──────────────── Keyboard Navigation ──────────────── */
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const profileDropdown = document.getElementById('profile-dropdown');
            if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
                const trigger = document.getElementById('profile-trigger');
                if (trigger) {
                    trigger.setAttribute('aria-expanded', 'false');
                    trigger.focus();
                }
            }
        }
    });

    const profileTrigger = document.getElementById('profile-trigger');
    if (profileTrigger) {
        profileTrigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                profileTrigger.click();
            }
        });
    }
}

/* ──────────────── Sticky Class on Scroll ──────────────── */
function initStickyScroll() {
    const filterEl = document.querySelector('.file-type-filter');
    const headerEl = document.querySelector('.library-header');

    const checkScroll = () => {
        const scrollY = window.scrollY;
        const threshold = 80; // pixels from top after navbar

        if (filterEl) {
            if (scrollY > threshold) {
                filterEl.classList.add('scrolled');
            } else {
                filterEl.classList.remove('scrolled');
            }
        }
        if (headerEl) {
            if (scrollY > threshold) {
                headerEl.classList.add('scrolled');
            } else {
                headerEl.classList.remove('scrolled');
            }
        }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll(); // initial
}

/* ──────────────── Main Init ──────────────── */
async function init() {
    showSkeletonLoader();
    const authenticated = await verifySession();
    if (!authenticated) return;

    updateGreeting();
    setInterval(updateGreeting, 60000);

    // ── File Preview Panel ──
    try {
        const { default: FilePreviewPanel } = await import('../components/ddm/file-preview-panel.js');
        window.filePreviewPanel = new FilePreviewPanel();
    } catch (err) { console.warn('File preview panel not available:', err); }

    // Load components
    try {
    const { UploadForm } = await import('../components/ddm/upload-form.js');
    new UploadForm('upload-container');
} catch (err) { console.warn('Upload form not available:', err); }
    // Search Bar
    try {
        const { default: SearchBar } = await import('../components/ddm/search-bar.js');
        searchBarInstance = new SearchBar('search-container', (data) => {
            document.dispatchEvent(new CustomEvent('search-results', { detail: data }));
            if (data && data.results && data.results.length > 0) {
                hideEmptyState();
                hideSkeletonLoader();
            }
        });
    } catch (err) { console.error('Search bar failed:', err); }

    // File List (pass load-more button ID)
    try {
        const { FileList } = await import('../components/ddm/file-list.js');
        fileListInstance = new FileList('file-list-container', 'load-more-btn');

        const fileListContainer = document.getElementById('file-list-container');
        if (fileListContainer) {
            const observer = new MutationObserver(() => {
                const cards = fileListContainer.querySelectorAll('.file-card, .file-list-row');
                if (cards.length > 0) {
                    hideSkeletonLoader();
                    hideEmptyState();
                    updateFileCount(cards.length);
                } else if (
                    fileListContainer.children.length > 0 &&
                    !fileListContainer.querySelector('#skeleton-loader') &&
                    !fileListContainer.querySelector('#empty-state')
                ) {
                    const hasFiles = fileListContainer.querySelector('.file-card') || fileListContainer.querySelector('.file-list-row');
                    if (!hasFiles && fileListContainer.style.display !== 'none') {
                        showEmptyState();
                    }
                }
            });
            observer.observe(fileListContainer, { childList: true, subtree: true });
        }

        document.addEventListener('search-results', (e) => {
            const results = e.detail.results || [];
            if (fileListInstance) fileListInstance.setFiles(results);
            if (results.length === 0) showEmptyState();
            else {
                hideEmptyState();
                updateFileCount(results.length);
            }
        });

        document.addEventListener('search-cleared', () => {
            if (fileListInstance) {
                showSkeletonLoader();
                hideEmptyState();
                fileListInstance.load();
            }
        });

        document.addEventListener('refresh-files', () => {
            if (fileListInstance) {
                showSkeletonLoader();
                hideEmptyState();
                fileListInstance.load();
            }
        });
    } catch (err) {
        document.getElementById('file-list-container').innerHTML =
            `<p class="empty-state" style="color: var(--danger);">Failed to load file list: ${err.message}</p>`;
        console.error(err);
        hideSkeletonLoader();
    }

    // Notification Panel
    try {
        const { default: NotificationPanel } = await import('../components/ddm/notification-panel.js');
        new NotificationPanel('notification-bell-container');
    } catch (err) { console.warn('Notification panel not available:', err); }

    // AI Chat Panel
    try {
        const { default: AiChatPanel } = await import('../components/ddm/ai-chat-panel.js');
        window.aiChatPanel = new AiChatPanel();
        const aiFab = document.getElementById('ai-chat-trigger');
        if (aiFab && window.aiChatPanel && typeof window.aiChatPanel.toggle === 'function') {
            aiFab.addEventListener('click', () => window.aiChatPanel.toggle());
        }
    } catch (err) {
        console.warn('AI chat panel not available:', err);
        const aiFab = document.getElementById('ai-chat-trigger');
        if (aiFab) aiFab.style.display = 'none';
    }

    // ── Select button ──
    const selectToggleBtn = document.getElementById('select-toggle');
    const { uiStore } = await import('../stores/ui-store.js');

    const updateSelectButtonState = () => {
        if (selectToggleBtn) {
            if (uiStore.selectMode) {
                selectToggleBtn.classList.add('active');
                selectToggleBtn.setAttribute('aria-pressed', 'true');
            } else {
                selectToggleBtn.classList.remove('active');
                selectToggleBtn.setAttribute('aria-pressed', 'false');
            }
        }
    };

    if (selectToggleBtn) {
        selectToggleBtn.addEventListener('click', () => {
            uiStore.toggleSelectMode();
            updateSelectButtonState();
            if (!uiStore.selectMode && fileListInstance) {
                fileListInstance._clearSelection();
            }
        });
    }

    uiStore.onSelectModeChange(() => {
        updateSelectButtonState();
    });

    // ── Sort Toggle ──
    const sortToggle = document.getElementById('sort-toggle');
    if (sortToggle) {
        sortToggle.addEventListener('click', () => {
            const currentSort = sortToggle.dataset.sort;
            const newSort = currentSort === 'newest' ? 'oldest' : 'newest';

            sortToggle.dataset.sort = newSort;
            sortToggle.classList.add('active');
            sortToggle.setAttribute('aria-pressed', 'true');

            const icon = sortToggle.querySelector('i');
            const label = sortToggle.querySelector('.sort-label');
            if (newSort === 'newest') {
                icon.className = 'fa-solid fa-arrow-up-wide-short';
                label.textContent = 'Newest';
            } else {
                icon.className = 'fa-solid fa-arrow-down-short-wide';
                label.textContent = 'Oldest';
            }

            document.dispatchEvent(new CustomEvent('sort-files', { detail: { sort: newSort } }));
        });
    }

    // ── View Buttons ──
    document.querySelectorAll('.sort-toggle-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-toggle-btn[data-view]').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            const view = btn.dataset.view;
            uiStore.setViewMode(view);
        });
    });

    // ── Sort-files event handler ──
    document.addEventListener('sort-files', (e) => {
        if (!fileListInstance || !fileListInstance.allFiles) return;
        const sort = e.detail.sort;
        fileListInstance.allFiles.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            if (sort === 'newest') return dateB - dateA;
            if (sort === 'oldest') return dateA - dateB;
            return 0;
        });
        fileListInstance.visibleCount = fileListInstance.pageSize; // reset pagination
        fileListInstance.render(uiStore.viewMode);
    });

    // ── File type filter buttons ──
    document.querySelectorAll('#file-type-filter .type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#file-type-filter .type-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            const type = btn.dataset.type;
            uiStore.setTypeFilter(type);

            if (searchBarInstance && searchBarInstance.getCurrentQuery()) {
                searchBarInstance.search();
            } else {
                if (type === 'all') {
                    if (searchBarInstance && searchBarInstance.searchInput) {
                        searchBarInstance.searchInput.value = '';
                    }
                    document.dispatchEvent(new CustomEvent('search-cleared'));
                } else {
                    if (fileListInstance && fileListInstance.allFiles) {
                        fileListInstance.visibleCount = fileListInstance.pageSize;
                        fileListInstance.render(uiStore.viewMode);
                    }
                }
            }
        });
    });

    // Profile dropdown
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileDropdown.classList.contains('hidden');
            profileDropdown.classList.toggle('hidden');
            profileTrigger.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        });

        document.getElementById('menu-my-requests')?.addEventListener('click', () => {
            toggleView('requests');
            profileDropdown.classList.add('hidden');
            profileTrigger.setAttribute('aria-expanded', 'false');
        });
        document.getElementById('menu-theme-toggle')?.addEventListener('click', () => {
            document.getElementById('theme-toggle')?.click();
            profileDropdown.classList.add('hidden');
            profileTrigger.setAttribute('aria-expanded', 'false');
        });
        document.getElementById('menu-logout')?.addEventListener('click', () => {
            document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            showToast('Logging out...', 'info', 2000);
            setTimeout(() => window.location.href = '/pages/ddm/login.html', 400);
        });

        document.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
                profileTrigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    initKeyboardNavigation();
    initScrollReveal();
    initStickyScroll(); // new
    toggleView('files');

    // Initial select button state
    updateSelectButtonState();

    setTimeout(() => {
        hideSkeletonLoader();
        const fl = document.getElementById('file-list-container');
        if (fl && fl.style.display !== 'none') {
            const hasFiles = fl.querySelector('.file-card') || fl.querySelector('.file-list-row');
            if (!hasFiles && currentView === 'files') showEmptyState();
        }
    }, 5000);

    window.showDashboardToast = showToast;
    window.updateFileCount = updateFileCount;
}

document.addEventListener('DOMContentLoaded', init);

export { showToast, showError, hideError, toggleView, updateFileCount };
// end of RCA/frontend/src/js/ddm-dashboard.js  