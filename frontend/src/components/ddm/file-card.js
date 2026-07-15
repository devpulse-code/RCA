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
    const ext = (file.name || '').split('.').pop().toLowerCase();
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
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'fa-solid fa-play';
    if (['xls', 'xlsx'].includes(ext)) return 'fa-regular fa-file-excel';
    return 'fa-regular fa-file';
};

export function fileCard(file, viewMode = 'grid') {
    const type = getFileType(file);
    const ext = (file.name || '').split('.').pop().toUpperCase();
    const size = formatFileSize(file.size);
    const date = formatDate(file.created_at);
    const badgeColor = getFileBadgeColor(file);
    const icon = getFileIcon(file);
    const fileId = file.id || '';
    const isImage = type === 'Image';
    const isVideo = type === 'Video';
    const thumbnailUrl = isImage ? `/api/ddm/files/${fileId}/download?inline=true` : null;
    const videoUrl = isVideo ? `/api/ddm/files/${fileId}/download?inline=true` : null;

    if (viewMode === 'list') {
        // Horizontal list row
        const bgStyle = thumbnailUrl
            ? `background-image: url('${thumbnailUrl}'); background-size: cover; background-position: center;`
            : `background-color: ${badgeColor}22;`;
        const innerIcon = !thumbnailUrl ? `<i class="${icon}" style="font-size:20px; color:${badgeColor}"></i>` : '';
        const videoTag = videoUrl ? `<video muted loop preload="none" src="${videoUrl}" style="display:none;"></video>` : '';
        return `
            <div class="file-list-row" data-file-id="${fileId}">
                <div class="file-list-thumb" style="${bgStyle}">
                    ${innerIcon}
                    ${isVideo ? `<div class="play-overlay"><i class="fa-solid fa-play"></i></div>` : ''}
                    ${videoTag}
                </div>
                <div class="file-list-info">
                    <div class="file-list-name" title="${file.name || ''}">${file.name || ''}</div>
                    <div class="file-list-meta">${type} - ${size} · ${date}</div>
                </div>
                <div class="file-list-actions">
                    <button class="action-preview" data-file-id="${fileId}" title="Preview"><i class="fa-solid fa-eye"></i></button>
                    <button class="action-download" data-file-id="${fileId}" title="Download"><i class="fa-solid fa-download"></i></button>
                    <button class="action-ai" data-file-id="${fileId}" title="Ask AI"><i class="fa-solid fa-robot"></i></button>
                </div>
            </div>
        `;
    }

    // Default grid card
    const backgroundStyle = thumbnailUrl
        ? `background-image: url('${thumbnailUrl}'); background-size: cover; background-position: center;`
        : `background-color: ${badgeColor}22;`;

    const fileImageClass = thumbnailUrl ? 'file-image' : 'file-image file-image-placeholder';

    const playOverlay = isVideo ? `<div class="play-overlay"><i class="fa-solid fa-play"></i></div>` : '';
    const bigIcon = !thumbnailUrl ? `<div class="file-type-icon"><i class="${icon}"></i></div>` : '';
    const videoElement = videoUrl
        ? `<video muted loop preload="none" src="${videoUrl}"></video>`
        : '';

    return `
        <div class="file-card" data-file-id="${fileId}">
            <div class="${fileImageClass}" style="${backgroundStyle}">
                ${playOverlay}
                ${bigIcon}
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
                    <button class="kebab-menu" data-file-id="${fileId}"><i class="fa-solid fa-ellipsis"></i></button>
                    <div class="file-actions-dropdown" data-file-id="${fileId}">
                        <button class="action-preview">Preview</button>
                        <button class="action-download">Download</button>
                        <button class="action-ai">Ask AI</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
// end of RCA/frontend/src/components/ddm/file-card.js