import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import * as SecureStore from "expo-secure-store";

import { authAPI } from "../services/api";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // Restore session
  useEffect(() => {
    async function restore() {
      try {
        const token =
          await SecureStore.getItemAsync(
            "token"
          );

        const storedUser =
          await SecureStore.getItemAsync(
            "user"
          );

        // No session
        if (
          !token ||
          !storedUser
        ) {
          setLoading(false);
          return;
        }

        // Instant restore from storage
        const parsedUser =
          JSON.parse(storedUser);

        setUser(parsedUser);

        // Allow app to render immediately
        setLoading(false);

        // Silent verification with backend
        try {
          const { data } =
            await authAPI.me();

          setUser(data);

          await SecureStore.setItemAsync(
            "user",
            JSON.stringify(data)
          );
        } catch (err) {
          console.log(
            "Session expired:",
            err?.response?.data ||
              err
          );

          await SecureStore.deleteItemAsync(
            "token"
          );

          await SecureStore.deleteItemAsync(
            "user"
          );

          setUser(null);
        }
      } catch (err) {
        console.log(
          "Restore failed:",
          err
        );

        setUser(null);

        setLoading(false);
      }
    }

    restore();
  }, []);

  // LOGIN
  const login = async (
    email,
    password
  ) => {
    const { data } =
      await authAPI.login({
        email,
        password,
      });

    await SecureStore.setItemAsync(
      "token",
      String(
        data.accessToken
      )
    );

    await SecureStore.setItemAsync(
      "user",
      JSON.stringify(
        data.user
      )
    );

    setUser(data.user);

    return data.user;
  };

  // LOGOUT
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {}

    await SecureStore.deleteItemAsync(
      "token"
    );

    await SecureStore.deleteItemAsync(
      "user"
    );

    setUser(null);
  };

  // REFRESH USER
  const refresh =
    async () => {
      const { data } =
        await authAPI.me();

      setUser(data);

      await SecureStore.setItemAsync(
        "user",
        JSON.stringify(data)
      );

      return data;
    };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);