import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";

import {
  useState,
  useEffect,
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
} from "../../../services/api";

import {
  useAuth,
} from "../../../context/AuthContext";

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {initials}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}) {
  return (
    <View style={styles.infoRow}>
      <View
        style={styles.infoIconWrap}
      >
        <Ionicons
          name={icon}
          size={18}
          color="#4F46E5"
        />
      </View>

      <View style={styles.infoBody}>
        <Text
          style={styles.infoLabel}
        >
          {label}
        </Text>

        <Text
          style={styles.infoValue}
        >
          {value ?? "—"}
        </Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  onPress,
  danger = false,
}) {
  return (
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.actionIconWrap,

          danger &&
            styles.actionIconWrapDanger,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            danger
              ? "#DC2626"
              : "#4F46E5"
          }
        />
      </View>

      <Text
        style={[
          styles.actionText,

          danger &&
            styles.actionTextDanger,
        ]}
      >
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#9CA3AF"
      />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();

  const { logout } =
    useAuth();

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    showEdit,
    setShowEdit,
  ] = useState(false);

  const [editName, setEditName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    authAPI
      .me()
      .then(({ data }) => {
        setUser(data);

        setEditName(
          data?.full_name || ""
        );
      })
      .catch(() =>
        Alert.alert(
          "Error",
          "Could not load profile."
        )
      )
      .finally(() =>
        setLoading(false)
      );
  }, []);

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Sign Out",
          style: "destructive",

          onPress: async () => {
            try {
              // IMPORTANT:
              // Context handles everything
              await logout();

              // DO NOT navigate manually
              // Guard handles redirect
            } catch (err) {
              Alert.alert(
                "Error",
                "Could not sign out."
              );
            }
          },
        },
      ]
    );
  }

  async function handleSave() {
    if (!editName.trim())
      return;

    setSaving(true);

    try {
      await userAPI.update(
        user.id_user,
        {
          full_name:
            editName.trim(),
        }
      );

      setUser((u) => ({
        ...u,
        full_name:
          editName.trim(),
      }));

      setShowEdit(false);
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data
          ?.message ||
          "Could not update profile."
      );
    } finally {
      setSaving(false);
    }
  }

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
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
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
        </TouchableOpacity>

        <Avatar
          name={user?.full_name}
        />

        <Text style={styles.name}>
          {user?.full_name ||
            "User"}
        </Text>

        <Text style={styles.email}>
          {user?.email}
        </Text>

        {user?.is_admin && (
          <View
            style={
              styles.adminBadge
            }
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color="#fff"
            />

            <Text
              style={
                styles.adminBadgeText
              }
            >
              Administrator
            </Text>
          </View>
        )}
      </View>

      {/* INFO */}

      <View style={styles.card}>
        <Text
          style={
            styles.cardTitle
          }
        >
          Account Information
        </Text>

        <InfoRow
          icon="mail-outline"
          label="Email"
          value={user?.email}
        />

        <InfoRow
          icon="person-outline"
          label="Role"
          value={
            user?.is_admin
              ? "Administrator"
              : "Member"
          }
        />

        <InfoRow
          icon="finger-print-outline"
          label="User ID"
          value={user?.id_user}
        />
      </View>

      {/* ACTIONS */}

      <View style={styles.card}>
        <Text
          style={
            styles.cardTitle
          }
        >
          Settings
        </Text>

        <ActionRow
          icon="create-outline"
          title="Edit Name"
          onPress={() =>
            setShowEdit(true)
          }
        />

        <View
          style={styles.divider}
        />

        <ActionRow
          icon="key-outline"
          title="Change Password"
          onPress={() =>
            router.push(
              "/(auth)/ResetPwd"
            )
          }
        />

        <View
          style={styles.divider}
        />

        <ActionRow
          icon="log-out-outline"
          title="Sign Out"
          danger
          onPress={
            handleLogout
          }
        />
      </View>

      {/* MODAL */}

      <Modal
        visible={showEdit}
        transparent
        animationType="slide"
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={styles.modalCard}
          >
            <View
              style={
                styles.modalHandle
              }
            />

            <Text
              style={
                styles.modalTitle
              }
            >
              Edit Name
            </Text>

            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={
                setEditName
              }
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />

            <View
              style={
                styles.modalActions
              }
            >
              <TouchableOpacity
                style={
                  styles.cancelBtn
                }
                onPress={() =>
                  setShowEdit(false)
                }
              >
                <Text
                  style={
                    styles.cancelBtnText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,

                  saving &&
                    styles.btnDisabled,
                ]}
                onPress={
                  handleSave
                }
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveBtnText
                    }
                  >
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      alignItems: "center",
    },

    container: {
      paddingBottom: 40,
    },

    header: {
      backgroundColor:
        "#4F46E5",

      paddingTop: 30,
      paddingBottom: 40,

      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,

      alignItems: "center",

      marginBottom: 22,
    },

    notificationBtn: {
      position: "absolute",
      top: 28,
      right: 20,

      width: 48,
      height: 48,

      borderRadius: 16,

      backgroundColor:
        "#fff",

      justifyContent:
        "center",

      alignItems: "center",
    },

    avatar: {
      width: 92,
      height: 92,

      borderRadius: 46,

      backgroundColor:
        "rgba(255,255,255,0.18)",

      justifyContent:
        "center",

      alignItems: "center",

      borderWidth: 3,
      borderColor:
        "rgba(255,255,255,0.35)",

      marginBottom: 16,
    },

    avatarText: {
      fontSize: 30,
      fontWeight: "800",
      color: "#fff",
    },

    name: {
      fontSize: 26,
      fontWeight: "800",
      color: "#fff",

      letterSpacing: -0.5,
    },

    email: {
      marginTop: 6,

      fontSize: 14,
      color:
        "rgba(255,255,255,0.85)",
    },

    adminBadge: {
      flexDirection: "row",
      alignItems: "center",

      gap: 6,

      marginTop: 14,

      backgroundColor:
        "rgba(255,255,255,0.18)",

      paddingHorizontal: 14,
      paddingVertical: 8,

      borderRadius: 999,
    },

    adminBadgeText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 13,
    },

    card: {
      backgroundColor:
        "#fff",

      marginHorizontal: 20,

      borderRadius: 24,

      padding: 20,

      marginBottom: 18,

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
    },

    cardTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#111827",

      marginBottom: 18,
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",

      marginBottom: 18,
    },

    infoIconWrap: {
      width: 46,
      height: 46,

      borderRadius: 16,

      backgroundColor:
        "#EEF2FF",

      justifyContent:
        "center",

      alignItems: "center",

      marginRight: 14,
    },

    infoBody: {
      flex: 1,
    },

    infoLabel: {
      fontSize: 11,
      fontWeight: "700",

      color: "#9CA3AF",

      textTransform:
        "uppercase",

      marginBottom: 4,
    },

    infoValue: {
      fontSize: 15,
      color: "#111827",
      fontWeight: "600",
    },

    actionRow: {
      flexDirection: "row",
      alignItems: "center",

      paddingVertical: 16,
    },

    actionIconWrap: {
      width: 42,
      height: 42,

      borderRadius: 14,

      backgroundColor:
        "#EEF2FF",

      justifyContent:
        "center",

      alignItems: "center",

      marginRight: 14,
    },

    actionIconWrapDanger: {
      backgroundColor:
        "#FEF2F2",
    },

    actionText: {
      flex: 1,

      fontSize: 15,
      color: "#111827",
      fontWeight: "600",
    },

    actionTextDanger: {
      color: "#DC2626",
    },

    divider: {
      height: 1,
      backgroundColor:
        "#F3F4F6",
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        "rgba(0,0,0,0.4)",

      justifyContent:
        "flex-end",
    },

    modalCard: {
      backgroundColor:
        "#fff",

      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,

      padding: 24,
      paddingBottom: 40,
    },

    modalHandle: {
      width: 52,
      height: 5,

      borderRadius: 999,

      backgroundColor:
        "#D1D5DB",

      alignSelf: "center",

      marginBottom: 22,
    },

    modalTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#111827",

      marginBottom: 18,
    },

    input: {
      backgroundColor:
        "#F9FAFB",

      borderRadius: 16,

      paddingHorizontal: 16,
      paddingVertical: 14,

      fontSize: 15,
      color: "#111827",

      borderWidth: 1,
      borderColor: "#E5E7EB",
    },

    modalActions: {
      flexDirection: "row",

      gap: 12,

      marginTop: 24,
    },

    cancelBtn: {
      flex: 1,

      backgroundColor:
        "#F3F4F6",

      borderRadius: 16,

      paddingVertical: 15,

      alignItems: "center",
    },

    cancelBtnText: {
      color: "#374151",
      fontWeight: "700",
    },

    saveBtn: {
      flex: 1,

      backgroundColor:
        "#4F46E5",

      borderRadius: 16,

      paddingVertical: 15,

      alignItems: "center",
    },

    saveBtnText: {
      color: "#fff",
      fontWeight: "700",
    },

    btnDisabled: {
      opacity: 0.6,
    },
  });