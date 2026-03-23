const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const rawUploadsBaseUrl = import.meta.env.VITE_UPLOADS_BASE_URL?.trim();

export const API_BASE_URL = rawApiBaseUrl
    ? trimTrailingSlash(rawApiBaseUrl)
    : '/api';

export const UPLOADS_BASE_URL = rawUploadsBaseUrl
    ? trimTrailingSlash(rawUploadsBaseUrl)
    : API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL.slice(0, -4)}/uploads`
        : `${API_BASE_URL}/uploads`;

export function getUploadUrl(filename) {
    if (!filename) {
        return '#';
    }

    return `${UPLOADS_BASE_URL}/${String(filename).replace(/^\/+/, '')}`;
}
