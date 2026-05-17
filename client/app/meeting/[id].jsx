import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  meetingAPI,
  agendaAPI,
  voteAPI,
  draftAPI,
  pvAPI,
  authAPI,
} from "../../services/api";

const TABS = [
  "Agenda",
  "Votes",
  "Attendance",
  "Draft",
  "PV",
];

function SectionTab({
  tabs,
  active,
  onPress,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      style={styles.tabBar}
      contentContainerStyle={
        styles.tabBarContent
      }
    >
      {tabs.map((t) => (
        <TouchableOpacity
          key={t}
          style={[
            styles.tab,
            active === t &&
              styles.tabActive,
          ]}
          onPress={() => onPress(t)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              active === t &&
                styles.tabTextActive,
            ]}
          >
            {t}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function EmptyState({
  icon,
  text,
}) {
  return (
    <View style={styles.emptyBox}>
      <View
        style={styles.emptyIconWrap}
      >
        <Ionicons
          name={icon}
          size={34}
          color="#9CA3AF"
        />
      </View>

      <Text style={styles.emptyTxt}>
        {text}
      </Text>
    </View>
  );
}

export default function MeetingDetail() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams();

  const [meeting, setMeeting] =
    useState(null);

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("Agenda");

  async function load() {
    try {
      const [
        meetingRes,
        userRes,
      ] = await Promise.all([
        meetingAPI.getOne(id),
        authAPI.me(),
      ]);

      setMeeting(meetingRes.data);

      setCurrentUser(userRes.data);
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to load meeting."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const onRefresh =
    useCallback(() => {
      setRefreshing(true);
      load();
    }, []);

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

  if (!meeting) {
    return (
      <View style={styles.centered}>
        <Text
          style={styles.notFoundTxt}
        >
          Meeting not found
        </Text>
      </View>
    );
  }

  const committee =
    meeting.committee ||
    meeting.Committee;

  const isPresident =
    currentUser?.is_admin ||
    committee?.president_id ===
      currentUser?.id_user ||
    meeting.president_id ===
      currentUser?.id_user;

  const STATUS_COLORS = {
    scheduled: "#3B82F6",
    ongoing: "#22C55E",
    completed: "#6B7280",
    cancelled: "#EF4444",
  };

  const date = meeting.timing
    ? new Date(meeting.timing)
    : null;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={
        styles.detailContainer
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
      {/* BACK */}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() =>
          router.back()
        }
      >
        <Ionicons
          name="arrow-back"
          size={22}
          color="#111827"
        />
      </TouchableOpacity>

      {/* HEADER */}

      <View style={styles.meetingHeader}>
        <View
          style={
            styles.meetingHeaderTop
          }
        >
          <Text
            style={
              styles.meetingDetailTitle
            }
          >
            {meeting.title}
          </Text>

          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  STATUS_COLORS[
                    meeting.status
                  ] ||
                  "#6B7280",
              },
            ]}
          />
        </View>

        <Text
          style={
            styles.meetingDetailCommittee
          }
        >
          {committee?.name || ""}
        </Text>

        <Text
          style={
            styles.meetingDetailDate
          }
        >
          {date
            ? date.toLocaleDateString(
                [],
                {
                  weekday:
                    "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )
            : ""}
        </Text>

        <Text
          style={
            styles.meetingDetailDate
          }
        >
          {date
            ? date.toLocaleTimeString(
                [],
                {
                  hour:
                    "2-digit",
                  minute:
                    "2-digit",
                }
              )
            : ""}
        </Text>

        {!!meeting.site && (
          <View
            style={
              styles.locationRow
            }
          >
            <Ionicons
              name="location-outline"
              size={15}
              color="#6B7280"
            />

            <Text
              style={
                styles.meetingLocation
              }
            >
              {meeting.site}
            </Text>
          </View>
        )}
      </View>

      {/* STATUS */}

      {isPresident && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={
            styles.statusActions
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 10,
          }}
        >
          {[
            "scheduled",
            "ongoing",
            "completed",
            "cancelled",
          ].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusActionBtn,
                meeting.status ===
                  s &&
                  styles.statusActionBtnActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.statusActionTxt,
                  meeting.status ===
                    s &&
                    styles.statusActionTxtActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.deleteBtn}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="#DC2626"
            />

            <Text
              style={
                styles.deleteBtnTxt
              }
            >
              Delete
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* TABS */}

      <SectionTab
        tabs={TABS}
        active={activeTab}
        onPress={setActiveTab}
      />

      {/* CONTENT */}

      <View style={styles.tabContent}>
        {activeTab ===
          "Agenda" && (
          <EmptyState
            icon="document-text-outline"
            text="No agenda points"
          />
        )}

        {activeTab ===
          "Votes" && (
          <EmptyState
            icon="bar-chart-outline"
            text="No votes available"
          />
        )}

        {activeTab ===
          "Attendance" && (
          <View
            style={
              styles.attendanceCard
            }
          >
            <View
              style={
                styles.attendanceIcon
              }
            >
              <Ionicons
                name="people-outline"
                size={28}
                color="#4F46E5"
              />
            </View>

            <Text
              style={
                styles.attendanceTitle
              }
            >
              Attendance
            </Text>

            <TouchableOpacity
              style={
                styles.confirmBtn
              }
            >
              <Text
                style={
                  styles.confirmBtnTxt
                }
              >
                Confirm Attendance
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab ===
          "Draft" && (
          <EmptyState
            icon="create-outline"
            text="No draft notes"
          />
        )}

        {activeTab === "PV" && (
          <EmptyState
            icon="clipboard-outline"
            text="No PV generated"
          />
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

  detailContainer: {
    paddingBottom: 80,
  },

  notFoundTxt: {
    fontSize: 16,
    color: "#6B7280",
  },

  backBtn: {
    marginTop: 24,
    marginHorizontal: 20,

    width: 46,
    height: 46,

    borderRadius: 16,

    backgroundColor: "#fff",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  meetingHeader: {
    marginHorizontal: 20,
    marginTop: 16,

    backgroundColor: "#fff",

    borderRadius: 26,

    padding: 22,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  meetingHeaderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  meetingDetailTitle: {
    flex: 1,

    fontSize: 28,
    fontWeight: "800",

    color: "#111827",

    lineHeight: 34,

    letterSpacing: -0.8,
  },

  statusDot: {
    width: 12,
    height: 12,

    borderRadius: 6,

    marginTop: 10,
    marginLeft: 12,
  },

  meetingDetailCommittee: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "700",
    marginTop: 10,
  },

  meetingDetailDate: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 20,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  meetingLocation: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
  },

  statusActions: {
    marginTop: 22,
  },

  statusActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,

    borderRadius: 999,

    backgroundColor: "#fff",

    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statusActionBtnActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },

  statusActionTxt: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  statusActionTxtActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",

    gap: 6,

    paddingHorizontal: 16,
    paddingVertical: 10,

    borderRadius: 999,

    backgroundColor: "#FEF2F2",
  },

  deleteBtnTxt: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },

  tabBar: {
    marginTop: 26,
  },

  tabBarContent: {
    paddingHorizontal: 20,
    gap: 10,
  },

  tab: {
    paddingHorizontal: 18,
    paddingVertical: 12,

    borderRadius: 14,

    backgroundColor: "#fff",
  },

  tabActive: {
    backgroundColor: "#4F46E5",
  },

  tabText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  emptyBox: {
    alignItems: "center",

    backgroundColor: "#fff",

    borderRadius: 22,

    paddingVertical: 50,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  emptyIconWrap: {
    width: 76,
    height: 76,

    borderRadius: 24,

    backgroundColor: "#F3F4F6",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 18,
  },

  emptyTxt: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },

  attendanceCard: {
    backgroundColor: "#fff",

    borderRadius: 22,

    padding: 28,

    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  attendanceIcon: {
    width: 72,
    height: 72,

    borderRadius: 22,

    backgroundColor: "#EEF2FF",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 18,
  },

  attendanceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },

  confirmBtn: {
    backgroundColor: "#4F46E5",

    borderRadius: 16,

    paddingHorizontal: 26,
    paddingVertical: 14,
  },

  confirmBtnTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});