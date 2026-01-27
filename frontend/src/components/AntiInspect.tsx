import React, { useEffect } from 'react';

// Disables context menu and common DevTools shortcuts in PRODUCTION only
const AntiInspect: React.FC = () => {
  useEffect(() => {
    // Vite: import.meta.env.PROD is true only in production builds
    if (!(import.meta as any).env?.PROD) return;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey; // Ctrl on Windows/Linux, Cmd on macOS
      const shiftOrAlt = e.shiftKey || e.altKey;

      // Block F12
      if (key === 'f12') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Block Ctrl+Shift+I/J/C (or Cmd+Opt+I/J/C) commonly used to open DevTools
      if (ctrlOrMeta && shiftOrAlt && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Block View Source (Ctrl/Cmd + U)
      if (ctrlOrMeta && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    try { document.addEventListener('contextmenu', onContextMenu); } catch {}
    // Use capture to intercept before app-level handlers
    try { window.addEventListener('keydown', onKeyDown, { capture: true }); } catch {}

    return () => {
      try { document.removeEventListener('contextmenu', onContextMenu); } catch {}
      try { window.removeEventListener('keydown', onKeyDown, { capture: true } as any); } catch {}
    };
  }, []);

  return null;
};

export default AntiInspect;
