import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) { setLoading(false); return; }
        const { data } = await authAPI.me();
        setUser(data);
      } catch {
        await SecureStore.deleteItemAsync("token");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await SecureStore.setItemAsync("token", data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* best effort */ }
    await SecureStore.deleteItemAsync("token");
    setUser(null);
  };

  const refresh = async () => {
    const { data } = await authAPI.me();
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
