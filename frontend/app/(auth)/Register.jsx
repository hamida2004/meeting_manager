import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "../../context/langContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    if (!name || !email || !password) {
      alert(t("fillAllFields"));
      return;
    }

    if (password.length < 6) {
      alert(t("passwordLength"));
      return;
    }

    console.log({ name, email, password });
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("register")}</Text>

      <TextInput
        placeholder={t("fullName")}
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

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

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>{t("createAccount")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/Login")}>
        <Text style={styles.link}>{t("alreadyHaveAccount")}</Text>
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