// RCA/frontend/src/components/ddm/upload-form.js
import * as FileService from "../../services/ddm/file-service.js";
import { showToast } from "../ui/toast.js";

export class UploadForm {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="upload-card" id="drop-upload-zone">
        <div class="upload-icon">
            <i class="fa-solid fa-cloud-arrow-up"></i>
        </div>
        <h3>Upload New File</h3>
        <p>Drag & drop your file here <br> or</p>
        <button class="choose-file-btn" id="choose-file-btn">
            <i class="fa-solid fa-cloud-arrow-up"></i> Choose File
        </button>
        <span class="file-size-info">Max file size: 250MB</span>
        <input type="file" id="file-upload-input" style="display: none;">
      </div>
    `;
    this.attachEvents();
  }

  attachEvents() {
    const dropZone = document.getElementById("drop-upload-zone");
    const fileInput = document.getElementById("file-upload-input");
    const chooseBtn = document.getElementById("choose-file-btn");

    chooseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Clicking the whole zone
    dropZone.addEventListener("click", () => fileInput.click());

    // Drag and drop events
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        if (e.dataTransfer.files.length > 0) {
            this.handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            this.handleFile(e.target.files[0]);
        }
    });
  }

  async handleFile(file) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("description", "");
        formData.append("group_ids", "");

        await FileService.uploadFileWithProgress(formData, (percent) => {
            // Optional: could show a progress bar within the card if desired
            // For now, just a toast notification
            if(percent === 100) {
                showToast("Upload complete! Please wait for admin approval.", "success");
                document.dispatchEvent(new Event('refresh-files'));
            }
        });
    } catch (err) {
        showToast("Upload failed: " + (err.message || "unknown"), "error");
    }
  }
}
// end of RCA/frontend/src/components/ddm/upload-form.js