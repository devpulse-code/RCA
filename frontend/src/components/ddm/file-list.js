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
      // Ensure we always have an array, even if the API response is malformed
      this.files = Array.isArray(raw) ? raw : [];
      this.render();
    } catch (e) {
      showToast(e.message || "Failed to load files", "error");
    }
  }

  render() {
    if (!this.container) return;
    if (!Array.isArray(this.files)) {
      console.error("this.files is not an array:", this.files);
      this.container.innerHTML = '<p class="text-gray-500">Error loading files.</p>';
      return;
    }
    this.container.innerHTML = this.files.length
      ? `<div class="space-y-4">${this.files.map(fileCard).join('')}</div>`
      : `<p class="text-gray-500">No files available.</p>`;
  }
}
// end of RCA/frontend/src/components/ddm/file-list.js