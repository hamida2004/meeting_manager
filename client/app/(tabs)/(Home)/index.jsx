import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  useRouter,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  meetingAPI,
  notificationAPI,
  authAPI,
} from "../../../services/api";

const STATUS_COLORS = {
  scheduled: {
    bg: "#EEF2FF",
    text: "#4F46E5",
  },

  ongoing: {
    bg: "#ECFDF5",
    text: "#059669",
  },

  completed: {
    bg: "#F3F4F6",
    text: "#6B7280",
  },

  cancelled: {
    bg: "#FEF2F2",
    text: "#DC2626",
  },
};

function MeetingCard({
  meeting,
  onPress,
}) {
  const status =
    meeting.status || "scheduled";

  const color =
    STATUS_COLORS[status] ||
    STATUS_COLORS.scheduled;

  const date = meeting.timing
    ? new Date(meeting.timing)
    : null;

  return (
    <TouchableOpacity
      style={styles.meetingCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.meetingCardLeft}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>
            {date
              ? date.getDate()
              : "--"}
          </Text>

          <Text style={styles.dateMon}>
            {date
              ? date.toLocaleString(
                  "default",
                  {
                    month: "short",
                  }
                )
              : ""}
          </Text>
        </View>
      </View>

      <View style={styles.meetingCardBody}>
        <Text
          style={styles.meetingTitle}
          numberOfLines={1}
        >
          {meeting.title ||
            "Untitled"}
        </Text>

        <Text
          style={
            styles.meetingCommittee
          }
          numberOfLines={1}
        >
          {meeting.committee?.name ||
            meeting.Committee?.name ||
            ""}
        </Text>

        <View style={styles.timeRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color="#9CA3AF"
          />

          <Text
            style={styles.meetingTime}
          >
            {date
              ? date.toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  }
                )
              : ""}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor:
              color.bg,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color:
                color.text,
            },
          ]}
        >
          {status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function NotifItem({
  notif,
  onRead,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.notifItem,
        !notif.is_read &&
          styles.notifUnread,
      ]}
      onPress={() =>
        onRead(
          notif.id_notification
        )
      }
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.notifIconWrap,
          notif.is_read &&
            styles.notifIconWrapRead,
        ]}
      >
        <Ionicons
          name={
            notif.is_read
              ? "mail-open-outline"
              : "notifications"
          }
          size={18}
          color={
            notif.is_read
              ? "#6B7280"
              : "#4F46E5"
          }
        />
      </View>

      <View style={styles.notifBody}>
        <Text
          style={[
            styles.notifMsg,
            notif.is_read &&
              styles.notifMsgRead,
          ]}
          numberOfLines={2}
        >
          {notif.content}
        </Text>

        <View
          style={styles.notifTimeRow}
        >
          <Ionicons
            name="time-outline"
            size={12}
            color="#9CA3AF"
          />

          <Text
            style={
              styles.notifTime
            }
          >
            {notif.createdAt
              ? new Date(
                  notif.createdAt
                ).toLocaleString()
              : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();

  const [user, setUser] =
    useState(null);

  const [meetings, setMeetings] =
    useState([]);

  const [notifs, setNotifs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  async function loadAll() {
    try {
      const [
        meRes,
        notifRes,
        meUser,
      ] = await Promise.all([
        meetingAPI.getMine(),
        notificationAPI.getAll(),
        authAPI.me(),
      ]);

      const sorted = (
        meRes.data || []
      )
        .map((m) => m.Meeting || m)
        .filter(
          (m) =>
            m.status !==
              "cancelled" &&
            m.status !==
              "completed"
        )
        .sort(
          (a, b) =>
            new Date(a.timing) -
            new Date(b.timing)
        );

      setMeetings(
        sorted.slice(0, 5)
      );

      setNotifs(
        (notifRes.data || []).slice(
          0,
          5
        )
      );

      setUser(meUser.data);
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to load data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const onRefresh =
    useCallback(() => {
      setRefreshing(true);
      loadAll();
    }, []);

  async function markRead(id) {
    try {
      await notificationAPI.markRead(
        id
      );

      setNotifs((n) =>
        n.map((x) =>
          x.id_notification === id
            ? {
                ...x,
                is_read: true,
              }
            : x
        )
      );
    } catch {}
  }

  async function markAllRead() {
    try {
      await notificationAPI.markAllRead();

      setNotifs((n) =>
        n.map((x) => ({
          ...x,
          is_read: true,
        }))
      );
    } catch {}
  }

  const unreadCount =
    notifs.filter(
      (n) => !n.is_read
    ).length;

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
    <ScrollView
      style={styles.flex}
      contentContainerStyle={
        styles.container
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text
            style={styles.greeting}
          >
            Welcome back
          </Text>

          <Text
            style={styles.userName}
          >
            {user?.full_name ||
              "User"}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.notificationBtn
          }
          onPress={() =>
            router.push(
              "/(tabs)/(Profile)/Notifications"
            )
          }
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color="#111827"
          />

          {unreadCount > 0 && (
            <View
              style={
                styles.notificationBadge
              }
            >
              <Text
                style={
                  styles.notificationBadgeText
                }
              >
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* STATS */}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View
            style={
              styles.statIconWrap
            }
          >
            <Ionicons
              name="calendar"
              size={20}
              color="#4F46E5"
            />
          </View>

          <Text
            style={styles.statNum}
          >
            {meetings.length}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Upcoming Meetings
          </Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconWrap,
              {
                backgroundColor:
                  "#ECFDF5",
              },
            ]}
          >
            <Ionicons
              name="notifications"
              size={20}
              color="#059669"
            />
          </View>

          <Text
            style={styles.statNum}
          >
            {unreadCount}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Unread Notifications
          </Text>
        </View>
      </View>

      {/* MEETINGS */}

      <View style={styles.section}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Upcoming Meetings
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push(
                "/(tabs)/(Meetings)"
              )
            }
          >
            <Text
              style={styles.seeAll}
            >
              See all
            </Text>
          </TouchableOpacity>
        </View>

        {meetings.length === 0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIconWrap
              }
            >
              <Ionicons
                name="calendar-outline"
                size={34}
                color="#9CA3AF"
              />
            </View>

            <Text
              style={
                styles.emptyText
              }
            >
              No upcoming meetings
            </Text>
          </View>
        ) : (
          meetings.map((m) => (
            <MeetingCard
              key={m.id_meeting}
              meeting={m}
              onPress={() =>
                router.push(
                  `/meeting/${m.id_meeting}`
                )
              }
            />
          ))
        )}
      </View>

      {/* NOTIFICATIONS */}

      <View style={styles.section}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Notifications
          </Text>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={
                markAllRead
              }
            >
              <Text
                style={
                  styles.seeAll
                }
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {notifs.length === 0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIconWrap
              }
            >
              <Ionicons
                name="notifications-off-outline"
                size={34}
                color="#9CA3AF"
              />
            </View>

            <Text
              style={
                styles.emptyText
              }
            >
              No notifications
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.notifList
            }
          >
            {notifs.map((n) => (
              <NotifItem
                key={
                  n.id_notif
                }
                notif={n}
                onRead={markRead}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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

  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  greeting: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  userName: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
    letterSpacing: -0.6,
  },

  notificationBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,

    backgroundColor: "#fff",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,

    minWidth: 18,
    height: 18,
    borderRadius: 9,

    backgroundColor: "#EF4444",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 4,
  },

  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,

    backgroundColor: "#fff",

    borderRadius: 22,

    paddingVertical: 22,
    paddingHorizontal: 18,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,

    backgroundColor: "#EEF2FF",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 14,
  },

  statNum: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },

  section: {
    marginBottom: 30,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  seeAll: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "700",
  },

  meetingCard: {
    backgroundColor: "#fff",

    borderRadius: 20,

    padding: 16,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 12,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  meetingCardLeft: {
    marginRight: 14,
  },

  dateBox: {
    width: 58,
    height: 64,

    backgroundColor: "#EEF2FF",

    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",
  },

  dateDay: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4F46E5",
  },

  dateMon: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "700",
    textTransform:
      "uppercase",
  },

  meetingCardBody: {
    flex: 1,
  },

  meetingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  meetingCommittee: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  meetingTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 6,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,

    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform:
      "capitalize",
  },

  emptyCard: {
    backgroundColor: "#fff",

    borderRadius: 22,

    paddingVertical: 42,

    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,

    backgroundColor: "#F3F4F6",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 16,
  },

  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },

  notifList: {
    backgroundColor: "#fff",

    borderRadius: 22,

    overflow: "hidden",
  },

  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",

    padding: 16,

    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  notifUnread: {
    backgroundColor: "#F8FAFF",
  },

  notifIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,

    backgroundColor: "#EEF2FF",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 14,
  },

  notifIconWrapRead: {
    backgroundColor: "#F3F4F6",
  },

  notifBody: {
    flex: 1,
  },

  notifMsg: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
    fontWeight: "600",
  },

  notifMsgRead: {
    color: "#4B5563",
    fontWeight: "500",
  },

  notifTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  notifTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 5,
  },
});