import { apiUrl } from "./api";

// Small helper to refresh access token from backend
export async function refreshAccessToken() {
  const res = await fetch(apiUrl('/clients/refresh'), {
    method: 'POST', 
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to refresh token');
  const data = await res.json();
  if (!data.ok || !data.token) throw new Error('Refresh failed');
  // Token is set in HTTP-only cookie by the server; no need to store in localStorage
  return data.token;
}
