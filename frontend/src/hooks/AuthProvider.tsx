// src/hooks/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '@/lib/api';

interface User {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  // Extended fields used by Account.tsx
  first_name?: string;
  last_name?: string;
  phone?: number | string;
  gender?: string;
  dob?: string;
  profile_pic?: string;
  address?: {
    personal_address?: string;
    shoping_address?: string;
    billing_address?: string;
    address_village?: string;
    landmark?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  } | string;
  wishlist?: any[];
  orders?: any[];
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  role: string | null;
  setRole: (role: string | null) => void;
  login: (
    email: string,
    password: string,
    redirectTo?: string,
    navCallback?: (to: string) => void
  ) => Promise<void>;
  logout: (navCallback?: (to: string) => void) => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Keep role synced with user.role
  useEffect(() => {
    setRole(user?.role ?? null);
  }, [user]);

  // Fetch logged-in user from backend. Prefer cookie, but include Bearer as fallback for mobile browsers blocking cookies.
  const fetchUser = async (overrideToken?: string) => {
    try {
      const bearer = overrideToken || token || (() => { try { return localStorage.getItem('token'); } catch { return null; } })() || undefined;
      const headers: Record<string, string> = {};
      if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
      const res = await fetch(apiUrl('/clients/user/me'), { credentials: 'include', headers });

      if (res.status === 401) {
        // User is logged out - silently reset state
        setUser(null);
        setToken(null);
        setRole(null);
        try { localStorage.removeItem('isLoggedIn'); } catch {}
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Invalid response from /user/me: ${contentType} body=${text?.slice(0, 120)}`);
      }

      const data = await res.json();
      if (!data?.user) {
        setUser(null);
        setToken(null);
        setRole(null);
        return;
      }

      // Only update user state if we actually got valid user data
      if (data.user && data.user._id) {
        setUser(data.user);
        setRole(data.user?.role ?? null);
        // Cache user data in localStorage for persistence
        try {
          localStorage.setItem('cachedUserData', JSON.stringify(data.user));
        } catch {}
      }
    } catch (err) {
      console.error('[AuthProvider] fetchUser failed:', err);
      // Don't clear user state on network errors, try to use cached data
      try {
        const cachedUser = localStorage.getItem('cachedUserData');
        if (cachedUser && !user) {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          setRole(parsedUser?.role ?? null);
        }
      } catch {}
    }
  };

  useEffect(() => {
    const init = async () => {
      // Avoid hitting /me when clearly logged out
      let shouldFetch = false;
      let storedToken: string | null = null;
      try {
        shouldFetch = localStorage.getItem('isLoggedIn') === '1';
        storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          // If a token exists, attempt to fetch user (mobile fallback when cookies are blocked)
          shouldFetch = true;
        }
        
        // Try to load cached user data immediately for better UX
        const cachedUser = localStorage.getItem('cachedUserData');
        if (cachedUser && shouldFetch) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            setRole(parsedUser?.role ?? null);
          } catch {}
        }
      } catch {}

      if (shouldFetch) {
        await fetchUser(storedToken || undefined);
      }
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync logout across apps/tabs: react to Admin panel broadcasts and storage events
  useEffect(() => {
    const applyExternalLogout = () => {
      setUser(null);
      setToken(null);
      setRole(null);
      try { localStorage.removeItem('token'); } catch {}
      try { localStorage.removeItem('isLoggedIn'); } catch {}
      try { navigate('/auth'); } catch {}
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('auth');
      bc.onmessage = (ev: MessageEvent) => {
        try {
          const t = (ev && (ev as any).data && (ev as any).data.type) || undefined;
          if (t === 'logout') applyExternalLogout();
        } catch {}
      };
    } catch {}

    const onCustom = () => applyExternalLogout();
    const onStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'auth_logout') applyExternalLogout();
      } catch {}
    };

    try { window.addEventListener('auth:logout', onCustom as any); } catch {}
    try { window.addEventListener('storage', onStorage); } catch {}

    return () => {
      try { if (bc) { bc.onmessage = null; bc.close(); } } catch {}
      try { window.removeEventListener('auth:logout', onCustom as any); } catch {}
      try { window.removeEventListener('storage', onStorage); } catch {}
    };
  }, [navigate]);

  // Cross-origin logout detection: on tab focus/visibility, re-check session
  useEffect(() => {
    let lastCheck = 0;
    const MIN_MS = 8000; // throttle checks

    const isProbablyLoggedIn = () => {
      try {
        if (token) return true;
        return localStorage.getItem('isLoggedIn') === '1';
      } catch {
        return !!token;
      }
    };

    const check = () => {
      const now = Date.now();
      if (now - lastCheck < MIN_MS) return;
      lastCheck = now;
      if (!isProbablyLoggedIn()) return; // avoid 401 noise when logged out
      fetchUser().catch(() => {});
    };

    const onFocus = () => check();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };

    try { window.addEventListener('focus', onFocus); } catch {}
    try { document.addEventListener('visibilitychange', onVisibility); } catch {}

    return () => {
      try { window.removeEventListener('focus', onFocus); } catch {}
      try { document.removeEventListener('visibilitychange', onVisibility); } catch {}
    };
  }, [token]);

  // Login using cookie-based auth
  const login = async (
    email: string,
    password: string,
    redirectTo?: string,
    navCallback?: (to: string) => void
  ) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/clients/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => null);
        throw new Error(`Invalid login response: ${text?.slice(0, 120)}`);
      }

      if (!res.ok || (data && data.ok === false)) {
        const errorMsg = data?.msg || data?.message || data?.error || 'Login failed. Please check your credentials and try again.';
        throw new Error(errorMsg);
      }

      // Persist bearer token for cross-origin/mobile fallback
      try {
        if (data?.token) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
        }
      } catch {}

      // Immediately fetch user using the fresh token to handle cases where cookies are blocked on mobile
      await fetchUser(data?.token);

      if (data?.user?.role) setRole(data.user.role);

      // Mark as logged in so init() fetches next time
      try { localStorage.setItem('isLoggedIn', '1'); } catch {}

      if (navCallback) navCallback(redirectTo || '/');
    } catch (err) {
      console.error('[AuthProvider] Login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout and clear all states
  const logout = async (navCallback?: (to: string) => void) => {
    try {
      await fetch(apiUrl('/clients/logout'), { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('[AuthProvider] logout backend call failed', e);
    }

    setUser(null);
    setToken(null);
    setRole(null);

    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('isLoggedIn'); } catch {}
    try { localStorage.removeItem('cachedUserData'); } catch {}

    try {
      const bc = new BroadcastChannel('auth');
      bc.postMessage({ type: 'logout' });
      bc.close();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch {}

    if (navCallback) navCallback('/auth');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role,
        setRole,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};

export const useAuth = useAuthContext;
