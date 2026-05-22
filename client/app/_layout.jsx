import { useEffect, useState } from "react";

import {
  Stack,
  useRouter,
  useSegments,
  SplashScreen,
} from "expo-router";

import {
  ActivityIndicator,
} from "react-native";

import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import * as Font from "expo-font";

import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
} from "@expo/vector-icons";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";

// =====================================================
// PREVENT AUTO SPLASH HIDE
// =====================================================
SplashScreen.preventAutoHideAsync();

// =====================================================
// GUARD — handles auth-based navigation
// =====================================================
function Guard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [authRestored, setAuthRestored] = useState(false);

  // Wait for auth restoration to complete
  useEffect(() => {
    if (!loading) {
      setAuthRestored(true);
    }
  }, [loading]);

  // Handle navigation after auth is restored
  useEffect(() => {
    if (!authRestored) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (user) {
      if (inAuthGroup) {
        router.replace("/(tabs)/(Home)");
      }
    } else {
      if (!inAuthGroup) {
        router.replace("/(auth)/Login");
      }
    }
  }, [authRestored, user, segments]);

  // Hide splash screen only after auth is restored
  useEffect(() => {
    if (authRestored) {
      SplashScreen.hideAsync();
    }
  }, [authRestored]);

  // Show loading indicator while restoring auth
  if (loading || !authRestored) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
        }}
      >
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return null;
}

// =====================================================
// ROOT LAYOUT
// =====================================================
export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
          ...MaterialIcons.font,
          ...FontAwesome.font,
          ...AntDesign.font,
        });
      } catch (e) {
        console.warn("Font loading error:", e);
      } finally {
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  // Wait for fonts before rendering the app tree
  if (!fontsLoaded) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
        }}
      >
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <AuthProvider>
          <Guard />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
