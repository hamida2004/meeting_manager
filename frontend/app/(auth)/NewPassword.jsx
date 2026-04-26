import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import { API_URL } from "../../services/api";

export default function NewPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");

  const handleReset = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg);
        return;
      }

      alert("Password updated");

    } catch (err) {
      alert("Error");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Token</Text>
      <TextInput value={token} onChangeText={setToken} />

      <Text>New Password</Text>
      <TextInput secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity onPress={handleReset}>
        <Text>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}