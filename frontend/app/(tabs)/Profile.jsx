import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/context/langContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const user = {
    name: "Hamida",
    email: "hamida@email.com",
    role: "president", // 🔑 use key, not hardcoded label
  };

  const handleLogout = () => {
    // TODO: remove token
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <Text style={styles.title}>{t("profile")}</Text>

      {/* User Card */}
      <View style={styles.card}>
        <Text style={styles.label}>{t("name")}</Text>
        <Text style={styles.value}>{user.name}</Text>

        <Text style={styles.label}>{t("email")}</Text>
        <Text style={styles.value}>{user.email}</Text>

        <Text style={styles.label}>{t("role")}</Text>
        <Text style={styles.value}>{t(user.role)}</Text>
      </View>

      {/* Logout Button */}
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