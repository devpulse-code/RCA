// RCA/frontend/src/components/ddm/file-list.js
import * as FileService from "../../services/ddm/file-service.js";
import { fileCard } from "./file-card.js";
import { showToast } from "../ui/toast.js";
import { uiStore } from "../../stores/ui-store.js";
import { downloadFilesAsZip } from "../../services/ddm/file-service.js";

export class FileList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.selected = new Set();
    this._bulkToolbar = null;
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
    this.selected.clear();
    this.render(uiStore.viewMode);
  }

  setFiles(files) {
    this.files = Array.isArray(files) ? files : [];
    this.selected.clear();
    this.render(uiStore.viewMode);
  }

  render(viewMode = uiStore.viewMode) {
    if (!this.container) return;
    if (this.files === null) {
      this.container.innerHTML = `<p class="text-red-400">Could not load files. Please refresh or try again later.</p>`;
      return;
    }
    if (!Array.isArray(this.files)) {
      this.container.innerHTML = `<p class="text-gray-400">Unexpected data received.</p>`;
      return;
    }
    if (this.files.length === 0) {
      this.container.innerHTML = `<p class="text-gray-400">No files available.</p>`;
      return;
    }

    switch (viewMode) {
      case 'grid':
        this.container.innerHTML = `<div class="file-grid">${this.files.map(fileCard).join('')}</div>`;
        break;
      case 'category':
        this.renderCategoryView();
        break;
      case 'list':
      default:
        this.container.innerHTML = `<div class="space-y-4">${this.files.map(fileCard).join('')}</div>`;
        break;
    }
    this._initVideoHovers();
    this._syncCheckboxes();
    this._updateBulkToolbar();
  }

  renderCategoryView() {
    const grouped = {};
    this.files.forEach(file => {
      const type = this._getFileCategory(file);
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(file);
    });
    let html = '';
    for (const [category, files] of Object.entries(grouped)) {
      html += `<div class="category-group">
        <h3>${category}</h3>
        <div class="file-grid">${files.map(fileCard).join('')}</div>
      </div>`;
    }
    this.container.innerHTML = html;
  }

  _getFileCategory(file) {
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'Images';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'Documents';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Spreadsheets';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'Videos';
    if (['mp3', 'wav', 'flac'].includes(ext)) return 'Audio';
    return 'Other';
  }

  _initVideoHovers() {
    const wrappers = this.container.querySelectorAll('.video-thumb-wrapper');
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
      const btn = e.target.closest('button');
      if (btn) {
        const fileId = btn.dataset.fileId;
        if (btn.classList.contains('btn-preview')) {
          e.preventDefault();
          if (window.filePreviewPanel) {
            const file = this.files.find(f => f.id == fileId);
            if (file) window.filePreviewPanel.open(file);
          }
          return;
        }
        if (btn.classList.contains('btn-ask-ai')) {
          e.preventDefault();
          const file = this.files.find(f => f.id == fileId);
          if (file && window.aiChatPanel) {
            window.aiChatPanel.setFileContext(file);
            const panel = document.getElementById("ai-chat-panel");
            const toggle = document.getElementById("ai-chat-toggle");
            if (panel && panel.classList.contains("hidden") && toggle) toggle.click();
          }
          return;
        }
      }
      // Handle checkbox clicks
      if (e.target.classList.contains('select-checkbox')) {
        const fileId = e.target.dataset.fileId;
        if (e.target.checked) {
          this.selected.add(fileId);
        } else {
          this.selected.delete(fileId);
        }
        this._updateCardSelection(fileId);
        this._updateBulkToolbar();
      }
    });
  }

  _syncCheckboxes() {
    this.container.querySelectorAll('.select-checkbox').forEach(cb => {
      const id = cb.dataset.fileId;
      cb.checked = this.selected.has(id);
    });
    this.container.querySelectorAll('.file-card').forEach(card => {
      const id = card.dataset.fileId;
      card.classList.toggle('selected', this.selected.has(id));
    });
  }

  _updateCardSelection(fileId) {
    const card = this.container.querySelector(`.file-card[data-file-id="${fileId}"]`);
    if (card) {
      card.classList.toggle('selected', this.selected.has(fileId));
    }
  }

  _updateBulkToolbar() {
    if (this.selected.size > 0) {
      if (!this._bulkToolbar) {
        this._bulkToolbar = document.createElement("div");
        this._bulkToolbar.className = "bulk-toolbar";
        this._bulkToolbar.innerHTML = `
          <span class="selected-count"></span>
          <button class="btn btn-primary btn-sm" id="download-zip-btn">Download ZIP</button>
          <button class="btn btn-secondary btn-sm" id="deselect-all-btn">Deselect All</button>
        `;
        document.body.appendChild(this._bulkToolbar);
        document.getElementById("download-zip-btn").addEventListener("click", () => this._downloadSelectedZip());
        document.getElementById("deselect-all-btn").addEventListener("click", () => {
          this.selected.clear();
          this._syncCheckboxes();
          this._updateBulkToolbar();
        });
      }
      this._bulkToolbar.querySelector(".selected-count").textContent = `${this.selected.size} selected`;
      this._bulkToolbar.style.display = "flex";
    } else if (this._bulkToolbar) {
      this._bulkToolbar.style.display = "none";
    }
  }

  async _downloadSelectedZip() {
    const ids = Array.from(this.selected);
    try {
      await downloadFilesAsZip(ids);
      showToast("ZIP download started", "success");
    } catch (err) {
      showToast("Failed to create ZIP: " + err.message, "error");
    }
  }
}
// end of RCA/frontend/src/components/ddm/file-list.js