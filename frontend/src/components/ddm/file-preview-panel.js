// RCA/frontend/src/components/ddm/file-preview-panel.js
import { showToast } from "../ui/toast.js";

export default class FilePreviewPanel {
  constructor() {
    this.overlay = null;
  }

  open(file) {
    if (!file) return;
    this.close();

    this.overlay = document.createElement("div");
    this.overlay.className = "file-preview-overlay";
    this.overlay.innerHTML = `
      <div class="file-preview-panel">
        <div class="file-preview-header">
          <span class="font-semibold text-sm">${file.name}</span>
          <div>
            <a href="/api/ddm/files/${file.id}/download" class="btn btn-primary btn-sm mr-2">Download</a>
            <button class="btn btn-secondary btn-sm close-preview">✕</button>
          </div>
        </div>
        <div class="file-preview-content">
          ${this._renderContent(file)}
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.querySelector(".close-preview").addEventListener("click", () => this.close());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.addEventListener("keydown", this._escHandler);
  }

  _renderContent(file) {
    const url = `/api/ddm/files/${file.id}/download`;
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return `<img src="${url}" alt="${file.name}" />`;
    }
    if (['mp4', 'webm', 'ogg'].includes(ext)) {
      return `<video controls autoplay style="max-width:100%;max-height:100%"><source src="${url}" type="video/${ext}"></video>`;
    }
    if (ext === 'pdf') {
      return `<iframe src="${url}#view=FitH" width="100%" height="100%"></iframe>`;
    }
    // For other types, show placeholder
    return `
      <div class="file-preview-placeholder">
        <p>No preview available for this file type.</p>
        <a href="${url}" class="btn btn-primary">Download</a>
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