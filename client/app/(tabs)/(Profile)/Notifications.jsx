import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { useEffect, useState, useCallback } from "react";

import { Ionicons } from "@expo/vector-icons";

import { notificationAPI } from "../../../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } =
        await notificationAPI.getAll();

      setNotifications(data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id_notification === id
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const unreadCount =
    notifications.filter((n) => !n.is_read)
      .length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color="#4F46E5"
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={notifications}
        keyExtractor={(item) =>
          item.id_notification.toString()
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>
                Notifications
              </Text>

              <Text style={styles.subtitle}>
                {unreadCount} unread
                notification
                {unreadCount !== 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons
                name="notifications"
                size={24}
                color="#4F46E5"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="notifications-off-outline"
                size={42}
                color="#9CA3AF"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No notifications
            </Text>

            <Text style={styles.emptyText}>
              You're all caught up.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              markRead(item.id_notification)
            }
            style={[
              styles.card,
              item.is_read && styles.cardRead,
            ]}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrap,
                item.is_read &&
                  styles.iconWrapRead,
              ]}
            >
              <Ionicons
                name={
                  item.is_read
                    ? "mail-open-outline"
                    : "notifications"
                }
                size={18}
                color={
                  item.is_read
                    ? "#6B7280"
                    : "#4F46E5"
                }
              />
            </View>

            <View style={styles.body}>
              <Text
                style={[
                  styles.content,
                  item.is_read &&
                    styles.contentRead,
                ]}
              >
                {item.content}
              </Text>

              <View style={styles.timeRow}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color="#9CA3AF"
                />

                <Text style={styles.time}>
                  {item.createdAt
                    ? new Date(
                        item.createdAt
                      ).toLocaleString()
                    : ""}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,

    backgroundColor: "#EEF2FF",

    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",

    backgroundColor: "#EEF2FF",

    borderRadius: 22,

    padding: 16,

    marginBottom: 14,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  cardRead: {
    backgroundColor: "#fff",
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,

    backgroundColor: "#fff",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 14,
  },

  iconWrapRead: {
    backgroundColor: "#F3F4F6",
  },

  body: {
    flex: 1,
  },

  content: {
    fontSize: 14,
    lineHeight: 22,
    color: "#111827",
    fontWeight: "600",
  },

  contentRead: {
    color: "#4B5563",
    fontWeight: "500",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  time: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 5,
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 90,
  },

  emptyIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,

    backgroundColor: "#fff",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});