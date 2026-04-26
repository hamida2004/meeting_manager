
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/context/langContext";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../services/api";


export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          router.replace("/(auth)/Login");
          return;
        }

        setUser(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    const token = await SecureStore.getItemAsync("token");

    // optional: notify backend
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await SecureStore.deleteItemAsync("token");

    router.replace("/(auth)/Login");
  };

  if (!user) {
    return <Text style={{ marginTop: 50, textAlign: "center" }}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("profile")}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t("name")}</Text>
        <Text style={styles.value}>{user.full_name}</Text>

        <Text style={styles.label}>{t("email")}</Text>
        <Text style={styles.value}>{user.email}</Text>

        <Text style={styles.label}>{t("role")}</Text>
        <Text style={styles.value}>{t(user.role || "member")}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="red" />
        <Text style={styles.logoutText}>{t("logout")}</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 60,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },

  label: {
    fontSize: 12,
    color: "#777",
    marginTop: 10,
  },

  value: {
    fontSize: 16,
    fontWeight: "500",
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },

  logoutText: {
    color: "red",
    fontWeight: "bold",
    fontSize: 16,
  },
});