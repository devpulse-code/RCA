// D:\Development\Website\rca-platform\frontend\src\utils\formatters.js
// Formatting utilities (placeholder)
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

// end of D:\Development\Website\rca-platform\frontend\src\utils\formatters.js