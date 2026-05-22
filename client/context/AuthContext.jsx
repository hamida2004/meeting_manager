import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import * as SecureStore from "expo-secure-store";

import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // RESTORE SESSION
  // =====================================================
  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await SecureStore.getItemAsync("token");
      const storedUser = await SecureStore.getItemAsync("user");

      // No session
      if (!token || !storedUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Parse stored user data safely
      let parsedUser;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        await clearStorage();
        setUser(null);
        setLoading(false);
        return;
      }

      // Set user for UI rendering
      setUser(parsedUser);

      // Verify with backend
      try {
        const { data } = await authAPI.me();
        setUser(data);
        await SecureStore.setItemAsync("user", JSON.stringify(data));
      } catch (err) {
        console.log("Session invalid:", err?.response?.data || err);
        await clearStorage();
        setUser(null);
      } finally {
        // Only set loading to false after all verification is complete
        setLoading(false);
      }
    } catch (err) {
      console.log("Restore failed:", err);
      await clearStorage();
      setUser(null);
      setLoading(false);
    }
  }

  // =====================================================
  // LOGIN
  // =====================================================
  async function login(email, password) {
    try {
      const { data } = await authAPI.login({
        email: email.trim().toLowerCase(),
        password,
      });

      await SecureStore.setItemAsync("token", String(data.accessToken));
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));
      setUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  // =====================================================
  // REGISTER
  // =====================================================
  async function register({ full_name, email, password }) {
    try {
      const { data } = await authAPI.register({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      await SecureStore.setItemAsync("token", String(data.accessToken));
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));
      setUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================
  async function logout() {
    try {
      await authAPI.logout();
    } catch (error) {
      console.log("Logout API call failed:", error);
    } finally {
      await clearStorage();
      setUser(null);
    }
  }

  // =====================================================
  // REFRESH USER
  // =====================================================
  async function refresh() {
    try {
      const { data } = await authAPI.me();
      setUser(data);
      await SecureStore.setItemAsync("user", JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      await logout();
      throw error;
    }
  }

  // =====================================================
  // CLEAR STORAGE
  // =====================================================
  async function clearStorage() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync("token"),
        SecureStore.deleteItemAsync("user")
      ]);
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);