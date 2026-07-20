// RCA/frontend/src/components/ddm/file-card.js

const getFileBadgeColor = (file) => {
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return '#22c55e';
    if (['pdf'].includes(ext)) return '#ef4444';
    if (['pptx', 'ppt'].includes(ext)) return '#f59e0b';
    if (['doc', 'docx'].includes(ext)) return '#2563eb';
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return '#6b7280';
    if (['xls', 'xlsx'].includes(ext)) return '#10b981';
    return '#6b7280';
};

const getFileType = (file) => {
    const mime = (file.mime_type || '').toLowerCase();
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (mime.startsWith('image/')) return 'Image';
    if (mime.startsWith('video/')) return 'Video';
    if (mime === 'application/pdf') return 'Document';
    if (mime.includes('word') || mime.includes('document')) return 'Document';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return 'Spreadsheet';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'Presentation';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'Image';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'Document';
    if (['pptx', 'ppt'].includes(ext)) return 'Presentation';
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'Video';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Spreadsheet';
    if (['mp3', 'wav', 'flac'].includes(ext)) return 'Audio';
    return 'File';
};

const formatFileSize = (bytes) => {
    if (bytes == null || bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(',', '');
};

const getFileIcon = (file) => {
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'fa-regular fa-image';
    if (['pdf'].includes(ext)) return 'fa-regular fa-file-pdf';
    if (['pptx', 'ppt'].includes(ext)) return 'fa-regular fa-file-powerpoint';
    if (['doc', 'docx'].includes(ext)) return 'fa-regular fa-file-word';
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'fa-solid fa-video';
    if (['xls', 'xlsx'].includes(ext)) return 'fa-regular fa-file-excel';
    if (['mp3', 'wav', 'flac'].includes(ext)) return 'fa-solid fa-music';
    return 'fa-regular fa-file';
};

export function fileCard(file, viewMode = 'grid', selectedFileIds = new Set(), selectMode = false) {
    const type = getFileType(file);
    const ext = (file.name || '').split('.').pop().toUpperCase();
    const size = formatFileSize(file.size);
    const date = formatDate(file.created_at);
    const badgeColor = getFileBadgeColor(file);
    const icon = getFileIcon(file);
    const fileId = String(file.id ?? '');
    const isImage = type === 'Image';
    const isVideo = type === 'Video';
    const hasThumbnail = isImage || (isVideo && file.has_thumbnail);
    const hasPreviewClip = isVideo && file.has_preview_clip;

    // Thumbnail URL: always use dedicated endpoint if possible
    const thumbnailUrl = hasThumbnail ? `/api/ddm/files/${fileId}/thumbnail` : null;
    // Preview clip URL: use dedicated endpoint, fallback to full file for hover
    const previewClipUrl = hasPreviewClip ? `/api/ddm/files/${fileId}/preview-clip` : null;
    const fullVideoUrl = isVideo ? `/api/ddm/files/${fileId}/download?inline=true` : null;
    // For video hover, we try preview clip first, then full video
    const videoSrcForHover = previewClipUrl || fullVideoUrl;

    const isSelected = selectedFileIds.has(fileId);
    const selectClass = selectMode ? ' select-mode' : '';
    const selectedClass = selectMode && isSelected ? ' selected' : '';

    if (viewMode === 'list') {
        // ── List row with <img> thumbnail ──
        let imgHtml = '';
        if (thumbnailUrl) {
            imgHtml = `<img src="${thumbnailUrl}" alt="${file.name}" class="file-list-thumb-img" loading="lazy" onerror="this.style.display='none'; this.parentElement.querySelector('.file-list-icon-circle').style.display='flex';" />`;
        }

        const iconCircleStyle = thumbnailUrl
            ? 'display:none;'
            : `background-color: ${badgeColor}18; color: ${badgeColor};`;

        return `
            <div class="file-list-row${selectClass}${selectedClass}" data-file-id="${fileId}">
                <div class="file-list-thumb">
                    ${imgHtml}
                    <div class="file-list-icon-circle" style="${iconCircleStyle}">
                        <i class="${icon}" aria-hidden="true"></i>
                    </div>
                    ${isVideo ? `<div class="play-overlay-list"><i class="fa-solid fa-play"></i></div>` : ''}
                    ${isVideo ? `<video muted loop preload="none" src="${videoSrcForHover}" style="display:none;"></video>` : ''}
                </div>
                <div class="file-list-info">
                    <div class="file-list-name" title="${file.name || ''}">${file.name || ''}</div>
                    <div class="file-list-meta">
                        <span class="file-list-type-badge" style="background: ${badgeColor}18; color: ${badgeColor};">
                            ${type}
                        </span>
                        <span>${size}</span>
                        <span class="file-list-date">${date}</span>
                    </div>
                </div>
                <div class="file-list-actions">
                    <button class="file-list-action-btn action-preview" data-file-id="${fileId}" title="Preview" aria-label="Preview">
                        <i class="fa-solid fa-eye" aria-hidden="true"></i>
                    </button>
                    <button class="file-list-action-btn action-download" data-file-id="${fileId}" title="Download" aria-label="Download">
                        <i class="fa-solid fa-download" aria-hidden="true"></i>
                    </button>
                    <button class="file-list-action-btn action-ai" data-file-id="${fileId}" title="Ask AI" aria-label="Ask AI about this file">
                        <i class="fa-solid fa-robot" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // ── Grid Card with <img> thumbnail ──
    let imgElement = '';
    if (thumbnailUrl) {
        imgElement = `<img src="${thumbnailUrl}" alt="${file.name}" class="file-grid-thumb-img" loading="lazy" onerror="this.style.display='none'; this.parentElement.querySelector('.file-type-icon').style.display='flex';" />`;
    }

    const iconElement = !thumbnailUrl
        ? `<div class="file-type-icon"><i class="${icon}"></i></div>`
        : `<div class="file-type-icon" style="display:none;"><i class="${icon}"></i></div>`;

    const playOverlay = isVideo ? `<div class="play-overlay"><i class="fa-solid fa-play"></i></div>` : '';
    const videoElement = isVideo
        ? `<video muted loop preload="none" src="${videoSrcForHover}"></video>`
        : '';

    const bgColor = `background-color: ${badgeColor}22;`;

    return `
        <div class="file-card${selectClass}${selectedClass}" data-file-id="${fileId}">
            <div class="file-image" style="${bgColor}">
                ${imgElement}
                ${iconElement}
                ${playOverlay}
                ${videoElement}
                <span class="file-type-badge" style="background: ${badgeColor};"><i class="${icon}"></i> ${ext}</span>
            </div>
            <div class="file-info">
                <div class="file-title" title="${file.name || ''}">${file.name || ''}</div>
                <div class="file-meta">
                    <div class="file-meta-left">
                        <span>${type} - ${size}</span>
                        <span style="color:var(--text-muted);">${date}</span>
                    </div>
                    <button class="kebab-menu" data-file-id="${fileId}" aria-label="More actions"><i class="fa-solid fa-ellipsis"></i></button>
                    <div class="file-actions-dropdown" data-file-id="${fileId}">
                        <button class="action-preview" data-file-id="${fileId}">Preview</button>
                        <button class="action-download" data-file-id="${fileId}">Download</button>
                        <button class="action-ai" data-file-id="${fileId}">Ask AI</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
// end of RCA/frontend/src/components/ddm/file-card.js