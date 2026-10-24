/**
 * Resolves and normalizes the backend API base URL.
 * Handles:
 *  - Accidentally setting health check URL: 'https://finance-000.onrender.com/api/health' -> 'https://finance-000.onrender.com/api'
 *  - Trailing slashes: 'https://finance-000.onrender.com/' -> 'https://finance-000.onrender.com/api'
 *  - Missing /api: 'https://finance-000.onrender.com' -> 'https://finance-000.onrender.com/api'
 *  - Already has /api: 'https://finance-000.onrender.com/api/' -> 'https://finance-000.onrender.com/api'
 *  - Localhost default fallback: 'http://localhost:5000/api'
 *  - Same-origin production fallback when VITE_API_URL is unset
 */
const getNormalizedApiBase = () => {
  let envUrl = (import.meta.env.VITE_API_URL || '').trim();

  if (envUrl) {
    // Strip trailing slashes
    let cleaned = envUrl.replace(/\/+$/, '');

    // Strip accidental endpoints user may have copied into VITE_API_URL
    cleaned = cleaned
      .replace(/\/api\/health$/, '')
      .replace(/\/health$/, '')
      .replace(/\/api\/auth\/.*$/, '')
      .replace(/\/auth\/.*$/, '')
      .replace(/\/api\/dashboard.*$/, '')
      .replace(/\/dashboard.*$/, '')
      .replace(/\/+$/, '');

    // If it already ends with /api, keep it; otherwise append /api
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  // In browser: if not running on localhost (e.g. deployed on Render / Vercel),
  // fallback to the current origin + /api so relative deployments work out of the box
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return `${window.location.origin}/api`;
    }
  }

  return 'http://localhost:5000/api';
};

export const API_BASE = getNormalizedApiBase();

/**
 * Builds a clean, normalized API endpoint URL without double slashes.
 * e.g. apiEndpoint('/auth/login') -> 'https://finance-000.onrender.com/api/auth/login'
 */
export function apiEndpoint(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Avoid double slashes while preserving protocol http:// or https://
  return `${API_BASE}${cleanPath}`.replace(/([^:])\/\/+/g, '$1/');
}

/**
 * Safe fetch wrapper that handles non-JSON (like HTML 404 / 502) gracefully,
 * preventing "Unexpected token '<', '<!DOCTYPE '... is not valid JSON" crashes.
 */
export async function safeFetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      console.warn(`[API] JSON parse warning for ${url}:`, parseErr);
    }
  } else {
    // Received non-JSON (likely HTML 404 or Render error page)
    const rawText = await response.text();
    console.warn(`[API] Non-JSON response (${response.status}) from ${url}:`, rawText.slice(0, 150));
    data = {
      message: response.status === 404
        ? `API endpoint not found (404) at ${url}. Please verify backend route.`
        : response.status >= 500
        ? `Server error (${response.status}). Please check backend service.`
        : `Unexpected server response (${response.status})`
    };
  }

  return { response, data, ok: response.ok, status: response.status };
}
