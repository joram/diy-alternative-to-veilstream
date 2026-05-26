import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthState, client, getToken, setToken } from "@/api/client";

interface AuthContextValue {
  auth: AuthState | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setAuth(null);
      setLoading(false);
      return;
    }
    try {
      const me = await client.me();
      setAuth(me);
    } catch {
      setToken(null);
      setAuth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.logout();
    } finally {
      setToken(null);
      setAuth(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ auth, loading, refresh, logout }),
    [auth, loading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
