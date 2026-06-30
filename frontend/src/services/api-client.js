// D:\Development\Website\rca-platform\frontend\src\services\api-client.js
// Minimal fetch wrapper
const API_BASE = '/api';

export async function apiGet(endpoint, params = {}) {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

export async function apiPost(endpoint, data) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

export async function apiUpload(endpoint, formData) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

// end of D:\Development\Website\rca-platform\frontend\src\services\api-client.js