import React from "react";
import axios from "axios";

const Ctx = React.createContext<{ active: number } | null>(null);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const w = window as any;
    // Patch fetch once
    if (!w.__globalFetchPatched) {
      const original: typeof fetch = w.fetch.bind(w);
      w.fetch = async (...args: any[]) => {
        setActive((c) => c + 1);
        try {
          const res = await original(...(args as Parameters<typeof fetch>));
          return res;
        } finally {
          setActive((c) => Math.max(0, c - 1));
        }
      };
      w.__globalFetchPatched = true;
    }
    // Axios interceptors to track axios-based calls
    if (!w.__globalAxiosPatched) {
      axios.interceptors.request.use(
        (config) => {
          setActive((c) => c + 1);
          return config;
        },
        (error) => {
          setActive((c) => Math.max(0, c - 1));
          return Promise.reject(error);
        }
      );
      axios.interceptors.response.use(
        (response) => {
          setActive((c) => Math.max(0, c - 1));
          return response;
        },
        (error) => {
          setActive((c) => Math.max(0, c - 1));
          return Promise.reject(error);
        }
      );
      w.__globalAxiosPatched = true;
    }
    return () => {
      // restore not necessary during SPA lifetime
    };
  }, []);

  return <Ctx.Provider value={{ active }}>{children}</Ctx.Provider>;
}

export function useGlobalLoading() {
  const ctx = React.useContext(Ctx);
  return { active: ctx?.active ?? 0, isLoading: (ctx?.active ?? 0) > 0 };
}
