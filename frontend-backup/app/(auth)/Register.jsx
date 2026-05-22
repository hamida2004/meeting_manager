import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { authAPI } from "../../services/api";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  async function handleRegister() {
    const { name, email, password, confirm } = form;
    if (!name.trim() || !email.trim() || !password || !confirm) {
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
    setLoading(true);
    try {
      // FIX: axios returns { data }, not { res }
      const { data } = await authAPI.register({ full_name: name.trim(), email: email.trim(), password });
      // FIX: API returns accessToken, not token
      await SecureStore.setItemAsync("token", data.accessToken);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));
      router.replace("/(tabs)/(Home)");
    } catch (err) {
      Alert.alert("Registration Failed", err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "name",     label: "Full Name",        placeholder: "John Doe",          secure: false, type: "default" },
    { key: "email",    label: "Email",             placeholder: "you@example.com",   secure: false, type: "email-address" },
    { key: "password", label: "Password",          placeholder: "Min. 6 characters", secure: true,  type: "default" },
    { key: "confirm",  label: "Confirm Password",  placeholder: "Repeat password",   secure: true,  type: "default" },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>📋</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Meeting Manager today</Text>
        </View>

        <View style={styles.card}>
          {fields.map(({ key, label, placeholder, secure, type }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={secure}
                keyboardType={type}
                autoCapitalize={key === "name" ? "words" : "none"}
                value={form[key]}
                onChangeText={set(key)}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.link}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F9FAFB" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header:   { alignItems: "center", marginBottom: 32 },
  logo:     { fontSize: 48, marginBottom: 8 },
  title:    { fontSize: 28, fontWeight: "800", color: "#111827", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#6B7280", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 24,
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
  btn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkText:    { textAlign: "center", fontSize: 14, color: "#6B7280" },
  link:        { color: "#4F46E5", fontWeight: "600" },
});
