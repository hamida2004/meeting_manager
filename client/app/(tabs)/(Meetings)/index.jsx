import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Switch,
  Platform,
} from "react-native";

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import {
  meetingAPI,
  committeeAPI,
  notificationAPI,
} from "../../../services/api";

// ─────────────────────────────────────────────────────────────
// Status Colors
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  scheduled: { bg: "#EFF6FF", text: "#2563EB" },
  ongoing:   { bg: "#ECFDF5", text: "#059669" },
  closed:    { bg: "#F3F4F6", text: "#6B7280" },
  canceled:  { bg: "#FEF2F2", text: "#DC2626" },
};

// ─────────────────────────────────────────────────────────────
// Meeting Row
// ─────────────────────────────────────────────────────────────

function MeetingRow({ meeting, onPress }) {
  const status = meeting.status || "scheduled";
  const colors = STATUS_COLORS[status] || STATUS_COLORS.scheduled;

  let dateObj = null;
  try {
    if (meeting.timing) {
      const d = new Date(meeting.timing);
      if (!isNaN(d)) dateObj = d;
    }
  } catch (_) {}

  return (
    <TouchableOpacity
      style={styles.meetingRow}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.meetingLeft}>
        <Text style={styles.meetingTitle} numberOfLines={1}>
          {meeting.title}
        </Text>

        {dateObj ? (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.metaTxt}>
              {dateObj.toLocaleDateString()}{"  "}
              {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
            <Text style={[styles.metaTxt, { color: "#DC2626" }]}>Invalid Date</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <Ionicons
            name={meeting.meeting_type === "online" ? "globe-outline" : "business-outline"}
            size={14}
            color="#6B7280"
          />
          <Text style={styles.metaTxt}>
            {meeting.meeting_type === "online" ? "Online" : "Onsite"}
          </Text>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.statusTxt, { color: colors.text }]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// Committee Group
// ─────────────────────────────────────────────────────────────

function CommitteeGroup({ group, onMeetingPress }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.group}>
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={() => setExpanded((e) => !e)}
      >
        <Text style={styles.groupTitle}>
          {group.committee?.name || "Committee"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#4F46E5"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.groupBody}>
          {(group.meetings || []).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
              <Text style={styles.emptyTxt}>No meetings</Text>
            </View>
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

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function Meetings() {
  const router = useRouter();

  const [groups, setGroups]                     = useState([]);
  const [committees, setCommittees]             = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [creating, setCreating]                 = useState(false);
  const [showCreate, setShowCreate]             = useState(false);

  // ── Picker state ──────────────────────────────────────────
  //
  // Root cause of the crash: DateTimePickerAndroid uses an imperative
  // dismiss() call internally. On the New Architecture (Fabric), the native
  // picker ref is already torn down before dismiss() fires during unmount,
  // so pickers[mode] is undefined → crash.
  //
  // Fix: replace the imperative API entirely with <DateTimePicker> rendered
  // as a controlled React component inside our own Modal. React owns the
  // lifecycle so there is never a stale native ref to dismiss.
  //
  // Flow (Android):  tap button → date picker (mode="date") appears
  //                  → user confirms → mode switches to "time" in same modal
  //                  → user confirms → timing string saved, modal closes
  //
  // Flow (iOS):      same modal, spinner display, explicit "Next / Done" buttons
  // ─────────────────────────────────────────────────────────

  const [showPicker, setShowPicker]   = useState(false);
  const [pickerMode, setPickerMode]   = useState("date");   // "date" | "time"
  const [pickerDate, setPickerDate]   = useState(new Date());
  const [pendingDate, setPendingDate] = useState(null);     // confirmed date, awaiting time

  const [form, setForm] = useState({
    title:        "",
    timing:       "",
    committee_id: "",
    meeting_type: "onsite",
    site:         "",
    reporter_id:  null,
  });

  function set(key) {
    return (value) => setForm((f) => ({ ...f, [key]: value }));
  }

  // ─────────────────────────────────────────────────────────
  // Load Data
  // ─────────────────────────────────────────────────────────

  async function load() {
    try {
      const { data } = await meetingAPI.getGrouped();
      setGroups(data || []);
    } catch {
      Alert.alert("Error", "Failed to load meetings");
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

  async function loadCommitteeMembers(committeeId) {
    try {
      const { data } = await committeeAPI.getOne(committeeId);
      setCommitteeMembers(data.members || []);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load members");
    }
  }

  useEffect(() => {
    load();
    loadCommittees();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  // ─────────────────────────────────────────────────────────
  // Date Formatting
  // ─────────────────────────────────────────────────────────

  function formatDateTime(d) {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const h  = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${mo}-${da}T${h}:${mi}`;
  }

  // ─────────────────────────────────────────────────────────
  // Picker Handlers
  // ─────────────────────────────────────────────────────────

  function openDatePicker() {
    setPickerDate(new Date());
    setPendingDate(null);
    setPickerMode("date");
    setShowPicker(true);
  }

  function closePicker() {
    setShowPicker(false);
    setPendingDate(null);
  }

  // Called by <DateTimePicker onChange> on both platforms
  function onPickerChange(event, selected) {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        // Back button / outside tap — cancel
        closePicker();
        return;
      }

      // event.type === "set" means the user confirmed a value
      const chosen = selected || pickerDate;

      if (pickerMode === "date") {
        // Step 1 done: store the date and move to time
        setPendingDate(chosen);
        setPickerDate(chosen);
        setPickerMode("time");
        // The same modal stays open; only the mode prop changes
      } else {
        // Step 2 done: merge date + time and save
        const base  = pendingDate || pickerDate;
        const final = new Date(base);
        final.setHours(chosen.getHours());
        final.setMinutes(chosen.getMinutes());
        final.setSeconds(0);

        setPickerDate(final);
        setForm((prev) => ({ ...prev, timing: formatDateTime(final) }));
        closePicker();
      }
    } else {
      // iOS: spinner fires continuously while the user scrolls — just
      // keep pickerDate in sync; confirmation happens via the buttons below
      if (selected) setPickerDate(selected);
    }
  }

  // iOS-only: explicit "Next" / "Done" button
  function onIosConfirm() {
    if (pickerMode === "date") {
      setPendingDate(pickerDate);
      setPickerMode("time");
    } else {
      const base  = pendingDate || pickerDate;
      const final = new Date(base);
      final.setHours(pickerDate.getHours());
      final.setMinutes(pickerDate.getMinutes());
      final.setSeconds(0);

      setForm((prev) => ({ ...prev, timing: formatDateTime(final) }));
      closePicker();
    }
  }

  // ─────────────────────────────────────────────────────────
  // Create Meeting
  // ─────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!form.title.trim() || !form.timing || !form.committee_id) {
      Alert.alert("Error", "Please complete all required fields");
      return;
    }

    setCreating(true);

    try {
      await meetingAPI.create({
        title:        form.title.trim(),
        timing:       form.timing,
        committee_id: form.committee_id,
        meeting_type: form.meeting_type,
        site:         form.site.trim() || null,
        reporter_id:  form.reporter_id,
      });

      await notificationAPI.notifyCommittee({
        committee_id: form.committee_id,
        content: `A new meeting "${form.title}" has been scheduled.`,
      });

      if (form.reporter_id) {
        await notificationAPI.createNotification({
          id_user: form.reporter_id,
          content: `You have been assigned as the reporter for the meeting "${form.title}".`,
        });
      }

      setShowCreate(false);
      setForm({
        title: "", timing: "", committee_id: "",
        meeting_type: "onsite", site: "", reporter_id: null,
      });
      setCommitteeMembers([]);
      load();
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.msg || "Failed to create meeting"
      );
    } finally {
      setCreating(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar-outline" size={28} color="#111827" />
            <Text style={styles.pageTitle}>Meetings</Text>
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={56} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No meetings yet</Text>
            <Text style={styles.emptyMsg}>Create your first meeting</Text>
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

      {/* ── Date/Time Picker Modal ────────────────────────────────────────────
          We render <DateTimePicker> as a plain React component inside a Modal
          rather than calling DateTimePickerAndroid.open() imperatively.
          This eliminates the dismiss() crash on New Architecture / Fabric.
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>

            <Text style={styles.pickerTitle}>
              {pickerMode === "date" ? "Select Date" : "Select Time"}
            </Text>

            <DateTimePicker
              value={pickerDate}
              mode={pickerMode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={pickerMode === "date" ? new Date() : undefined}
              is24Hour
              onChange={onPickerChange}
              style={styles.picker}
            />

            {/* iOS requires explicit confirm buttons because the spinner
                does not auto-dismiss on selection */}
            {Platform.OS === "ios" && (
              <View style={styles.pickerActions}>
                <TouchableOpacity onPress={closePicker} style={styles.pickerCancelBtn}>
                  <Text style={styles.pickerCancelTxt}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onIosConfirm} style={styles.pickerConfirmBtn}>
                  <Text style={styles.pickerConfirmTxt}>
                    {pickerMode === "date" ? "Next →" : "Done"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

      {/* ── Create Meeting Modal ─────────────────────────────────────────── */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Meeting</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* Title */}
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Meeting title"
                value={form.title}
                onChangeText={set("title")}
              />

              {/* Date & Time */}
              <Text style={styles.label}>Date & Time</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={openDatePicker}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text style={{ marginLeft: 10, color: form.timing ? "#111827" : "#9CA3AF" }}>
                  {form.timing || "Select date & time"}
                </Text>
              </TouchableOpacity>

              {/* Site */}
              <Text style={styles.label}>Site</Text>
              <TextInput
                style={styles.input}
                placeholder="Room / URL"
                value={form.site}
                onChangeText={set("site")}
              />

              {/* Online Toggle */}
              <View style={styles.switchRow}>
                <Text style={styles.switchTxt}>Online Meeting</Text>
                <Switch
                  value={form.meeting_type === "online"}
                  onValueChange={(v) =>
                    set("meeting_type")(v ? "online" : "onsite")
                  }
                />
              </View>

              {/* Committees */}
              <Text style={styles.label}>Committee</Text>
              {committees.map((c) => (
                <TouchableOpacity
                  key={c.id_committee}
                  style={[
                    styles.option,
                    form.committee_id === c.id_committee && styles.optionSelected,
                  ]}
                  onPress={() => {
                    set("committee_id")(c.id_committee);
                    loadCommitteeMembers(c.id_committee);
                  }}
                >
                  <Text
                    style={[
                      styles.optionTxt,
                      form.committee_id === c.id_committee && styles.optionTxtSelected,
                    ]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Reporter */}
              {committeeMembers.length > 0 && (
                <>
                  <Text style={styles.label}>Reporter</Text>
                  {committeeMembers.map((member) => {
                    const user = member.user;
                    if (!user) return null;
                    return (
                      <TouchableOpacity
                        key={user.id_user}
                        style={[
                          styles.option,
                          form.reporter_id === user.id_user && styles.optionSelected,
                        ]}
                        onPress={() => set("reporter_id")(user.id_user)}
                      >
                        <Text
                          style={[
                            styles.optionTxt,
                            form.reporter_id === user.id_user && styles.optionTxtSelected,
                          ]}
                        >
                          {user.full_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, creating && styles.disabled]}
                disabled={creating}
                onPress={handleCreate}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitTxt}>Create Meeting</Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  createBtn: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  createBtnTxt: {
    color: "#fff",
    fontWeight: "700",
  },

  group: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 18,
    overflow: "hidden",
  },

  groupHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
  },

  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4F46E5",
  },

  groupBody: {
    paddingVertical: 6,
  },

  meetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },

  meetingLeft: {
    flex: 1,
    marginRight: 12,
  },

  meetingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  metaTxt: {
    fontSize: 12,
    color: "#6B7280",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusTxt: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  emptyContainer: {
    alignItems: "center",
    padding: 24,
  },

  emptyTxt: {
    marginTop: 8,
    color: "#9CA3AF",
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
  },

  emptyMsg: {
    marginTop: 8,
    color: "#9CA3AF",
  },

  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  pickerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
  },

  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },

  picker: {
    width: "100%",
  },

  pickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  pickerCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  pickerCancelTxt: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 15,
  },

  pickerConfirmBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },

  pickerConfirmTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Create Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111827",
  },

  dateBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  switchTxt: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  option: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },

  optionSelected: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#4F46E5",
  },

  optionTxt: {
    color: "#374151",
    fontWeight: "600",
  },

  optionTxtSelected: {
    color: "#4F46E5",
  },

  submitBtn: {
    marginTop: 26,
    backgroundColor: "#4F46E5",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  submitTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  disabled: {
    opacity: 0.6,
  },
});
