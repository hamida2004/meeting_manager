import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authAPI } from "../../services/api";

// Expects ?token=<reset_token> in URL (deep link from email)
export default function NewPassword() {
  const router  = useRouter();
  const { token } = useLocalSearchParams();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleReset() {
    if (!password || !confirm) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    if (!token) {
      Alert.alert("Error", "Invalid or missing reset token.");
      return;
    }
    setLoading(true);
    try {
      // FIX: API expects { token, password }, not { token, newPassword }
      await authAPI.resetPassword({ token, password });
      Alert.alert("Success", "Password updated! Please sign in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/Login") },
      ]);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Could not reset password.");
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
        <View style={styles.header}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>Choose a strong new password for your account.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 characters"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          {/* Strength indicator */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthBar,
                    password.length >= i * 3 && styles.strengthActive,
                    password.length >= 10 && styles.strengthStrong,
                  ]}
                />
              ))}
              <Text style={styles.strengthLabel}>
                {password.length < 6 ? "Weak" : password.length < 10 ? "Fair" : "Strong"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center", paddingBottom: 32 },
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
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
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
  strengthRow:  { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 },
  strengthBar:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB" },
  strengthActive: { backgroundColor: "#F59E0B" },
  strengthStrong: { backgroundColor: "#10B981" },
  strengthLabel:  { fontSize: 11, color: "#6B7280", marginLeft: 6 },
  btn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: "#fff", fontWeight: "700", fontSize: 16 },
});
