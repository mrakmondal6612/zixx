import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { themeSettings } from "./theme";
import { useSelector, useDispatch } from "react-redux";
import { useMemo, useEffect, useState } from "react";
import { setMode } from "@state";

import Layout from "@scenes/layout";
import AdminRouteGuard from "@components/AdminRouteGuard";
import Dashboard from "@scenes/dashboard";
// client
import Products from "@scenes/products";
import ProductAddForm from "@scenes/products/ProductAddForm";
import Customers from "@scenes/customers";
import Transactions from "@scenes/transactions";
import Geography from "@scenes/geography";
import Orders from "@scenes/orders";

// sales
import Overview from "@scenes/overview";
import Daily from "@scenes/daily";
import Monthly from "@scenes/monthly";
import Breakdown from "@scenes/breakdown";
import Testimonials from "@scenes/testimonials";

// management
import Admin from "@scenes/admin";
import Performance from "@scenes/performance";
import AuthFallback from "./pages/AuthFallback";
import Banners from "@scenes/banners";
import Footer from "@scenes/footer";
import AuthManagement from "@scenes/auth";

import "./App.css";

function App() {
  const dispatch = useDispatch();
  const [localMode, setLocalMode] = useState('dark');
  const reduxMode = useSelector((state) => {
    try {
      return (state && state.global && state.global.mode) || 'dark';
    } catch (e) {
      console.warn('Redux state access failed, using default theme mode');
      return 'dark';
    }
  });

  // Sync local state with Redux and handle theme changes
  useEffect(() => {
    setLocalMode(reduxMode);
    
    // Apply theme immediately to DOM for production reliability
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', reduxMode);
      document.documentElement.className = document.documentElement.className
        .replace(/theme-(light|dark)/g, '') + ` theme-${reduxMode}`;
    }
  }, [reduxMode]);

  // Listen for custom theme change events (production fallback)
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newMode = event.detail.mode;
      if (newMode !== reduxMode) {
        setLocalMode(newMode);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('themeChanged', handleThemeChange);
      return () => window.removeEventListener('themeChanged', handleThemeChange);
    }
  }, [reduxMode]);

  const theme = useMemo(() => {
    try {
      return createTheme(themeSettings(localMode || 'dark'));
    } catch (e) {
      console.warn('Theme creation failed, using fallback theme');
      return createTheme(themeSettings('dark'));
    }
  }, [localMode]);

  // Capture token from URL (?t=...) for cross-origin handoff from main site
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const t = url.searchParams.get('t');
      if (t) {
        try { localStorage.setItem('token', t); } catch {}
        // Clean the URL
        url.searchParams.delete('t');
        const clean = url.pathname + (url.search ? url.search : '') + (url.hash || '');
        window.history.replaceState({}, '', clean);
      }
    } catch {}
  }, []);


  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route element={<AdminRouteGuard><Layout /></AdminRouteGuard>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/*  client */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/add" element={<ProductAddForm />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/geography" element={<Geography />} />

              {/* sales */}
              <Route path="/overview" element={<Overview />} />
              <Route path="/daily" element={<Daily />} />
              <Route path="/monthly" element={<Monthly />} />
              <Route path="/breakdown" element={<Breakdown />} />

              {/* management */}
              <Route path="/admin" element={<Admin />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/banners" element={<Banners />} />
              <Route path="/auth" element={<AuthManagement />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/footer" element={<Footer />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
