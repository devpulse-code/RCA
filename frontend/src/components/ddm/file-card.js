// RCA/frontend/src/components/ddm/file-card.js
export function fileCard(file) {
  const groups = Array.isArray(file.groups) ? file.groups : [];
  return `
    <div class="bg-gray-900 p-4 rounded shadow flex justify-between items-center">
      <div>
        <h3 class="font-semibold text-gray-200">${file.name}</h3>
        <p class="text-sm text-gray-400">${file.description || ''}</p>
        <span class="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">${groups.join(', ')}</span>
      </div>
      <a href="/api/ddm/files/${file.id}/download" class="text-blue-400 hover:underline">Download</a>
    </div>
  `;
}
// end of RCA/frontend/src/components/ddm/file-card.js