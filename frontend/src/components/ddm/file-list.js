// RCA/frontend/src/components/ddm/file-list.js
import * as FileService from "../../services/ddm/file-service.js";
import { fileCard } from "./file-card.js";
import { showToast } from "../ui/toast.js";
import { uiStore } from "../../stores/ui-store.js";

export class FileList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.load();
    uiStore.onViewChange((view) => this.render(view));
    uiStore.onFilterChange(() => this.render(uiStore.viewMode));
    this._setupDelegation();
  }

  async load() {
    try {
      let raw = await FileService.fetchUserFiles();
      if (uiStore.groupFilter) {
        raw = raw.filter(file => {
          const groups = Array.isArray(file.groups) ? file.groups : [];
          return groups.some(g => g.id == uiStore.groupFilter || g.name === uiStore.groupFilter);
        });
      }
      this.files = Array.isArray(raw) ? raw : [];
    } catch (e) {
      try { showToast(e.message || "Failed to load files", "error"); } catch (_) {}
      this.files = null;
      console.error("File fetch error:", e);
    }
    this.render(uiStore.viewMode);
  }

  setFiles(files) {
    this.files = Array.isArray(files) ? files : [];
    this.render(uiStore.viewMode);
  }

  render(viewMode = uiStore.viewMode) {
    if (!this.container) return;
    if (this.files === null) {
      this.container.innerHTML = `<p class="text-red-400">Could not load files. Please refresh.</p>`;
      return;
    }
    if (this.files.length === 0) {
      this.container.innerHTML = `<p class="text-gray-400">No files available.</p>`;
      return;
    }

    if (viewMode === 'grid') {
      this.container.innerHTML = `<div class="file-grid">${this.files.map(fileCard).join('')}</div>`;
    } else if (viewMode === 'list') {
      this.container.innerHTML = `<div class="space-y-4">${this.files.map(fileCard).join('')}</div>`;
    } else {
      this.container.innerHTML = `<div class="file-grid">${this.files.map(fileCard).join('')}</div>`;
    }
    this._initVideoHovers();
  }

  _initVideoHovers() {
    const wrappers = this.container.querySelectorAll('.file-image');
    wrappers.forEach(wrapper => {
      const video = wrapper.querySelector('video'); // Not implemented yet in card, but future-proof
      if (!video) return;
      let playTimeout, resetTimeout;
      const startPreview = () => {
        if (video.readyState >= 2) {
          video.currentTime = 0;
          video.play().catch(() => {});
          resetTimeout = setTimeout(() => {
            video.pause();
            video.currentTime = 0;
          }, 5000);
        }
      };
      const stopPreview = () => {
        clearTimeout(playTimeout);
        clearTimeout(resetTimeout);
        video.pause();
        video.currentTime = 0;
      };
      wrapper.addEventListener('mouseenter', () => {
        playTimeout = setTimeout(startPreview, 300);
      });
      wrapper.addEventListener('mouseleave', stopPreview);
    });
  }

  _setupDelegation() {
    this.container.addEventListener('click', (e) => {
        const target = e.target.closest('button') || e.target.closest('.kebab-menu');
        if (!target) return;
        
        const fileId = target.dataset.fileId || target.parentElement.dataset.fileId;
        const file = this.files.find(f => f.id == fileId);
        if (!file) return;

        // Dropdown menu toggle
        if (target.classList.contains('kebab-menu') || target.tagName === 'I' && target.parentElement.classList.contains('kebab-menu')) {
            const dropdown = this.container.querySelector(`.file-actions-dropdown[data-file-id="${fileId}"]`);
            // Close all other dropdowns
            this.container.querySelectorAll('.file-actions-dropdown').forEach(d => d.classList.remove('open'));
            if (dropdown) {
                dropdown.classList.toggle('open');
            }
            return;
        }

        // Action inside dropdown
        if (target.classList.contains('action-preview')) {
            if (window.filePreviewPanel) {
                window.filePreviewPanel.open(file);
            }
        } else if (target.classList.contains('action-download')) {
            window.open(`/api/ddm/files/${fileId}/download`, '_blank');
        } else if (target.classList.contains('action-ai')) {
            if (window.aiChatPanel) {
                window.aiChatPanel.setFileContext(file);
                const panel = document.getElementById("ai-chat-panel");
                const toggle = document.getElementById("ai-chat-toggle");
                if (panel && panel.classList.contains("hidden") && toggle) toggle.click();
            }
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.kebab-menu') && !e.target.closest('.file-actions-dropdown')) {
            this.container.querySelectorAll('.file-actions-dropdown').forEach(d => d.classList.remove('open'));
        }
    });
  }
}
// end of RCA/frontend/src/components/ddm/file-list.js