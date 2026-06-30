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
      <form id="upload-request-form" class="space-y-4 p-4 bg-white rounded shadow">
        <h3 class="font-semibold">Upload a file (request admin approval)</h3>
        <input type="text" name="name" placeholder="File name" required class="w-full border p-2">
        <textarea name="description" placeholder="Description" class="w-full border p-2"></textarea>
        <select name="groups" multiple class="w-full border p-2">
          <!-- groups will be populated dynamically if needed -->
        </select>
        <input type="file" name="file" required class="w-full">
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Submit Request</button>
      </form>
    `;
    this.form = document.getElementById("upload-request-form");
    this.form.addEventListener("submit", this.handleSubmit.bind(this));
  }

  async handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(this.form);
    const groups = Array.from(this.form.querySelector("[name='groups']").selectedOptions).map(o => o.value);
    form.set("group_ids", groups.join(","));
    try {
      await FileService.submitUploadRequest(form);
      showToast("Upload request submitted", "success");
      this.form.reset();
    } catch (err) {
      showToast(err.response?.data?.detail || err.message, "error");
    }
  }
}
// end of RCA/frontend/src/components/ddm/upload-form.js