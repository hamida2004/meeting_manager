import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";

function Guard() {
  const { user, loading } = useAuth();
  const router    = useRouter();
  const segments  = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)" || segments[0] === "auth";
    if (!user && !inAuth)  router.replace("/(auth)/Login");
    if (user  &&  inAuth)  router.replace("/(tabs)/");
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f1a" }}>
        <ActivityIndicator color="#6c63ff" size="large" />
      </View>
    );
  }
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Guard />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </AuthProvider>
  );
}
