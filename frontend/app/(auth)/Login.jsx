import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "../../context/langContext";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../services/api";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const handleLogin = async () => {
  if (!email || !password) {
    alert(t("fillAllFields"));
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
    console.log(res,'////')

      alert(data.msg || "Login failed");
      
      return;
    }
    console.log("LOGIN SUCCESS:", data);

    // 👉 store token later (SecureStore)
    await SecureStore.setItemAsync("token", data.accessToken);

    router.replace("/(tabs)/Home");

  } catch (err) {
    console.log(err);
    alert("Network error");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("login")}</Text>

      <TextInput
        placeholder={t("email")}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder={t("password")}
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={() => router.push("/(auth)/ResetPwd")}>
        <Text style={styles.link}>{t("forgotPassword")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>{t("login")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/Register")}>
        <Text style={styles.link}>{t("createAccount")}</Text>
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