// RCA/frontend/src/components/ddm/file-list.js
import * as FileService from "../../services/ddm/file-service.js";
import { fileCard } from "./file-card.js";
import { showToast } from "../ui/toast.js";
import { uiStore } from "../../stores/ui-store.js";

export class FileList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.selectedFileIds = new Set();
    this.bulkBar = null;
    this._createBulkBar();
    this.load();
    uiStore.onViewChange((view) => this.render(view));
    uiStore.onFilterChange(() => this.render(uiStore.viewMode));
    uiStore.onTypeChange(() => this.render(uiStore.viewMode));
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
    this.selectedFileIds.clear();
    this.render(uiStore.viewMode);
  }

  _filterByType(files) {
    const type = uiStore.typeFilter;
    if (!type || type === 'all') return files;
    return files.filter(file => {
      const ext = (file.name || '').split('.').pop().toLowerCase();
      if (type === 'image') return ['jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext);
      if (type === 'video') return ['mp4','webm','mov','avi'].includes(ext);
      if (type === 'doc') return ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','rtf'].includes(ext);
      return true;
    });
  }

  render(viewMode = uiStore.viewMode) {
    if (!this.container) return;
    if (this.files === null) {
      this.container.innerHTML = `<p style="color: var(--danger);">Could not load files. Please refresh.</p>`;
      this._updateBulkBar();
      return;
    }
    const filtered = this._filterByType(this.files);
    if (filtered.length === 0) {
      this.container.innerHTML = `<p style="color: var(--text-muted);">No files available.</p>`;
      this._updateBulkBar();
      return;
    }

    const cardsHTML = filtered.map(file => fileCard(file, viewMode, this.selectedFileIds)).join('');

    if (viewMode === 'grid') {
      this.container.innerHTML = `<div class="file-grid">${cardsHTML}</div>`;
    } else {
      this.container.innerHTML = `<div class="file-list-view">${cardsHTML}</div>`;
    }

    this._initVideoHovers();
    this._initListVideoHovers();
    this._updateBulkBar();
  }

  /* ── Bulk Download Bar ── */
  _createBulkBar() {
    this.bulkBar = document.createElement('div');
    this.bulkBar.id = 'bulk-action-bar';
    this.bulkBar.className = 'bulk-action-bar';
    this.bulkBar.setAttribute('aria-hidden', 'true');
    this.bulkBar.innerHTML = `
      <div class="bulk-action-bar-inner">
        <span class="bulk-action-count" id="bulk-selected-count">0 selected</span>
        <button class="bulk-action-btn bulk-download-btn" id="bulk-download-btn">
          <i class="fa-solid fa-file-zipper" aria-hidden="true"></i>
          Download as ZIP
        </button>
        <button class="bulk-action-btn bulk-deselect-btn" id="bulk-deselect-btn">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          Clear Selection
        </button>
      </div>
    `;
    document.body.appendChild(this.bulkBar);

    this.bulkBar.querySelector('#bulk-download-btn').addEventListener('click', () => this._bulkDownload());
    this.bulkBar.querySelector('#bulk-deselect-btn').addEventListener('click', () => this._clearSelection());
  }

  _updateBulkBar() {
    if (!this.bulkBar) return;
    const count = this.selectedFileIds.size;
    const countSpan = this.bulkBar.querySelector('#bulk-selected-count');
    if (countSpan) countSpan.textContent = `${count} selected`;

    if (count >= 2) {
      this.bulkBar.classList.add('visible');
      this.bulkBar.setAttribute('aria-hidden', 'false');
    } else {
      this.bulkBar.classList.remove('visible');
      this.bulkBar.setAttribute('aria-hidden', 'true');
    }
  }

  async _bulkDownload() {
    if (this.selectedFileIds.size < 2) return;
    try {
      const ids = Array.from(this.selectedFileIds);
      await FileService.downloadFilesAsZip(ids);
      showToast('Download started!', 'success');
    } catch (err) {
      showToast('Failed to create ZIP: ' + (err.message || 'Unknown error'), 'error');
    }
  }

  _clearSelection() {
    this.selectedFileIds.clear();
    this.render(uiStore.viewMode);
    showToast('Selection cleared', 'info');
  }

  _toggleFileSelection(fileId) {
    if (this.selectedFileIds.has(fileId)) {
      this.selectedFileIds.delete(fileId);
    } else {
      this.selectedFileIds.add(fileId);
    }
    this.render(uiStore.viewMode);
  }

  /* ── Video Hovers ── */
  _initVideoHovers() {
    const wrappers = this.container.querySelectorAll('.file-image');
    wrappers.forEach(wrapper => {
      const video = wrapper.querySelector('video');
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
        } else {
          video.load();
          video.addEventListener('loadeddata', () => {
            video.currentTime = 0;
            video.play().catch(() => {});
            resetTimeout = setTimeout(() => {
              video.pause();
              video.currentTime = 0;
            }, 5000);
          }, { once: true });
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

  _initListVideoHovers() {
    const thumbs = this.container.querySelectorAll('.file-list-thumb');
    thumbs.forEach(thumb => {
      const video = thumb.querySelector('video');
      if (!video) return;
      const playOverlay = thumb.querySelector('.play-overlay-list');
      let playTimeout, resetTimeout;
      const startPreview = () => {
        if (playOverlay) playOverlay.style.display = 'none';
        video.style.display = 'block';
        if (video.readyState >= 2) {
          video.currentTime = 0;
          video.play().catch(() => {});
          resetTimeout = setTimeout(() => {
            video.pause();
            video.currentTime = 0;
            video.style.display = 'none';
            if (playOverlay) playOverlay.style.display = 'flex';
          }, 5000);
        } else {
          video.load();
          video.addEventListener('loadeddata', () => {
            video.currentTime = 0;
            video.play().catch(() => {});
            resetTimeout = setTimeout(() => {
              video.pause();
              video.currentTime = 0;
              video.style.display = 'none';
              if (playOverlay) playOverlay.style.display = 'flex';
            }, 5000);
          }, { once: true });
        }
      };
      const stopPreview = () => {
        clearTimeout(playTimeout);
        clearTimeout(resetTimeout);
        video.pause();
        video.currentTime = 0;
        video.style.display = 'none';
        if (playOverlay) playOverlay.style.display = 'flex';
      };
      thumb.addEventListener('mouseenter', () => {
        playTimeout = setTimeout(startPreview, 300);
      });
      thumb.addEventListener('mouseleave', stopPreview);
    });
  }

  /* ── Event Delegation ── */
  _setupDelegation() {
    this.container.addEventListener('click', (e) => {
      // Handle checkbox clicks
      const checkboxWrapper = e.target.closest('.file-checkbox-wrapper');
      if (checkboxWrapper) {
        e.preventDefault(); // stop native checkbox toggle
        e.stopPropagation();
        const fileId = checkboxWrapper.dataset.fileId;
        if (fileId) this._toggleFileSelection(fileId);
        return;
      }

      const target = e.target.closest('button') || e.target.closest('.kebab-menu');
      if (!target) return;

      const fileId = target.dataset.fileId || target.parentElement.dataset.fileId;
      const file = this.files.find(f => f.id == fileId);
      if (!file) return;

      if (target.classList.contains('kebab-menu') || (target.tagName === 'I' && target.parentElement.classList.contains('kebab-menu'))) {
          const dropdown = this.container.querySelector(`.file-actions-dropdown[data-file-id="${fileId}"]`);
          this.container.querySelectorAll('.file-actions-dropdown').forEach(d => d.classList.remove('open'));
          if (dropdown) dropdown.classList.toggle('open');
          return;
      }

      if (target.classList.contains('action-preview')) {
          if (window.filePreviewPanel) {
              window.filePreviewPanel.open(file);
          } else {
              showToast('Preview panel not loaded', 'warning');
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

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.kebab-menu') && !e.target.closest('.file-actions-dropdown')) {
            this.container.querySelectorAll('.file-actions-dropdown').forEach(d => d.classList.remove('open'));
        }
    });
  }
}
// end of RCA/frontend/src/components/ddm/file-list.js