import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { TranslationProvider } from "../context/langContext";
import * as SecureStore from "expo-secure-store";

const AuthCheck = async () => {
  const token = await SecureStore.getItemAsync("token");
  return !!token;
};

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await AuthCheck();
      setIsAuthenticated(result);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // ⏳ Loading screen
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <TranslationProvider>

    <Stack screenOptions={{ headerShown: false }}>
      
      {/* Auth stack */}
      {!isAuthenticated && (
        <Stack.Screen name="(auth)" />
      )}

      {/* Main app */}
      {isAuthenticated && (
        <Stack.Screen name="(tabs)" />
      )}

    </Stack>
    </TranslationProvider>
  );
}