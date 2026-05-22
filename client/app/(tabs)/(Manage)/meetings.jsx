import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Switch,
} from "react-native";

import {
  useEffect,
  useState,
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
  committeeAPI,
  notificationAPI,
} from "../../../services/api";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

const STATUS_COLORS = {
  scheduled: {
    bg: "#EEF2FF",
    text: "#4F46E5",
  },

  ongoing: {
    bg: "#ECFDF5",
    text: "#059669",
  },

  closed: {
    bg: "#F3F4F6",
    text: "#6B7280",
  },

  canceled: {
    bg: "#FEF2F2",
    text: "#DC2626",
  },
};

export default function Meetings() {
  const router = useRouter();

  const [groups, setGroups] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [date, setDate] = useState(new Date());
  
  const [form, setForm] = useState({
    title: "",
    site: "",
    timing: "",
    committee_id: "",
    meeting_type: "onsite",
    reporter_id: null,
  });

  // Format date for display
  function formatDateTime(d) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    
    return `${y}-${mo}-${da}T${h}:${mi}`;
  }

  // Date picker functions
  function openDatePicker() {
    DateTimePickerAndroid.open({
      value: date,
      mode: "date",
      minimumDate: new Date(),
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type === "dismissed" || !selectedDate) {
          return;
        }

        const updated = new Date(date);
        updated.setFullYear(selectedDate.getFullYear());
        updated.setMonth(selectedDate.getMonth());
        updated.setDate(selectedDate.getDate());
        
        setDate(updated);
        openTimePicker(updated);
      },
    });
  }

  function openTimePicker(currentDate) {
    DateTimePickerAndroid.open({
      value: currentDate || date,
      mode: "time",
      is24Hour: true,
      onChange: (event, selectedTime) => {
        if (event.type === "dismissed" || !selectedTime) {
          return;
        }

        const updated = new Date(currentDate || date);
        updated.setHours(selectedTime.getHours());
        updated.setMinutes(selectedTime.getMinutes());
        updated.setSeconds(0);
        
        setDate(updated);
        setForm(prev => ({
          ...prev,
          timing: formatDateTime(updated),
        }));
      },
    });
  }

  // Load committee members for a specific committee
  async function loadCommitteeMembers(committeeId) {
    try {
      const { data } = await committeeAPI.getOne(committeeId);
      const members = data.members || [];
      setCommitteeMembers(members);
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error",
        "Failed to load members"
      );
    }
  }

  // Load data
  async function load() {
    try {
      const [meetingsRes, committeesRes] = await Promise.all([
        meetingAPI.getGrouped(),
        committeeAPI.getAll(),
      ]);

      const grouped = meetingsRes.data || [];
      setGroups(grouped);
      setCommittees(committeesRes.data || []);
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error",
        err?.response?.data?.msg || "Failed to load meetings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      load();
      return;
    }

    // Search through flattened meetings
    const flat = groups.flatMap(g => 
      (g.meetings || []).map(m => ({
        ...m,
        committee: g.committee,
      }))
    );

    const q = search.toLowerCase();
    const filtered = flat.filter(m => 
      m.title?.toLowerCase().includes(q) || 
      m.committee?.name?.toLowerCase().includes(q)
    );

    // Re-group filtered meetings
    const filteredGroups = groups.map(group => ({
      ...group,
      meetings: group.meetings.filter(m => 
        m.title?.toLowerCase().includes(q) || 
        group.committee?.name?.toLowerCase().includes(q)
      )
    })).filter(group => group.meetings.length > 0);

    setGroups(filteredGroups);
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearch("");
    load();
  }, []);

  async function createMeeting() {
    if (!form.title.trim() || !form.timing.trim() || !form.committee_id) {
      Alert.alert(
        "Error",
        "Please fill all required fields."
      );
      return;
    }

    setCreating(true);
    try {
      await meetingAPI.create({
        title: form.title.trim(),
        site: form.site.trim() || null,
        timing: form.timing.trim(),
        committee_id: form.committee_id,
        meeting_type: form.meeting_type,
        reporter_id: form.reporter_id,
      });

      // Notify committee members about the new meeting
      await notificationAPI.notifyCommittee({
        committee_id: form.committee_id,
        content: `A new meeting "${form.title}" has been scheduled.`,
      });

      setCreateModal(false);
      setForm({
        title: "",
        site: "",
        timing: "",
        committee_id: "",
        meeting_type: "onsite",
        reporter_id: null,
      });
      setCommitteeMembers([]);
      load();
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.msg || "Could not create meeting."
      );
    } finally {
      setCreating(false);
    }
  }

  async function deleteMeeting(id) {
    Alert.alert(
      "Delete Meeting",
      "Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await meetingAPI.delete(id);
              load();
            } catch (err) {
              Alert.alert(
                "Error",
                err?.response?.data?.msg || "Could not delete meeting."
              );
            }
          },
        },
      ]
    );
  }

  async function changeStatus(id, status) {
    try {
      await meetingAPI.changeStatus(id, { status });
      
      // Notify meeting members about status changes
      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `The meeting status has been changed to "${status}".`,
      });
      
      load();
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.msg || "Could not update meeting."
      );
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
      <FlatList
        data={groups}
        keyExtractor={(item, index) => 
          item.committee?.id_committee?.toString() || index.toString()
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 140,
        }}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.page}>Meetings</Text>
              <TouchableOpacity 
                style={styles.addBtn} 
                onPress={() => setCreateModal(true)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addTxt}>New</Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH */}
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search meetings..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={42} color="#9CA3AF" />
            <Text style={styles.emptyTxt}>No meetings found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View key={item.committee?.id_committee}>
            <Text style={styles.groupTitle}>
              {item.committee?.name || "Committee"}
            </Text>
            
            {(item.meetings || []).map(meeting => {
              const status = STATUS_COLORS[meeting.status] || STATUS_COLORS.scheduled;
              const date = meeting.timing ? new Date(meeting.timing) : null;
              
              return (
                <TouchableOpacity
                  key={meeting.id_meeting}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/meeting/${meeting.id_meeting}`)}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{meeting.title}</Text>
                      <Text style={styles.committee}>
                        {item.committee?.name}
                      </Text>
                    </View>

                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: status.bg },
                    ]}>
                      <Text style={[
                        styles.statusTxt,
                        { color: status.text },
                      ]}>
                        {meeting.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.info}>
                    {date ? date.toLocaleString() : ""}
                  </Text>

                  <Text style={styles.info}>
                    {meeting.meeting_type === "online" ? "🌐 Online" : "🏢 Onsite"}
                  </Text>

                  {!!meeting.site && (
                    <Text style={styles.info}>📍 {meeting.site}</Text>
                  )}

                  <Text style={styles.info}>
                    Voting: {meeting.voting_state}
                  </Text>

                  {/* ACTIONS */}
                  <View style={styles.actions}>
                    {["scheduled", "ongoing", "closed", "canceled"].map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.smallBtn,
                          meeting.status === s && styles.smallBtnActive,
                        ]}
                        onPress={() => changeStatus(meeting.id_meeting, s)}
                      >
                        <Text style={[
                          styles.smallBtnTxt,
                          meeting.status === s && styles.smallBtnTxtActive,
                        ]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteMeeting(meeting.id_meeting)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />

      {/* CREATE MODAL */}
      <Modal
        visible={createModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Meeting</Text>
              <TouchableOpacity 
                onPress={() => {
                  setCreateModal(false);
                  setForm({
                    title: "",
                    site: "",
                    timing: "",
                    committee_id: "",
                    meeting_type: "onsite",
                    reporter_id: null,
                  });
                  setCommitteeMembers([]);
                }}
              >
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
                onChangeText={text => setForm(prev => ({ ...prev, title: text }))}
              />

              {/* Date */}
              <Text style={styles.label}>Date & Time</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={openDatePicker}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text style={{
                  marginLeft: 10,
                  color: form.timing ? "#111827" : "#9CA3AF",
                }}>
                  {form.timing || "Select date & time"}
                </Text>
              </TouchableOpacity>

              {/* Site */}
              <Text style={styles.label}>Site</Text>
              <TextInput
                style={styles.input}
                placeholder="Room / URL"
                value={form.site}
                onChangeText={text => setForm(prev => ({ ...prev, site: text }))}
              />

              {/* Online */}
              <View style={styles.switchRow}>
                <Text style={styles.switchTxt}>Online Meeting</Text>
                <Switch
                  value={form.meeting_type === "online"}
                  onValueChange={v => setForm(prev => ({ 
                    ...prev, 
                    meeting_type: v ? "online" : "onsite" 
                  }))}
                />
              </View>

              {/* Committees */}
              <Text style={styles.label}>Committee</Text>
              {committees.map(c => (
                <TouchableOpacity
                  key={c.id_committee}
                  style={[
                    styles.option,
                    form.committee_id === c.id_committee && styles.optionSelected,
                  ]}
                  onPress={() => {
                    setForm(prev => ({ ...prev, committee_id: c.id_committee }));
                    loadCommitteeMembers(c.id_committee);
                  }}
                >
                  <Text style={[
                    styles.optionTxt,
                    form.committee_id === c.id_committee && styles.optionTxtSelected,
                  ]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Reporter */}
              {committeeMembers.length > 0 && (
                <>
                  <Text style={styles.label}>Reporter</Text>
                  {committeeMembers.map(member => {
                    const user = member.user;
                    if (!user) return null;
                    
                    return (
                      <TouchableOpacity
                        key={user.id_user}
                        style={[
                          styles.option,
                          form.reporter_id === user.id_user && styles.optionSelected,
                        ]}
                        onPress={() => setForm(prev => ({ 
                          ...prev, 
                          reporter_id: user.id_user 
                        }))}
                      >
                        <Text style={[
                          styles.optionTxt,
                          form.reporter_id === user.id_user && styles.optionTxtSelected,
                        ]}>
                          {user.full_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Create */}
              <TouchableOpacity
                style={[styles.submitBtn, creating && styles.disabled]}
                disabled={creating}
                onPress={createMeeting}
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  page: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },

  addTxt: {
    color: "#fff",
    fontWeight: "700",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 22,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 10,
    color: "#111827",
  },

  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4F46E5",
    marginTop: 16,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  committee: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusTxt: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  info: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },

  smallBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  smallBtnActive: {
    backgroundColor: "#EEF2FF",
  },

  smallBtnTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },

  smallBtnTxtActive: {
    color: "#4F46E5",
  },

  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  empty: {
    alignItems: "center",
    paddingTop: 120,
  },

  emptyTxt: {
    marginTop: 10,
    color: "#9CA3AF",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
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
    fontSize: 24,
    fontWeight: "800",
  },

  label: {
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 16,
    color: "#111827",
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    color: "#111827",
  },

  dateBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
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