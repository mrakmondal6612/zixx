import React from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { FullScreenLoader } from "@/components/ui/loader";
import { useGlobalLoading } from "@/hooks/GlobalLoading";

// A subtle, non-blocking global loader that appears during navigations or background fetches
export default function GlobalLoadingOverlay() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const location = useLocation();
  const { active: fetchActive } = useGlobalLoading();

  const inFlight =
    isFetching > 0 ||
    isMutating > 0 ||
    fetchActive > 0;

  // Debounce to avoid flicker on very fast requests
  const [visible, setVisible] = React.useState(false);
  const showTimer = React.useRef<number | null>(null);
  const hideTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (inFlight) {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (!visible && !showTimer.current) {
        showTimer.current = window.setTimeout(() => {
          setVisible(true);
          showTimer.current = null;
        }, 100);
      }
    } else {
      if (showTimer.current) {
        window.clearTimeout(showTimer.current);
        showTimer.current = null;
      }
      if (visible && !hideTimer.current) {
        hideTimer.current = window.setTimeout(() => {
          setVisible(false);
          hideTimer.current = null;
        }, 200);
      }
    }
    return () => {
      if (showTimer.current) window.clearTimeout(showTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      showTimer.current = null;
      hideTimer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFlight, location.pathname]);

  if (!visible) return null;

  return <FullScreenLoader message="Loading…" variant="ring" />;
}
