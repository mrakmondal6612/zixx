import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/hooks/AuthProvider";

// Admin panel URL (env or default dev port)
const ADMIN_PANEL_URL = import.meta.env.VITE_ADMIN_PANEL_URL;

const Admin = () => {
  const { user, role, loading } = useAuthContext();
  const navigate = useNavigate();

  const isAdmin = role === "admin";

  useEffect(() => {
    if (!loading && user && isAdmin) {
      if (typeof window !== "undefined") {
        try {
          const adminUrl = new URL(ADMIN_PANEL_URL);
          if (adminUrl.origin === window.location.origin) {
            navigate(adminUrl.pathname + adminUrl.search + adminUrl.hash, {
              replace: true,
            });
          } else {
            // Pass token as URL parameter for cross-origin admin panel access
            const token = localStorage.getItem('token');
            let finalUrl = ADMIN_PANEL_URL;
            if (token) {
              const url = new URL(ADMIN_PANEL_URL);
              url.searchParams.set('token', token);
              finalUrl = url.toString();
            }
            window.location.replace(finalUrl);
          }
        } catch (err) {
          // Fallback: try to pass token via URL parameter
          try {
            const token = localStorage.getItem('token');
            let finalUrl = ADMIN_PANEL_URL;
            if (token) {
              const separator = ADMIN_PANEL_URL.includes('?') ? '&' : '?';
              finalUrl = `${ADMIN_PANEL_URL}${separator}token=${encodeURIComponent(token)}`;
            }
            window.location.href = finalUrl;
          } catch {
            window.location.href = ADMIN_PANEL_URL;
          }
        }
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
        <div className="p-6 rounded-2xl shadow-xl bg-white/70 backdrop-blur-sm text-center animate-pulse">
          <p className="text-2xl font-semibold text-gray-700">
            Loading authentication...
          </p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="p-8 rounded-3xl shadow-lg bg-white/80 backdrop-blur-md text-center max-w-md">
          <h1 className="text-3xl font-bold text-green-800 mb-3">
            Access Required
          </h1>
          <p className="text-lg text-gray-600">
            Please sign in on the{" "}
            <span className="font-semibold">main site</span> before accessing
            the admin panel.
          </p>
        </div>
      </div>
    );

  if (user && !isAdmin)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="p-8 rounded-3xl shadow-lg bg-white/80 backdrop-blur-md text-center max-w-md">
          <h1 className="text-3xl font-bold text-red-700 mb-3">Unauthorized</h1>
          <p className="text-lg text-gray-600">
            You need <span className="font-semibold">admin privileges</span> to
            continue.
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="p-8 rounded-3xl shadow-lg bg-white/80 backdrop-blur-md text-center max-w-md animate-bounce">
        <h1 className="text-2xl font-bold text-blue-700">Redirecting...</h1>
        <p className="text-gray-600 mt-2">
          Taking you to <span className="font-semibold">{ADMIN_PANEL_URL}</span>
        </p>
      </div>
    </div>
  );
};

export default Admin;
