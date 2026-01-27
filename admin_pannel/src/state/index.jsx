import { createSlice } from "@reduxjs/toolkit";

// More robust theme mode detection for production
const getInitialThemeMode = () => {
  // First check URL params for theme override
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    if (themeParam === 'light' || themeParam === 'dark') {
      return themeParam;
    }
  }
  
  // Then check localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('admin_theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    }
  } catch (e) {
    console.warn('localStorage not available');
  }
  
  // Finally check system preference
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return 'dark';
    }
  } catch (e) {
    console.warn('matchMedia not available');
  }
  
  return 'dark'; // fallback
};

const initialState = {
  mode: getInitialThemeMode(),
  userId: "63701cc1f03239b7f700000e",
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    // Accept optional payload to explicitly set the mode, fallback to toggle when not provided
    setMode: (state, action) => {
      // Force recalculation of new mode to prevent state sync issues
      const currentMode = state.mode || 'dark';
      const newMode = (action && action.payload && (action.payload === 'light' || action.payload === 'dark'))
        ? action.payload
        : (currentMode === "light" ? "dark" : "light");
      state.mode = newMode;
      
      // Multiple persistence strategies for production reliability
      try {
        if (typeof window !== 'undefined') {
          // Strategy 1: localStorage
          if (window.localStorage) {
            localStorage.setItem('admin_theme_mode', newMode);
          }
          
          // Strategy 2: sessionStorage as backup
          if (window.sessionStorage) {
            sessionStorage.setItem('admin_theme_mode', newMode);
          }
          
          // Strategy 3: document attribute for CSS targeting
          document.documentElement.setAttribute('data-theme', newMode);
          
          // Strategy 4: CSS class for immediate styling
          document.documentElement.className = document.documentElement.className
            .replace(/theme-(light|dark)/g, '') + ` theme-${newMode}`;
          
          // Strategy 5: Custom event for components to listen
          window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { mode: newMode } 
          }));
        }
      } catch (e) {
        console.warn('Failed to persist theme mode:', e);
      }
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
  },
});

export const { setMode, setUserId } = globalSlice.actions;

export default globalSlice.reducer;
