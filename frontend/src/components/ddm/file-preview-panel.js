// RCA/frontend/src/components/ddm/file-preview-panel.js
import { showToast } from "../ui/toast.js";

export default class FilePreviewPanel {
  constructor() {
    this.overlay = null;
  }

  open(file) {
    if (!file) return;
    this.close();

    const downloadUrl = file.downloadUrl || `/api/ddm/files/${file.id}/download`;

    this.overlay = document.createElement("div");
    this.overlay.className = "file-preview-overlay";
    this.overlay.innerHTML = `
      <div class="file-preview-panel">
        <div class="file-preview-header">
          <div class="file-preview-header-left">
            <i class="fa-regular fa-file" aria-hidden="true"></i>
            <span class="file-preview-name">${file.name || 'Unknown File'}</span>
          </div>
          <div class="file-preview-header-actions">
            <a href="${downloadUrl}" class="preview-download-btn" download>
              <i class="fa-solid fa-download" aria-hidden="true"></i>
              Download
            </a>
            <button class="preview-close-btn" aria-label="Close preview">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="file-preview-content">
          ${this._renderContent(file, downloadUrl)}
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.querySelector(".preview-close-btn").addEventListener("click", () => this.close());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.addEventListener("keydown", this._escHandler);
  }

  _renderContent(file, url) {
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return `<img src="${url}" alt="${file.name}" class="preview-image" />`;
    }
    if (['mp4', 'webm', 'ogg'].includes(ext)) {
      return `<video controls autoplay class="preview-video"><source src="${url}" type="video/${ext}"></video>`;
    }
    if (ext === 'pdf') {
      return `<iframe src="${url}#view=FitH" class="preview-iframe" width="100%" height="100%"></iframe>`;
    }
    return `
      <div class="file-preview-placeholder">
        <div class="preview-placeholder-icon">
          <i class="fa-regular fa-file" aria-hidden="true"></i>
        </div>
        <h3>No Preview Available</h3>
        <p>This file type cannot be previewed in the browser.</p>
        <a href="${url}" class="preview-download-btn preview-download-btn--large" download>
          <i class="fa-solid fa-download" aria-hidden="true"></i>
          Download File
        </a>
      </div>
    `;
  }

  close() {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    document.removeEventListener("keydown", this._escHandler);
  }

  _escHandler = (e) => {
    if (e.key === "Escape") this.close();
  };
}
// end of RCA/frontend/src/components/ddm/file-preview-panel.js