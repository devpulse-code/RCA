// RCA/frontend/src/components/ddm/file-list.js
import * as FileService from "../../services/ddm/file-service.js";
import { fileCard } from "./file-card.js";
import { showToast } from "../ui/toast.js";

export class FileList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.load();
  }

  async load() {
    try {
      const raw = await FileService.fetchUserFiles();
      this.files = Array.isArray(raw) ? raw : [];
    } catch (e) {
      // Show a toast and also display an error in the file list area
      try {
        showToast(e.message || "Failed to load files", "error");
      } catch (_) {
        // toast container may be missing – ignore
      }
      this.files = null;   // signal error state
      console.error("File fetch error:", e);
    }
    this.render();
  }

  render() {
    if (!this.container) return;
    if (this.files === null) {
      // Error state
      this.container.innerHTML = `<p class="text-red-500">Could not load files. Please refresh or try again later.</p>`;
      return;
    }
    if (!Array.isArray(this.files)) {
      this.container.innerHTML = `<p class="text-gray-500">Unexpected data received.</p>`;
      return;
    }
    this.container.innerHTML = this.files.length
      ? `<div class="space-y-4">${this.files.map(fileCard).join('')}</div>`
      : `<p class="text-gray-500">No files available.</p>`;
  }
}
// end of RCA/frontend/src/components/ddm/file-list.js