import { useEffect, useState } from "react";
import getApiBase from "@utils/apiBase";

export default function AdminRouteGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const frontendBase = (() => {
    let f = import.meta.env.VITE_FRONTEND_URL;
    try { const u = new URL(f); return u.origin; } catch { return f; }
  })().replace(/\/$/, '');
  const mainLogin = `${frontendBase}/auth`;
  const apiBase = getApiBase();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Fetch user info using cookie-based auth
        const res = await fetch(`${apiBase}/clients/user/me`, {
          credentials: 'include',
        });
        if (!res.ok) {
          window.location.replace(mainLogin);
          return;
        }
        const data = await res.json();
        if (!data?.user || data.user.role !== 'admin') {
          window.location.replace(mainLogin);
          return;
        }
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
