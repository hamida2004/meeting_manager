import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  Modal, TextInput, Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { meetingAPI, committeeAPI } from "../../../services/api";

const STATUS_COLORS = {
  scheduled: { bg: "#EFF6FF", text: "#3B82F6" },
  ongoing:   { bg: "#F0FDF4", text: "#22C55E" },
  completed: { bg: "#F9FAFB", text: "#6B7280" },
  cancelled: { bg: "#FEF2F2", text: "#EF4444" },
};

function MeetingRow({ meeting, onPress }) {
  const status = meeting.status || "scheduled";
  const color  = STATUS_COLORS[status] || STATUS_COLORS.scheduled;
  // FIX: API field is `timing`, not `date`
  const date   = meeting.timing ? new Date(meeting.timing) : null;
  return (
    <TouchableOpacity style={styles.meetingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.meetingRowLeft}>
        <Text style={styles.meetingRowTitle} numberOfLines={1}>{meeting.title}</Text>
        <Text style={styles.meetingRowDate}>
          {date ? date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : ""}
          {date ? "  " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: color.bg }]}>
        <Text style={[styles.statusTxt, { color: color.text }]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CommitteeGroup({ group, onMeetingPress }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={styles.group}>
      <TouchableOpacity style={styles.groupHeader} onPress={() => setExpanded((e) => !e)} activeOpacity={0.8}>
        <Text style={styles.groupName}>{group.committee?.name || "Committee"}</Text>
        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.groupBody}>
          {(group.meetings || []).length === 0 ? (
            <Text style={styles.noMeetings}>No meetings</Text>
          ) : (
            group.meetings.map((m) => (
              <MeetingRow
                key={m.id_meeting}
                meeting={m}
                onPress={() => onMeetingPress(m.id_meeting)}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function Meetings() {
  const router = useRouter();
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create meeting form
  // FIX: form key renamed from `date` to `timing` to match the API body
  const [committees, setCommittees] = useState([]);
  const [form, setForm] = useState({ title: "", timing: "", committee_id: "" });
  const [creating, setCreating]     = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function load() {
    try {
      const { data } = await meetingAPI.getGrouped();
      setGroups(data || []);
    } catch {
      Alert.alert("Error", "Could not load meetings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadCommittees() {
    try {
      const { data } = await committeeAPI.getMine();
      setCommittees(data || []);
    } catch {}
  }

  useEffect(() => { load(); loadCommittees(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  async function handleCreate() {
    if (!form.title.trim() || !form.timing.trim() || !form.committee_id) {
      Alert.alert("Error", "Fill in title, date/time, and select a committee.");
      return;
    }
    setCreating(true);
    try {
      await meetingAPI.create({
        title:        form.title.trim(),
        // FIX: API expects `timing`, not `date`
        timing:       form.timing.trim(),
        committee_id: form.committee_id,
      });
      setShowCreate(false);
      setForm({ title: "", timing: "", committee_id: "" });
      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Could not create meeting.");
    } finally {
      setCreating(false);
    }
  }

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
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Meetings</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No meetings yet</Text>
            <Text style={styles.emptyMsg}>Create your first meeting above.</Text>
          </View>
        ) : (
          groups.map((g, i) => (
            <CommitteeGroup
              key={g.committee?.id_committee || i}
              group={g}
              onMeetingPress={(id) => router.push(`/meeting/${id}`)}
            />
          ))
        )}
      </ScrollView>

      {/* Create Meeting Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Meeting</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Meeting title"
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={set("title")}
            />

            {/* FIX: field renamed to timing */}
            <Text style={styles.label}>Date & Time (ISO)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-06-01T10:00:00"
              placeholderTextColor="#9CA3AF"
              value={form.timing}
              onChangeText={set("timing")}
            />

            <Text style={styles.label}>Committee</Text>
            <ScrollView style={styles.committeeList} nestedScrollEnabled>
              {committees.map((c) => (
                <TouchableOpacity
                  key={c.id_committee}
                  style={[
                    styles.committeeOption,
                    form.committee_id === c.id_committee && styles.committeeSelected,
                  ]}
                  onPress={() => set("committee_id")(c.id_committee)}
                >
                  <Text
                    style={[
                      styles.committeeOptionText,
                      form.committee_id === c.id_committee && styles.committeeSelectedText,
                    ]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreate(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, creating && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: "#F9FAFB" },
  centered:  { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

  pageHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 24,
  },
  pageTitle:   { fontSize: 26, fontWeight: "800", color: "#111827", letterSpacing: -0.5 },
  createBtn:   { backgroundColor: "#4F46E5", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  group: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 16,
    backgroundColor: "#F5F3FF",
  },
  groupName: { fontSize: 15, fontWeight: "700", color: "#4F46E5", flex: 1 },
  chevron:   { fontSize: 12, color: "#4F46E5", marginLeft: 8 },
  groupBody: { paddingHorizontal: 4 },
  noMeetings: { padding: 16, color: "#9CA3AF", fontSize: 13, textAlign: "center" },

  meetingRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "#F3F4F6",
  },
  meetingRowLeft:  { flex: 1, marginRight: 8 },
  meetingRowTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
  meetingRowDate:  { fontSize: 12, color: "#6B7280" },
  statusPill:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt:       { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", marginBottom: 4 },
  emptyMsg:   { fontSize: 14, color: "#9CA3AF" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 20 },
  label:      { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#F3F4F6", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#111827",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  committeeList: { maxHeight: 120, marginTop: 4 },
  committeeOption: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 8, marginBottom: 4,
    backgroundColor: "#F3F4F6",
  },
  committeeSelected:     { backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#4F46E5" },
  committeeOptionText:   { fontSize: 14, color: "#374151" },
  committeeSelectedText: { color: "#4F46E5", fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", backgroundColor: "#F3F4F6",
  },
  cancelBtnText: { color: "#374151", fontWeight: "600", fontSize: 15 },
  submitBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", backgroundColor: "#4F46E5",
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnDisabled:   { opacity: 0.6 },
});
