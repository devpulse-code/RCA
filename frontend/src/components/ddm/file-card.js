// RCA/frontend/src/components/ddm/file-card.js
// Helper functions to format data exactly like the design
const getFileBadgeColor = (file) => {
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return '#22c55e'; // green
    if (['pdf'].includes(ext)) return '#ef4444'; // red
    if (['pptx', 'ppt'].includes(ext)) return '#f59e0b'; // orange
    if (['doc', 'docx'].includes(ext)) return '#2563eb'; // blue
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return '#6b7280'; // grey
    if (['xls', 'xlsx'].includes(ext)) return '#10b981'; // teal
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
    if (bytes === 0) return '0 B';
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

export function fileCard(file) {
    const type = getFileType(file);
    const ext = (file.name || '').split('.').pop().toUpperCase();
    const size = formatFileSize(file.size);
    const date = formatDate(file.created_at);
    const badgeColor = getFileBadgeColor(file);
    const icon = getFileIcon(file);
    // thumbnailUrl should come from the file object, or fallback to generic placeholder
    const thumbnailUrl = file.thumbnail || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80`;
    
    const playOverlay = type === 'Video' 
        ? `<div class="play-overlay"><i class="fa-solid fa-play"></i></div>` 
        : '';

    return `
        <div class="file-card" data-file-id="${file.id}">
            <div class="file-image" style="background-image: url('${thumbnailUrl}');">
                ${playOverlay}
                <span class="file-type-badge" style="background: ${badgeColor};"><i class="${icon}"></i> ${ext}</span>
            </div>
            <div class="file-info">
                <div class="file-title" title="${file.name}">${file.name}</div>
                <div class="file-meta">
                    <div class="file-meta-left">
                        <span>${type} - ${size}</span>
                        <span style="color:#94a3b8;">${date}</span>
                    </div>
                    <button class="kebab-menu" data-file-id="${file.id}"><i class="fa-solid fa-ellipsis"></i></button>
                    <div class="file-actions-dropdown" data-file-id="${file.id}">
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