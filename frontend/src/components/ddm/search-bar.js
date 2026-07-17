// RCA/frontend/src/components/ddm/search-bar.js
import { searchService } from "../../services/ddm/search-service.js";
import { uiStore } from "../../stores/ui-store.js";
import { showToast } from "../ui/toast.js";

export default class SearchBar {
  constructor(containerId, onResults) {
    this.container = document.getElementById(containerId);
    this.onResults = onResults;
    this.debounceTimer = null;
    this.render();
    this.attachEvents();

    document.addEventListener('auto-search', (e) => {
        if (this.searchInput) {
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
        <input type="text" id="search-input" placeholder="Search files by name, type, or keyword..." autocomplete="off">
      </div>
    `;
  }

  attachEvents() {
    this.searchInput = document.getElementById("search-input");
    if (!this.searchInput) return;

    this.searchInput.addEventListener("input", () => {
      const query = this.searchInput.value.trim();
      if (!query) {
        clearTimeout(this.debounceTimer);
        document.dispatchEvent(new CustomEvent('search-cleared'));
        return;
      }
      this.debounceSearch();
    });

    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        clearTimeout(this.debounceTimer);
        this.search();
      }
    });
  }

  debounceSearch() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.search(), 300);
  }

  async search(page = 1) {
    const query = this.searchInput.value.trim();
    if (!query) {
        document.dispatchEvent(new CustomEvent('search-cleared'));
        return;
    }
    try {
      const type = uiStore.typeFilter !== 'all' ? uiStore.typeFilter : '';
      const data = await searchService.search(query, false, page, 20, type);
      if (this.onResults) this.onResults(data);
    } catch (err) {
      showToast("Search failed", "error");
    }
  }

  setPage(page) {
    this.search(page);
  }

  getCurrentQuery() {
    return this.searchInput ? this.searchInput.value.trim() : '';
  }
}
// end of RCA/frontend/src/components/ddm/search-bar.js