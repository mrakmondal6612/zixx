
import { useEffect, useState } from "react";
import getApiBase from "@utils/apiBase";

export default function AdminRouteGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const apiBase = getApiBase();
  // Determine the frontend base URL (clean origin) for redirects to site login
  const frontendBase = (() => {
    let f = import.meta.env.VITE_FRONTEND_URL;
    if (!f || typeof f !== 'string' || !/^https?:\/\//i.test(f)) {
      f = 'https://zixx.in';
    }
    try { const u = new URL(f); return u.origin; } catch { return f; }
  })().replace(/\/$/, '');
  const mainLogin = `${frontendBase}/auth`;

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check for token in URL parameters (passed from main site)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
          try {
            // Save token and log masked token for debugging
            localStorage.setItem('token', urlToken);
            try {
              const masked = typeof urlToken === 'string' && urlToken.length > 10 ? `${urlToken.substring(0,6)}...${urlToken.substring(urlToken.length-4)}` : urlToken;
              // eslint-disable-next-line no-console
              console.debug('[AdminRouteGuard] token from URL:', masked);
            } catch {}
            // Clean URL by removing token parameter
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('token');
            window.history.replaceState({}, '', newUrl);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.debug('[AdminRouteGuard] failed to set token from URL', e && e.message);
          }
        }

        // helper to build auth headers from localStorage token
        const buildAuthHeaders = () => {
          const h = {};
          try {
            const t = localStorage.getItem('token');
            if (t) h['Authorization'] = `Bearer ${t}`;
          } catch {}
          return h;
        };
        // 1) Try to fetch current user using cookie-based auth plus Bearer if available
        let res = await fetch(`${apiBase}/clients/user/me`, {
          credentials: 'include',
          headers: buildAuthHeaders(),
        });
        // Debug: log response status and body (dev only)
        try {
          // eslint-disable-next-line no-console
          console.debug('[AdminRouteGuard] GET /clients/user/me ->', res.status);
          const clone = res.clone();
          clone.text().then(t => {
            try { console.debug('[AdminRouteGuard] body:', t && t.substring(0, 200)); } catch {}
          }).catch(() => {});
        } catch {}
        // 2) If unauthorized, attempt refresh using httpOnly refresh cookie
        if (res.status === 401) {
          try {
            const refreshRes = await fetch(`${apiBase}/clients/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });
            if (refreshRes.ok) {
              const rj = await refreshRes.json().catch(() => ({}));
              if (rj && rj.token) {
                try { localStorage.setItem('token', rj.token); } catch {}
              }
              // retry /me once after refresh
              res = await fetch(`${apiBase}/clients/user/me`, {
                credentials: 'include',
                headers: buildAuthHeaders(),
              });
            }
          } catch {}
        }
        if (!res.ok) return window.location.replace(mainLogin);
        const data = await res.json();
        if (!data?.user || data.user.role !== 'admin') return window.location.replace(mainLogin);
        setAllowed(true);
      } catch (e) {
        window.location.replace(mainLogin);
      } finally {
        setChecking(false);
      }
    };
    checkAccess();
  }, []);

  if (checking) return null;
  if (!allowed) return null;
  return children;
}
