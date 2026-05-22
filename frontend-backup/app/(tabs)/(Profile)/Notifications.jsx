import {
  View, FlatList, TouchableOpacity,
  Text, StyleSheet, ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { notificationAPI } from "../../../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id_notification === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id_notification.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.pageTitle}>Notifications</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => markRead(item.id_notification)}
            style={[styles.card, item.is_read && styles.cardRead]}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, item.is_read && styles.dotRead]} />
            <View style={styles.body}>
              {/* FIX: API notification field is `content`, not `title`/`message` */}
              <Text style={[styles.content, item.is_read && styles.contentRead]}>
                {item.content}
              </Text>
              <Text style={styles.time}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list:    { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

  pageTitle: {
    fontSize: 26, fontWeight: "800", color: "#111827",
    letterSpacing: -0.5, marginBottom: 20,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#E0D9FF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardRead: {
    backgroundColor: "#fff",
    borderColor: "#F3F4F6",
  },

  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#4F46E5",
    marginRight: 12, marginTop: 5,
  },
  dotRead: { backgroundColor: "#D1D5DB" },

  body:        { flex: 1 },
  content:     { fontSize: 14, color: "#111827", fontWeight: "600", lineHeight: 20 },
  contentRead: { fontWeight: "400", color: "#374151" },
  time:        { fontSize: 11, color: "#9CA3AF", marginTop: 4 },

  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText:  { fontSize: 14, color: "#9CA3AF" },
});
