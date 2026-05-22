import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  authAPI,
  userAPI,
  committeeAPI,
  meetingAPI,
} from "../../../services/api";

function Card({
  title,
  subtitle,
  icon,
  color,
  stats,
  onPress,
}) {

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor:
              color.bg,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={color.text}
        />
      </View>

      <View style={styles.cardBody}>

        <Text style={styles.title}>
          {title}
        </Text>

        <Text
          style={styles.subtitle}
        >
          {subtitle}
        </Text>

        {stats !== undefined && (
          <View
            style={
              styles.statsBadge
            }
          >
            <Text
              style={
                styles.statsText
              }
            >
              {stats}
            </Text>
          </View>
        )}

      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9CA3AF"
      />

    </TouchableOpacity>
  );
}

function StatCard({
  title,
  value,
  icon,
}) {

  return (
    <View style={styles.statCard}>

      <View
        style={styles.statIconWrap}
      >
        <Ionicons
          name={icon}
          size={20}
          color="#4F46E5"
        />
      </View>

      <Text style={styles.statNum}>
        {value}
      </Text>

      <Text
        style={styles.statTitle}
      >
        {title}
      </Text>

    </View>
  );
}

export default function Manage() {

  const router =
    useRouter();

  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState({
      users: 0,
      admins: 0,
      committees: 0,
      meetings: 0,
    });

  const [user, setUser] =
    useState(null);

  async function load() {

    try {

      const [
        meRes,
        usersRes,
        committeesRes,
        meetingsRes,
      ] = await Promise.all([
        authAPI.me(),
        userAPI.getAll(),
        committeeAPI.getAll(),
        meetingAPI.getGrouped(),
      ]);

      const users =
        usersRes.data || [];

      const committees =
        committeesRes.data || [];

      const groupedMeetings =
        meetingsRes.data || [];

      const meetings =
        groupedMeetings.flatMap(
          (g) =>
            g.meetings || []
        );

      setUser(meRes.data);

      setStats({
        users: users.length,

        admins:
          users.filter(
            (u) => u.is_admin
          ).length,

        committees:
          committees.length,

        meetings:
          meetings.length,
      });

    } catch (err) {

      console.log(err);

      Alert.alert(
        "Error",
        err?.response?.data
          ?.msg ||
          "Failed to load dashboard."
      );

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View
        style={
          styles.centered
        }
      >
        <ActivityIndicator
          size="large"
          color="#4F46E5"
        />
      </View>
    );
  }

  // backend admin protection
  if (!user?.is_admin) {
    return (
      <View
        style={
          styles.deniedContainer
        }
      >

        <View
          style={
            styles.deniedIconWrap
          }
        >
          <Ionicons
            name="lock-closed"
            size={42}
            color="#DC2626"
          />
        </View>

        <Text
          style={
            styles.deniedTitle
          }
        >
          Access Denied
        </Text>

        <Text
          style={
            styles.deniedText
          }
        >
          Administrator privileges required.
        </Text>

      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >

      {/* HEADER */}

      <View style={styles.header}>

        <View>

          <Text
            style={
              styles.headerSmall
            }
          >
            Administration
          </Text>

          <Text style={styles.page}>
            Management
          </Text>

        </View>

        <View
          style={
            styles.adminBadge
          }
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color="#fff"
          />

          <Text
            style={
              styles.adminBadgeTxt
            }
          >
            ADMIN
          </Text>
        </View>

      </View>

      {/* STATS */}

      <View style={styles.statsGrid}>

        <StatCard
          title="Users"
          value={stats.users}
          icon="people"
        />

        <StatCard
          title="Admins"
          value={stats.admins}
          icon="shield-checkmark"
        />

        <StatCard
          title="Committees"
          value={stats.committees}
          icon="layers"
        />

        <StatCard
          title="Meetings"
          value={stats.meetings}
          icon="calendar"
        />

      </View>

      {/* MANAGEMENT */}

      <Text style={styles.section}>
        Management Sections
      </Text>

      <Card
        title="Users"
        subtitle="Manage users, roles and administrator permissions"
        icon="people-outline"
        stats={`${stats.users} users`}
        color={{
          bg: "#EEF2FF",
          text: "#4F46E5",
        }}
        onPress={() =>
          router.push(
            "/(tabs)/(Manage)/users"
          )
        }
      />

      <Card
        title="Committees"
        subtitle="Manage committees, members and presidents"
        icon="layers-outline"
        stats={`${stats.committees} committees`}
        color={{
          bg: "#ECFDF5",
          text: "#059669",
        }}
        onPress={() =>
          router.push(
            "/(tabs)/(Manage)/committees"
          )
        }
      />

      <Card
        title="Meetings"
        subtitle="Manage meetings, voting and attendance"
        icon="calendar-outline"
        stats={`${stats.meetings} meetings`}
        color={{
          bg: "#FEF2F2",
          text: "#DC2626",
        }}
        onPress={() =>
          router.push(
            "/(tabs)/(Manage)/meetings"
          )
        }
      />

      {/* QUICK ACTIONS */}

      <Text style={styles.section}>
        Quick Actions
      </Text>

      <View style={styles.quickGrid}>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() =>
            router.push(
              "/(tabs)/(Manage)/users"
            )
          }
        >
          <Ionicons
            name="person-add-outline"
            size={26}
            color="#4F46E5"
          />

          <Text
            style={
              styles.quickTitle
            }
          >
            Manage Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() =>
            router.push(
              "/(tabs)/(Manage)/committees"
            )
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={26}
            color="#059669"
          />

          <Text
            style={
              styles.quickTitle
            }
          >
            Committees
          </Text>
        </TouchableOpacity>

      </View>

    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor:
        "#F3F4F6",
    },

    centered: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#F3F4F6",
    },

    container: {
      padding: 20,
      paddingTop: 60,
      paddingBottom: 40,
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 28,
    },

    headerSmall: {
      color: "#6B7280",
      fontSize: 13,
      fontWeight: "500",
    },

    page: {
      fontSize: 32,
      fontWeight: "800",
      color: "#111827",
      marginTop: 2,
    },

    adminBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor:
        "#111827",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },

    adminBadgeTxt: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 11,
    },

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
      marginBottom: 30,
    },

    statCard: {
      width: "48%",
      backgroundColor:
        "#fff",
      borderRadius: 24,
      padding: 18,
      marginBottom: 14,
    },

    statIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor:
        "#EEF2FF",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginBottom: 16,
    },

    statNum: {
      fontSize: 28,
      fontWeight: "800",
      color: "#111827",
    },

    statTitle: {
      marginTop: 4,
      fontSize: 13,
      color: "#6B7280",
    },

    section: {
      fontSize: 18,
      fontWeight: "800",
      color: "#111827",
      marginBottom: 14,
      marginTop: 6,
    },

    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#fff",
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
    },

    iconWrap: {
      width: 54,
      height: 54,
      borderRadius: 18,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 16,
    },

    cardBody: {
      flex: 1,
    },

    title: {
      fontSize: 17,
      fontWeight: "700",
      color: "#111827",
    },

    subtitle: {
      fontSize: 13,
      color: "#6B7280",
      marginTop: 4,
      lineHeight: 18,
    },

    statsBadge: {
      alignSelf:
        "flex-start",
      marginTop: 10,
      backgroundColor:
        "#F3F4F6",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    statsText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#6B7280",
    },

    quickGrid: {
      flexDirection: "row",
      gap: 14,
      marginTop: 4,
    },

    quickCard: {
      flex: 1,
      backgroundColor:
        "#fff",
      borderRadius: 22,
      paddingVertical: 24,
      alignItems:
        "center",
    },

    quickTitle: {
      marginTop: 12,
      fontWeight: "700",
      color: "#111827",
    },

    deniedContainer: {
      flex: 1,
      backgroundColor:
        "#F3F4F6",
      justifyContent:
        "center",
      alignItems:
        "center",
      padding: 24,
    },

    deniedIconWrap: {
      width: 92,
      height: 92,
      borderRadius: 28,
      backgroundColor:
        "#FEF2F2",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginBottom: 24,
    },

    deniedTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: "#111827",
    },

    deniedText: {
      marginTop: 8,
      color: "#6B7280",
      fontSize: 15,
    },
  });