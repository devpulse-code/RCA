// RCA/frontend/src/components/ddm/file-card.js
export function fileCard(file) {
  const groups = Array.isArray(file.groups) ? file.groups : [];
  return `
    <div class="bg-[var(--bg-secondary)] p-4 rounded shadow flex justify-between items-center">
      <div>
        <h3 class="font-semibold text-[var(--text-primary)]">${file.name}</h3>
        <p class="text-sm text-[var(--text-secondary)]">${file.description || ''}</p>
        <span class="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 rounded">${groups.join(', ')}</span>
      </div>
      <a href="/api/ddm/files/${file.id}/download" class="btn btn-primary btn-sm">Download</a>
    </div>
  `;
}
// end of RCA/frontend/src/components/ddm/file-card.js