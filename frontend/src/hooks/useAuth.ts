import { useState } from 'react';
import { apiUrl } from '@/lib/api';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
  const res = await fetch(apiUrl('/clients/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUser({ email });
        return { error: null };
      } else {
        return { error: data.message || 'Login failed' };
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
  };

  return { user, signIn, signOut, loading };
};
