import { useEffect } from "react";

import {
  Stack,
  useRouter,
  useSegments,
  SplashScreen,
} from "expo-router";

import {
  ActivityIndicator,
  View,
} from "react-native";

import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";

// Prevent splash from auto hiding
SplashScreen.preventAutoHideAsync();

function Guard() {
  const { user, loading } =
    useAuth();

  const router = useRouter();

  const segments =
    useSegments();

  useEffect(() => {
    // Wait until auth restore finishes
    if (loading) return;

    // Wait until router resolves segments
    if (!segments.length) return;

    const inAuthGroup =
      segments[0] === "(auth)";

    // User NOT authenticated
    if (
      !user &&
      !inAuthGroup
    ) {
      router.replace(
        "/(auth)/Login"
      );
    }

    // User authenticated
    else if (
      user &&
      inAuthGroup
    ) {
      router.replace(
        "/(tabs)/(Home)"
      );
    }

    SplashScreen.hideAsync();
  }, [
    user,
    loading,
    segments,
  ]);

  if (
    loading ||
    !segments.length
  ) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent:
            "center",
          alignItems: "center",
          backgroundColor:
            "#F3F4F6",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#4F46E5"
        />
      </SafeAreaView>
    );
  }

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor:
            "#F3F4F6",
        }}
      >
        <AuthProvider>
          <Guard />

          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="(auth)"
            />

            <Stack.Screen
              name="(tabs)"
            />
          </Stack>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}