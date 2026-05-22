import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
} from "react-native";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { meetingAPI, notificationAPI, authAPI } from "../../../services/api";

const STATUS_COLORS = {
  scheduled: { bg: "#DBEAFE", text: "#2563EB" },
  ongoing: { bg: "#DCFCE7", text: "#16A34A" },
  closed: { bg: "#E5E7EB", text: "#4B5563" },
  canceled: { bg: "#FEE2E2", text: "#DC2626" },
};

function MeetingRow({ meeting, onPress }) {
  const status = STATUS_COLORS[meeting.status] || STATUS_COLORS.scheduled;
  const date = new Date(meeting.timing);

  return (
    <TouchableOpacity style={styles.meetingCard} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.meetingTop}>
        <Text style={styles.meetingTitle} numberOfLines={1}>
          {meeting.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>
            {meeting.status}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={15} color="#6B7280" />
        <Text style={styles.metaText}>{date.toLocaleString()}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons
          name={meeting.meeting_type === "online" ? "globe-outline" : "business-outline"}
          size={15}
          color="#6B7280"
        />
        <Text style={styles.metaText}>{meeting.meeting_type}</Text>
      </View>
      {!!meeting.site && (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color="#6B7280" />
          <Text style={styles.metaText}>{meeting.site}</Text>
        </View>
      )}
      <View style={styles.metaRow}>
        <Ionicons name="stats-chart-outline" size={15} color="#6B7280" />
        <Text style={styles.metaText}>Voting: {meeting.voting_state}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Meetings() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [myMeetings, setMyMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMyMeetingsExpanded, setIsMyMeetingsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // State for unread notifications

  // Function to fetch unread notifications count
  async function fetchUnreadNotifications() {
    try {
      const { data } = await notificationAPI.getNotifications();
      const unread = data.filter((notif) => !notif.is_read).length; // Count unread notifications
      setUnreadCount(unread);
      console.log('///',unread, data,'//')
    } catch (err) {
      console.error("Failed to fetch unread notifications:", err);
    }
  }


 // CollapsibleSection Component
function CollapsibleSection({ title, meetings, expanded, toggleExpanded }) {
  return (
    <View style={styles.group}>
      <TouchableOpacity style={styles.collapsibleHeader} onPress={toggleExpanded}>
        <Text style={styles.groupTitle}>{title}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
      </TouchableOpacity>
      {expanded &&
        meetings.map((meeting) => (
          <MeetingRow
            key={meeting.Meeting.id_meeting}
            meeting={meeting.Meeting}
            onPress={() => router.push(`/meeting/${meeting.Meeting.id_meeting}`)}
          />
        ))}
    </View>
  );
}



  async function load() {
    try {
      // Fetch grouped meetings
      const { data: groupedData } = await meetingAPI.getGrouped();
      setGroups(groupedData || []);

      // Fetch meetings created by the current user
      const myMeetingsRes = await meetingAPI.getMine();
      setMyMeetings(myMeetingsRes.data || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load meetings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    fetchUnreadNotifications(); // Fetch unread notifications on page load
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    fetchUnreadNotifications(); // Refresh unread notifications count
  }, []);

  const filteredGroups = groups.map((group) => ({
    ...group,
    meetings: group.meetings.filter((meeting) =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));
  const filteredMyMeetings = myMeetings;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.page}>Meetings</Text>

          {/* Notification Icon with Badge */}
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => router.push("/(tabs)/(Profile)/Notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#111827" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search meetings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Created by Me Section */}
        {filteredMyMeetings.length > 0 && (
          <CollapsibleSection
            title="Created by Me"
            meetings={filteredMyMeetings}
            expanded={isMyMeetingsExpanded}
            toggleExpanded={() => setIsMyMeetingsExpanded(!isMyMeetingsExpanded)}
          />
        )}

        {/* Grouped Meetings */}
        {filteredGroups.map((group, i) => (
          
          <View key={i} style={styles.group}>
            <Text style={styles.groupTitle}>{group.committee?.name}</Text>
            {group.meetings.map((meeting) => (
              <MeetingRow
                key={meeting.id_meeting}
                meeting={meeting}
                onPress={() => router.push(`/meeting/${meeting.id_meeting}`)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F3F4F6" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 24,
  },
  page: { fontSize: 32, fontWeight: "800", color: "#111827" },
  searchBar: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  group: { marginBottom: 26 },
  groupTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 14 },
  collapsibleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  meetingCard: { backgroundColor: "#fff", borderRadius: 22, padding: 18, marginBottom: 14 },
  meetingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meetingTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827", marginRight: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontWeight: "700", fontSize: 12, textTransform: "capitalize" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  metaText: { marginLeft: 8, color: "#6B7280", fontSize: 13 },
  notificationBtn: {
    position: "relative",
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF4D4F",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});