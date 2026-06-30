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
      this.files = await FileService.fetchUserFiles();
      this.render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = this.files.length
      ? `<div class="space-y-4">${this.files.map(fileCard).join('')}</div>`
      : `<p class="text-gray-500">No files available.</p>`;
  }
}
// end of RCA/frontend/src/components/ddm/file-list.js