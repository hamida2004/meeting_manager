import { View, Text, FlatList, StyleSheet } from "react-native";
import { useTranslation } from "@/context/langContext";

export default function NotificationsScreen() {
  const { t } = useTranslation();

  const notifications = [
    { id: "1", text: t("newMeetingCreated") },
    { id: "2", text: t("voteLaunched") },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("notifications")}</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>{t("noNotifications")}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingVertical: 60 },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
});