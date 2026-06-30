// RCA/frontend/src/components/ddm/file-card.js
export function fileCard(file) {
  return `
    <div class="bg-white p-4 rounded shadow flex justify-between items-center">
      <div>
        <h3 class="font-semibold">${file.name}</h3>
        <p class="text-sm text-gray-600">${file.description || ''}</p>
        <span class="text-xs bg-gray-200 px-2 py-1 rounded">${file.groups.join(', ')}</span>
      </div>
      <a href="/api/files/${file.id}/download" class="text-blue-600 hover:underline">Download</a>
    </div>
  `;
}
// end of RCA/frontend/src/components/ddm/file-card.js