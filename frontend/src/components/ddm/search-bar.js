// RCA/frontend/src/components/ddm/search-bar.js
import { searchService } from "../../services/ddm/search-service.js";
import { sessionStore } from "../../stores/session-store.js";
import { showToast } from "../ui/toast.js";

export default class SearchBar {
  constructor(containerId, onResults) {
    this.container = document.getElementById(containerId);
    this.onResults = onResults;
    this.render();
    this.attachEvents();
    
    // Listen for auto-search triggers (popular tags)
    document.addEventListener('auto-search', (e) => {
        if(this.searchInput) {
            this.searchInput.value = e.detail.query;
            this.search();
        }
    });
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="search-wrapper">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="search-input" placeholder="Search files by name, type, or keyword...">
        <button id="search-button"><i class="fa-solid fa-magnifying-glass"></i> Search</button>
      </div>
    `;
  }

  attachEvents() {
    this.searchInput = document.getElementById("search-input");
    this.searchBtn = document.getElementById("search-button");

    if(this.searchBtn) {
        this.searchBtn.addEventListener("click", () => this.search());
    }
    if(this.searchInput) {
        this.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.search();
        });
    }
  }

  async search(page = 1) {
    const query = this.searchInput.value.trim();
    if (!query) return;
    try {
      const data = await searchService.search(query, sessionStore.contentSearchEnabled, page, 20);
      // The service returns the full response object { results, total, ... }
      this.onResults(data);
    } catch (err) {
      showToast("Search failed", "error");
    }
  }

  setPage(page) {
    this.search(page);
  }
}
// end of RCA/frontend/src/components/ddm/search-bar.js