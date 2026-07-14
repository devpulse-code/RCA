// RCA/frontend/src/components/ddm/search-bar.js
import { searchService } from "../../services/ddm/search-service.js";
import { sessionStore } from "../../stores/session-store.js";
import { showToast } from "../ui/toast.js";
import { uiStore } from "../../stores/ui-store.js";

export default class SearchBar {
  constructor(containerId, onResults) {
    this.container = document.getElementById(containerId);
    this.onResults = onResults;
    this.currentPage = 1;
    this.filters = {
      type: '', // file type filter
    };
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="search-bar flex flex-wrap items-center gap-2 mb-4">
        <input type="text" id="search-input" placeholder="Search files..." class="flex-1 min-w-[200px] border p-2 rounded bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)]">
        <select id="type-filter" class="border p-2 rounded bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)]">
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
          <option value="spreadsheet">Spreadsheets</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="other">Other</option>
        </select>
        <label class="flex items-center space-x-1 text-sm text-[var(--text-secondary)]">
          <input type="checkbox" id="content-toggle" ${sessionStore.contentSearchEnabled ? 'checked' : ''}>
          <span>Content</span>
        </label>
        <button id="search-button" class="btn btn-primary">Search</button>
        <button id="ai-help-btn" class="btn btn-secondary text-sm" title="Ask AI for help">✨ AI</button>
      </div>
      <div id="search-error" class="text-red-500 text-sm hidden"></div>
    `;

    this.searchInput = document.getElementById("search-input");
    this.typeFilter = document.getElementById("type-filter");
    this.contentToggle = document.getElementById("content-toggle");
    this.searchBtn = document.getElementById("search-button");
    this.aiHelpBtn = document.getElementById("ai-help-btn");
    this.errorDiv = document.getElementById("search-error");

    this.contentToggle.addEventListener("change", () => {
      sessionStore.contentSearchEnabled = this.contentToggle.checked;
    });

    this.searchBtn.addEventListener("click", () => this.search());
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.search();
    });

    this.typeFilter.addEventListener("change", () => {
      this.filters.type = this.typeFilter.value;
    });

    // AI Help: open chat with prefilled query
    this.aiHelpBtn.addEventListener("click", () => {
      const query = this.searchInput.value.trim();
      if (!query) {
        showToast("Please enter a search query first", "info");
        return;
      }
      // Try to open AI chat panel if exists
      const chatPanel = document.getElementById("ai-chat-panel");
      const toggleBtn = document.getElementById("ai-chat-toggle");
      if (chatPanel && chatPanel.classList.contains("hidden")) {
        toggleBtn.click(); // open panel
      }
      // Dispatch custom event to send message to AI chat
      document.dispatchEvent(new CustomEvent('ai-chat-message', { detail: { text: `Find files about: ${query}` } }));
    });
  }

  async search(page = 1) {
    const query = this.searchInput.value.trim();
    if (!query) return;
    this.currentPage = page;
    const content = this.contentToggle.checked;
    try {
      const data = await searchService.search(query, content, page, 20, this.filters.type);
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