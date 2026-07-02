// RCA/frontend/src/services/api-client.js
const API_BASE = '/api';

async function handleResponse(response) {
    if (!response.ok) {
        let errorMsg = `HTTP error ${response.status}`;
        try {
            const body = await response.json();
            errorMsg = body.detail || body.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
    }
    if (response.status === 204) return null;
    return response.json();
}

export async function apiGet(endpoint, params = {}) {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const response = await fetch(url, { credentials: 'include' });
    return handleResponse(response);
}

export async function apiPost(endpoint, data) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function apiPut(endpoint, data) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function apiPatch(endpoint, data) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function apiDelete(endpoint, data) {
    const options = {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return handleResponse(response);
}

export async function apiUpload(endpoint, formData) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });
    return handleResponse(response);
}

export const apiClient = {
    get: async (url, config = {}) => {
        const params = config.params || {};
        const fullUrl = new URL(`${API_BASE}${url}`, window.location.origin);
        Object.keys(params).forEach(key => fullUrl.searchParams.append(key, params[key]));
        const response = await fetch(fullUrl, { credentials: 'include' });
        return handleResponse(response);
    },
    post: async (url, data) => {
        const response = await fetch(`${API_BASE}${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    put: async (url, data) => {
        const response = await fetch(`${API_BASE}${url}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    patch: async (url, data) => {
        const response = await fetch(`${API_BASE}${url}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    delete: async (url, config = {}) => {
        const options = {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        };
        if (config.data) options.body = JSON.stringify(config.data);
        const response = await fetch(`${API_BASE}${url}`, options);
        return handleResponse(response);
    },
};
// end of RCA/frontend/src/services/api-client.js