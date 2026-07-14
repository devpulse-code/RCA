// RCA/frontend/src/components/ddm/file-card.js
import { getFileTypeCategory, getFileIcon, getThumbnailUrl } from "../../utils/formatters.js";

export function fileCard(file) {
  const groups = Array.isArray(file.groups) ? file.groups : [];
  const type = getFileTypeCategory(file);
  const thumbnail = getThumbnailUrl(file);
  const icon = getFileIcon(file);

  let mediaBlock = '';
  if (type === 'image' && thumbnail) {
    mediaBlock = `
      <div class="thumbnail">
        <img src="${thumbnail}" alt="${file.name}" loading="lazy" />
      </div>`;
  } else if (type === 'video') {
    mediaBlock = `
      <div class="video-thumb-wrapper">
        <video muted loop preload="metadata" src="${thumbnail}">
          Your browser does not support the video tag.
        </video>
        <div class="play-overlay">▶</div>
      </div>`;
  } else {
    mediaBlock = `
      <div class="thumbnail file-icon">
        <span>${icon}</span>
      </div>`;
  }

  return `
    <div class="file-card bg-[var(--bg-secondary)] rounded shadow overflow-hidden" data-file-id="${file.id}">
      ${mediaBlock}
      <div class="p-3">
        <h3 class="font-semibold text-[var(--text-primary)] truncate" title="${file.name}">${file.name}</h3>
        <p class="text-sm text-[var(--text-secondary)] truncate">${file.description || ''}</p>
        <span class="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 rounded mt-1 inline-block">${groups.join(', ')}</span>
        <div class="mt-2 flex flex-wrap gap-1">
          <a href="/api/ddm/files/${file.id}/download" class="btn btn-primary btn-sm">Download</a>
          <button class="btn btn-secondary btn-sm btn-preview" data-file-id="${file.id}">Preview</button>
          <button class="btn btn-secondary btn-sm btn-ask-ai" data-file-id="${file.id}">Ask AI</button>
        </div>
      </div>
    </div>
  `;
}
// end of RCA/frontend/src/components/ddm/file-card.js