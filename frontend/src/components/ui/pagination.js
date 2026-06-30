// RCA/frontend/src/components/ui/pagination.js
export default class Pagination {
  /**
   * @param {string} containerId
   * @param {Object} state - { page, total_pages, total }
   * @param {Function} onPageChange - callback(page)
   */
  constructor(containerId, state, onPageChange) {
    this.container = document.getElementById(containerId);
    this.onPageChange = onPageChange;
    this.render(state);
  }

  render(state) {
    if (!this.container) return;
    if (state.total_pages <= 1) {
      this.container.innerHTML = "";
      return;
    }
    const { page, total_pages, total } = state;
    let html = `<div class="flex items-center space-x-2 mt-4 text-sm text-gray-600">`;
    html += `<span>${total} result(s)</span>`;
    html += `<button class="px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}" ${page <= 1 ? 'disabled' : ''} data-page="${page-1}">Previous</button>`;
    html += `<span>Page ${page} of ${total_pages}</span>`;
    html += `<button class="px-3 py-1 border rounded ${page >= total_pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}" ${page >= total_pages ? 'disabled' : ''} data-page="${page+1}">Next</button>`;
    html += `</div>`;

    this.container.innerHTML = html;

    // Attach events
    this.container.querySelectorAll("button[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        const newPage = parseInt(btn.dataset.page);
        if (newPage >= 1 && newPage <= total_pages) {
          this.onPageChange(newPage);
        }
      });
    });
  }

  update(state) {
    this.render(state);
  }
}
// end of RCA/frontend/src/components/ui/pagination.js