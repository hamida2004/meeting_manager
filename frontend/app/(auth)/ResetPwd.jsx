import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "../../context/langContext";
import { API_URL } from "../../services/api";


export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");

const handleReset = async () => {
  if (!email) {
    alert(t("fillAllFields"));
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/request-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Error");
      return;
    }

    console.log("RESET TOKEN:", data.token); // 🔴 temporary

    alert("Check console for reset token (dev mode)");

    // 👉 navigate to reset screen
    router.push("/(auth)/NewPassword");

  } catch (err) {
    alert("Network error");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("resetPassword")}</Text>

      <TextInput
        placeholder={t("enterEmail")}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>{t("sendResetLink")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>{t("backToLogin")}</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: { color: "#fff", fontWeight: "bold" },

  link: {
    color: "#007AFF",
    marginTop: 10,
    textAlign: "center",
  },
});