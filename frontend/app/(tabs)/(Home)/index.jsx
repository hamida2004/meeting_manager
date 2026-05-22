import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { meetingAPI, notificationAPI, authAPI } from "../../../services/api";

const STATUS_COLORS = {
  scheduled:  { bg: "#EFF6FF", text: "#3B82F6" },
  ongoing:    { bg: "#F0FDF4", text: "#22C55E" },
  completed:  { bg: "#F9FAFB", text: "#6B7280" },
  cancelled:  { bg: "#FEF2F2", text: "#EF4444" },
};

function MeetingCard({ meeting, onPress }) {
  const status = meeting.status || "scheduled";
  const color  = STATUS_COLORS[status] || STATUS_COLORS.scheduled;
  // FIX: API field is `timing`, not `date`
  const date   = meeting.timing ? new Date(meeting.timing) : null;

  return (
    <TouchableOpacity style={styles.meetingCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.meetingCardLeft}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{date ? date.getDate() : "--"}</Text>
          <Text style={styles.dateMon}>
            {date ? date.toLocaleString("default", { month: "short" }) : ""}
          </Text>
        </View>
      </View>
      <View style={styles.meetingCardBody}>
        <Text style={styles.meetingTitle} numberOfLines={1}>{meeting.title || "Untitled"}</Text>
        {/* FIX: API returns committee (lowercase) on the Meeting object */}
        <Text style={styles.meetingCommittee} numberOfLines={1}>
          {meeting.committee?.name || meeting.Committee?.name || ""}
        </Text>
        <Text style={styles.meetingTime}>
          {date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
        <Text style={[styles.statusText, { color: color.text }]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
}

function NotifItem({ notif, onRead }) {
  return (
    <TouchableOpacity
      style={[styles.notifItem, !notif.is_read && styles.notifUnread]}
      onPress={() => onRead(notif.id_notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notifDot(notif.is_read)} />
      <View style={styles.notifBody}>
        {/* FIX: API notification field is `content`, not `message` */}
        <Text style={styles.notifMsg} numberOfLines={2}>{notif.content}</Text>
        <Text style={styles.notifTime}>
          {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [meetings, setMeetings]   = useState([]);
  const [notifs, setNotifs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadAll() {
    try {
      const [meRes, notifRes, meUser] = await Promise.all([
        meetingAPI.getMine(),
        notificationAPI.getAll(),
        authAPI.me(),
      ]);
      // getMine returns MeetingMember[], each has a .Meeting property
      const sorted = (meRes.data || [])
        .map((m) => m.Meeting || m)
        // FIX: sort/filter by timing, not date
        .filter((m) => m.status !== "cancelled" && m.status !== "completed")
        .sort((a, b) => new Date(a.timing) - new Date(b.timing));
      setMeetings(sorted.slice(0, 5));
      setNotifs((notifRes.data || []).slice(0, 8));
      setUser(meUser.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load data. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, []);

  async function markRead(id) {
    try {
      await notificationAPI.markRead(id);
      setNotifs((n) => n.map((x) => x.id_notification === id ? { ...x, is_read: true } : x));
    } catch {}
  }

  async function markAllRead() {
    try {
      await notificationAPI.markAllRead();
      setNotifs((n) => n.map((x) => ({ ...x, is_read: true })));
    } catch {}
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          {/* FIX: API returns full_name, not name */}
          <Text style={styles.userName}>{user?.full_name || "User"} 👋</Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#EEF2FF" }]}>
          <Text style={styles.statNum}>{meetings.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#F0FDF4" }]}>
          <Text style={styles.statNum}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      {/* Upcoming Meetings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/(Meetings)")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {meetings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No upcoming meetings</Text>
          </View>
        ) : (
          meetings.map((m) => (
            <MeetingCard
              key={m.id_meeting}
              meeting={m}
              onPress={() => router.push(`/meeting/${m.id_meeting}`)}
            />
          ))
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.seeAll}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        {notifs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          <View style={styles.notifList}>
            {notifs.map((n) => (
              <NotifItem key={n.id_notification} notif={n} onRead={markRead} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: "#F9FAFB" },
  centered:  { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

  header:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting:  { fontSize: 14, color: "#6B7280" },
  userName:  { fontSize: 24, fontWeight: "800", color: "#111827", letterSpacing: -0.5 },
  badge: {
    backgroundColor: "#EF4444",
    width: 28, height: 28, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 16,
    alignItems: "center",
  },
  statNum:   { fontSize: 28, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  section:       { marginBottom: 28 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:  { fontSize: 18, fontWeight: "700", color: "#111827" },
  seeAll:        { fontSize: 13, color: "#4F46E5", fontWeight: "600" },

  meetingCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  meetingCardLeft: { marginRight: 14 },
  dateBox: {
    width: 48, height: 54, backgroundColor: "#EEF2FF",
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  dateDay: { fontSize: 20, fontWeight: "800", color: "#4F46E5" },
  dateMon: { fontSize: 11, color: "#4F46E5", fontWeight: "600", textTransform: "uppercase" },
  meetingCardBody:    { flex: 1 },
  meetingTitle:       { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 2 },
  meetingCommittee:   { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  meetingTime:        { fontSize: 12, color: "#9CA3AF" },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

  emptyCard: {
    backgroundColor: "#fff", borderRadius: 14,
    padding: 32, alignItems: "center",
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: "#9CA3AF" },

  notifList:  { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden" },
  notifItem: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  notifUnread: { backgroundColor: "#F5F3FF" },
  notifDot:   (read) => ({
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: read ? "#D1D5DB" : "#4F46E5",
    marginRight: 12, marginTop: 5,
  }),
  notifBody:  { flex: 1 },
  notifMsg:   { fontSize: 13, color: "#374151", lineHeight: 18 },
  notifTime:  { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
});
