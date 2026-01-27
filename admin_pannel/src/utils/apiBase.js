export function getApiBase() {
  // In development, use configured backend or localhost:8282
  if (import.meta.env && import.meta.env.DEV) {
    return 'http://localhost:8282/api';
  }
  const backend = import.meta.env.VITE_BACKEND_SERVER || import.meta.env.VITE_APP_BASE_URL || '';
  if (!backend) {
    // Safe fallback in production: use deployed backend
    if (import.meta.env && import.meta.env.PROD) return 'https://stingray-app-p5rsq.ondigitalocean.app/api';
    return '/api';
  }
  const base = backend.replace(/\/$/, '');
  // ensure the '/api' prefix is present for backend routes
  return base.replace(/\/?api\/?$/i, '').replace(/\/$/, '') + '/api';
}

export default getApiBase;
