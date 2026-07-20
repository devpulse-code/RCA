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
    // Use inline=true so the browser renders the content instead of forcing a download
    const previewUrl = `/api/ddm/files/${file.id}/download?inline=true`;

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
          ${this._renderContent(file, previewUrl)}
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

  _renderContent(file, previewUrl) {
    const mimeType = (file.mime_type || '').toLowerCase();
    const ext = (file.name || '').split('.').pop().toLowerCase();

    // --- Image preview ---
    if (mimeType.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) {
      return `<img src="${previewUrl}" alt="${file.name}" class="preview-image" />`;
    }

    // --- Video preview ---
    if (mimeType.startsWith('video/') || ['mp4','webm','mov','avi','ogg'].includes(ext)) {
      return `<video controls autoplay class="preview-video"><source src="${previewUrl}" type="${mimeType || 'video/mp4'}"></video>`;
    }

    // --- PDF preview ---
    if (mimeType === 'application/pdf' || ext === 'pdf') {
      return `<iframe src="${previewUrl}#view=FitH" class="preview-iframe" width="100%" height="100%"></iframe>`;
    }

    // Fallback for any other image type (just in case)
    if (mimeType.startsWith('image/')) {
      return `<img src="${previewUrl}" alt="${file.name}" class="preview-image" />`;
    }

    // --- Unsupported type: show placeholder with download link ---
    return `
      <div class="file-preview-placeholder">
        <div class="preview-placeholder-icon">
          <i class="fa-regular fa-file" aria-hidden="true"></i>
        </div>
        <h3>No Preview Available</h3>
        <p>This file type cannot be previewed in the browser.</p>
        <a href="${previewUrl}" class="preview-download-btn preview-download-btn--large" download>
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