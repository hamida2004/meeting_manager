import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { authAPI } from "../../services/api";

export default function ResetPwd() {
  const router   = useRouter();
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  async function handleRequest() {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      await authAPI.requestReset({ email: email.trim() });
      setSent(true);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a reset link.
          </Text>
        </View>

        {sent ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successMsg}>
              Check your inbox for the password reset link.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.replace("/(auth)/Login")}
            >
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 },
  backBtn:   { marginBottom: 32 },
  backText:  { fontSize: 15, color: "#4F46E5", fontWeight: "600" },
  header:    { alignItems: "center", marginBottom: 32 },
  icon:      { fontSize: 48, marginBottom: 12 },
  title:     { fontSize: 26, fontWeight: "800", color: "#111827", letterSpacing: -0.5 },
  subtitle:  { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 8, lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: "#fff", fontWeight: "700", fontSize: 16 },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  successIcon:  { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  successMsg:   { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20, marginBottom: 24 },
});