// RCA/frontend/src/utils/formatters.js
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

/**
 * Return the category of a file based on extension.
 */
export function getFileTypeCategory(file) {
    const name = file.name || '';
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac'].includes(ext)) return 'audio';
    return 'other';
}

/**
 * Return a thumbnail URL for the file (using download endpoint for images/videos, else null).
 */
export function getThumbnailUrl(file) {
    if (!file || !file.id) return null;
    const category = getFileTypeCategory(file);
    if (category === 'image' || category === 'video') {
        return `/api/ddm/files/${file.id}/download`;
    }
    return null;
}

/**
 * Return an emoji icon for the file type.
 */
export function getFileIcon(file) {
    const category = getFileTypeCategory(file);
    switch (category) {
        case 'image': return '🖼️';
        case 'document': return '📄';
        case 'spreadsheet': return '📊';
        case 'video': return '🎬';
        case 'audio': return '🎵';
        default: return '📁';
    }
}
// end of RCA/frontend/src/utils/formatters.js