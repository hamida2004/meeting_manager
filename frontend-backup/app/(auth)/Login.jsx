import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";

import { useState } from "react";
import { useRouter, usePathname, useSegments } from "expo-router"; // Import additional hooks
import * as SecureStore from "expo-secure-store";
import { authAPI } from "../../services/api";

export default function Login() {
  const router = useRouter();
  const pathname = usePathname(); // Get the current route path
  const segments = useSegments(); // Get the route segments

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Log the current route and its parent route

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  console.log("Current Route:", pathname);
  console.log("Parent Route:", segments.slice(0, -1).join("/"));

    setLoading(true);

    try {
      const { data } = await authAPI.login({
        email: email.trim(),
        password,
      });

      console.log(data);

      // Save token and user data securely
      await SecureStore.setItemAsync("token", String(data.accessToken));
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      // Redirect to the home page
      router.replace("/(tabs)/(Home)/");
    } catch (err) {
      console.error(err?.response?.data || err);

      Alert.alert(
        "Login Failed",
        err?.response?.data?.msg || "Invalid credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.logo}>📋</Text>
          <Text style={styles.title}>Meeting Manager</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push("/(auth)/ResetPwd")}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <TouchableOpacity onPress={() => router.push("/(auth)/Register")}>
          <Text style={styles.linkText}>
            Don't have an account?{" "}
            <Text style={styles.link}>Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "500",
  },
  btn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  linkText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
  },
  link: {
    color: "#4F46E5",
    fontWeight: "600",
  },
});