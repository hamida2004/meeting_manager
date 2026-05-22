import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  TextInput, Modal,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { authAPI, userAPI } from "../../../services/api";

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ").slice(0, 2)
    .map((w) => w[0]).join("").toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    authAPI.me()
      .then(({ data }) => {
        setUser(data);
        // FIX: API returns full_name, not name
        setEditName(data?.full_name || "");
      })
      .catch(() => Alert.alert("Error", "Could not load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try { await authAPI.logout(); } catch {}
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("user");
          router.replace("/(auth)/Login");
        },
      },
    ]);
  }

  async function handleSave() {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      // FIX: API expects { full_name }, not { name }
      await userAPI.update(user.id_user, { full_name: editName.trim() });
      // FIX: update local state with full_name key
      setUser((u) => ({ ...u, full_name: editName.trim() }));
      setShowEdit(false);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const rows = [
    { icon: "📧", label: "Email",   value: user?.email },
    { icon: "🏷️", label: "Role",    value: user?.is_admin ? "Administrator" : "Member" },
    { icon: "🆔", label: "User ID", value: user?.id_user },
  ];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerBg}>
        {/* FIX: use full_name */}
        <Avatar name={user?.full_name} />
        <Text style={styles.name}>{user?.full_name || "User"}</Text>
        {user?.is_admin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}
      </View>

      {/* Info card */}
      <View style={styles.card}>
        {rows.map(({ icon, label, value }) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoIcon}>{icon}</Text>
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value ?? "—"}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionRow} onPress={() => setShowEdit(true)}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionText}>Edit Name</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push("/(auth)/ResetPwd")}
        >
          <Text style={styles.actionIcon}>🔑</Text>
          <Text style={styles.actionText}>Change Password</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Edit Name Modal */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEdit(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:     { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { paddingBottom: 48 },

  headerBg: {
    backgroundColor: "#4F46E5",
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 36,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText:   { fontSize: 28, fontWeight: "800", color: "#fff" },
  name:         { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  adminBadge:   { marginTop: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  adminBadgeText: { fontSize: 12, color: "#fff", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 8,
    marginTop: -20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  infoRow:  { flexDirection: "row", alignItems: "center", padding: 14 },
  infoIcon: { fontSize: 20, marginRight: 14 },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", marginBottom: 2 },
  infoValue: { fontSize: 15, color: "#111827", fontWeight: "500" },

  actionsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 24,
  },
  actionRow: { flexDirection: "row", alignItems: "center", padding: 18 },
  actionIcon:    { fontSize: 20, marginRight: 14 },
  actionText:    { flex: 1, fontSize: 15, color: "#111827", fontWeight: "500" },
  actionChevron: { fontSize: 20, color: "#D1D5DB" },
  divider:       { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },

  logoutBtn: {
    marginHorizontal: 20,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: { color: "#EF4444", fontWeight: "700", fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 16 },
  input: {
    backgroundColor: "#F3F4F6", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#111827",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", backgroundColor: "#F3F4F6",
  },
  cancelBtnText: { color: "#374151", fontWeight: "600" },
  saveBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", backgroundColor: "#4F46E5",
  },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
});
