import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { configureStore } from "@reduxjs/toolkit";
import globalReducer from "@state";
import { api as adminApi } from "@state/api";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";

const store = configureStore({
  reducer: {
    global: globalReducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(adminApi.middleware),
});

const root = ReactDOM.createRoot(document.getElementById("root"));

// Removed logic that handled ?token=... in URL after login


// Utility to clear all cookies for this domain, all paths, and all domain levels
function clearAllCookies() {
  try {
    const cookies = document.cookie.split(';');
    const hostname = window.location.hostname;
    const domainParts = hostname.split('.');
    const paths = ['/', window.location.pathname];
    for (let c of cookies) {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      // Try all domain levels (e.g. sub.domain.com, domain.com)
      for (let i = 0; i < domainParts.length - 1; i++) {
        const domain = domainParts.slice(i).join('.');
        for (let path of paths) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain};`;
        }
      }
      // Also try without domain (current host)
      for (let path of paths) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};`;
      }
    }
  } catch (e) {}
}

// Listen for logout event globally
window.addEventListener('auth:logout', () => {
  try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
  clearAllCookies();
});

const RootApp = () => {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
};

// enable listeners for refetchOnFocus/refetchOnReconnect behaviors
try { setupListeners(store.dispatch); } catch (e) {}

root.render(<RootApp />);
