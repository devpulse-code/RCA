// RCA/frontend/src/components/ddm/search-bar.js
import { searchService } from "../../services/ddm/search-service.js";
import { sessionStore } from "../../stores/session-store.js";
import { showToast } from "../ui/toast.js";

export default class SearchBar {
  constructor(containerId, onResults) {
    this.container = document.getElementById(containerId);
    this.onResults = onResults;
    this.currentPage = 1;
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="flex items-center space-x-2 mb-4">
        <input type="text" id="search-input" placeholder="Search files..." class="flex-1 border p-2 rounded bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)]">
        <label class="flex items-center space-x-1 text-sm text-[var(--text-secondary)]">
          <input type="checkbox" id="content-toggle" ${sessionStore.contentSearchEnabled ? 'checked' : ''}>
          <span>Search in file contents</span>
        </label>
        <button id="search-button" class="btn btn-primary">Search</button>
      </div>
      <div id="search-error" class="text-red-500 text-sm hidden"></div>
    `;

    this.searchInput = document.getElementById("search-input");
    this.contentToggle = document.getElementById("content-toggle");
    this.searchBtn = document.getElementById("search-button");
    this.errorDiv = document.getElementById("search-error");

    this.contentToggle.addEventListener("change", () => {
      sessionStore.contentSearchEnabled = this.contentToggle.checked;
    });

    this.searchBtn.addEventListener("click", () => this.search());
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.search();
    });
  }

  async search(page = 1) {
    const query = this.searchInput.value.trim();
    if (!query) return;
    this.currentPage = page;
    const content = this.contentToggle.checked;
    try {
      const data = await searchService.search(query, content, page);
      this.onResults(data);
    } catch (err) {
      showToast("Search failed", "error");
      this.errorDiv.textContent = err.message;
      this.errorDiv.classList.remove("hidden");
    }
  }

  setPage(page) {
    this.search(page);
  }
}
// end of RCA/frontend/src/components/ddm/search-bar.js