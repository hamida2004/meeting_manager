import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal,
  TextInput, RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  meetingAPI, agendaAPI, voteAPI,
  draftAPI, pvAPI, authAPI,
} from "../../services/api";


// ─── Sub-components ───────────────────────────────────────────────

function SectionTab({ tabs, active, onPress }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
      {tabs.map((t) => (
        <TouchableOpacity
          key={t}
          style={[styles.tab, active === t && styles.tabActive]}
          onPress={() => onPress(t)}
        >
          <Text style={[styles.tabText, active === t && styles.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Agenda Tab ───────────────────────────────────────────────────
function AgendaTab({ meetingId, isPresident }) {
  const [agenda, setAgenda]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [newPoint, setNewPoint] = useState("");
  const [adding, setAdding]     = useState(false);

  async function load() {
    try {
      const { data } = await agendaAPI.getByMeeting(meetingId);
      setAgenda(data);
    } catch { setAgenda({ points: [] }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function addPoint() {
    if (!newPoint.trim()) return;
    setAdding(true);
    try {
      await agendaAPI.addPoint(meetingId, { content: newPoint.trim() });
      setNewPoint("");
      load();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to add point.");
    } finally { setAdding(false); }
  }

  async function action(fn, id) {
    try { await fn(id); load(); }
    catch (e) { Alert.alert("Error", e?.response?.data?.message || "Action failed."); }
  }

  const POINT_STATUS_COLORS = {
    pending:  { bg: "#FEF9C3", text: "#CA8A04" },
    approved: { bg: "#F0FDF4", text: "#16A34A" },
    rejected: { bg: "#FEF2F2", text: "#DC2626" },
    open:     { bg: "#EFF6FF", text: "#2563EB" },
    closed:   { bg: "#F3F4F6", text: "#6B7280" },
  };

  if (loading) return <View style={styles.tabLoading}><ActivityIndicator color="#4F46E5" /></View>;

  return (
    <View>
      {(agenda?.points || []).length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📄</Text>
          <Text style={styles.emptyTxt}>No agenda points yet</Text>
        </View>
      )}
      {(agenda?.points || []).map((pt) => {
        const c = POINT_STATUS_COLORS[pt.status] || POINT_STATUS_COLORS.pending;
        return (
          <View key={pt.id_agenda_point} style={styles.pointCard}>
            <View style={styles.pointHeader}>
              <Text style={styles.pointContent} numberOfLines={3}>{pt.content}</Text>
              <View style={[styles.pointBadge, { backgroundColor: c.bg }]}>
                <Text style={[styles.pointBadgeTxt, { color: c.text }]}>{pt.status}</Text>
              </View>
            </View>
            {isPresident && (
              <View style={styles.pointActions}>
                {pt.status === "pending" && (
                  <>
                    <TouchableOpacity style={[styles.ptBtn, styles.ptApprove]} onPress={() => action(agendaAPI.approve, pt.id_agenda_point)}>
                      <Text style={styles.ptBtnTxt}>✓ Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.ptBtn, styles.ptReject]} onPress={() => action(agendaAPI.reject, pt.id_agenda_point)}>
                      <Text style={styles.ptBtnTxt}>✕ Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
                {pt.status === "approved" && (
                  <TouchableOpacity style={[styles.ptBtn, styles.ptOpen]} onPress={() => action(agendaAPI.openVoting, pt.id_agenda_point)}>
                    <Text style={styles.ptBtnTxt}>🗳 Open Vote</Text>
                  </TouchableOpacity>
                )}
                {pt.status === "open" && (
                  <TouchableOpacity style={[styles.ptBtn, styles.ptClose]} onPress={() => action(agendaAPI.closeVoting, pt.id_agenda_point)}>
                    <Text style={styles.ptBtnTxt}>🔒 Close Vote</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.ptBtn, styles.ptDelete]} onPress={() => action(agendaAPI.deletePoint, pt.id_agenda_point)}>
                  <Text style={styles.ptBtnTxt}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {/* Add point */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add an agenda point…"
          placeholderTextColor="#9CA3AF"
          value={newPoint}
          onChangeText={setNewPoint}
          multiline
        />
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.btnDisabled]}
          onPress={addPoint}
          disabled={adding}
        >
          {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnTxt}>Add</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Votes Tab ────────────────────────────────────────────────────
function VotesTab({ meetingId }) {
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myVotes, setMyVotes] = useState({});

  async function load() {
    try {
      const { data } = await agendaAPI.getByMeeting(meetingId);
      setAgenda(data);
      const open = (data?.points || []).filter((p) => p.status === "open");
      const votes = {};
      await Promise.all(
        open.map(async (p) => {
          try {
            const r = await voteAPI.getMyVote(p.id_agenda_point);
            votes[p.id_agenda_point] = r.data?.vote;
          } catch {}
        })
      );
      setMyVotes(votes);
    } catch {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function castVote(pointId, vote) {
    try {
      await voteAPI.vote(pointId, { vote });
      setMyVotes((v) => ({ ...v, [pointId]: vote }));
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Vote failed.");
    }
  }

  const openPoints   = (agenda?.points || []).filter((p) => p.status === "open");
  const closedPoints = (agenda?.points || []).filter((p) => p.status === "closed");

  if (loading) return <View style={styles.tabLoading}><ActivityIndicator color="#4F46E5" /></View>;

  return (
    <View>
      {openPoints.length === 0 && closedPoints.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🗳️</Text>
          <Text style={styles.emptyTxt}>No voting points</Text>
        </View>
      )}
      {openPoints.map((pt) => {
        const my = myVotes[pt.id_agenda_point];
        return (
          <View key={pt.id_agenda_point} style={styles.voteCard}>
            <Text style={styles.votePointContent}>{pt.content}</Text>
            <Text style={styles.votingLabel}>Cast your vote:</Text>
            <View style={styles.voteRow}>
              {["agree", "disagree", "abstain"].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.voteBtn,
                    v === "agree"    && styles.voteBtnAgree,
                    v === "disagree" && styles.voteBtnDisagree,
                    v === "abstain"  && styles.voteBtnAbstain,
                    my === v         && styles.voteBtnSelected,
                  ]}
                  onPress={() => castVote(pt.id_agenda_point, v)}
                >
                  <Text style={[styles.voteBtnTxt, my === v && styles.voteBtnTxtSelected]}>
                    {v === "agree" ? "👍 Agree" : v === "disagree" ? "👎 Disagree" : "🤷 Abstain"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
      {closedPoints.length > 0 && (
        <Text style={styles.closedHeader}>Closed Votes</Text>
      )}
      {closedPoints.map((pt) => (
        <ClosedVoteCard key={pt.id_agenda_point} point={pt} />
      ))}
    </View>
  );
}

function ClosedVoteCard({ point }) {
  const [results, setResults] = useState(null);
  useEffect(() => {
    voteAPI.getForPoint(point.id_agenda_point)
      .then(({ data }) => setResults(data))
      .catch(() => {});
  }, []);

  // FIX: API returns { point_id, total_votes, stats: { agree, disagree, abstain }, votes: [] }
  // not an array — use results.stats and results.total_votes
  const totals = results?.stats || { agree: 0, disagree: 0, abstain: 0 };
  const total  = results?.total_votes || 0;

  return (
    <View style={styles.closedVoteCard}>
      <Text style={styles.votePointContent}>{point.content}</Text>
      {total > 0 ? (
        <View style={styles.resultsRow}>
          {Object.entries(totals).map(([k, n]) => (
            <View key={k} style={styles.resultItem}>
              <Text style={styles.resultNum}>{n}</Text>
              <Text style={styles.resultLabel}>{k}</Text>
              <View style={styles.resultBar}>
                <View style={[styles.resultBarFill, { width: `${total > 0 ? (n / total) * 100 : 0}%` }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noVotesTxt}>No votes recorded</Text>
      )}
    </View>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────
function AttendanceTab({ meeting, isPresident, currentUserId }) {
  const [confirmed, setConfirmed]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    setSubmitting(true);
    try {
      await meetingAPI.confirmAttendance(meeting.id_meeting);
      setConfirmed(true);
      Alert.alert("Success", "Attendance confirmed!");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to confirm.");
    } finally { setSubmitting(false); }
  }

  async function validate(uid) {
    try {
      await meetingAPI.validateAttendance(meeting.id_meeting, uid);
      Alert.alert("Success", "Attendance validated.");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to validate.");
    }
  }

  const members = meeting.MeetingMembers || meeting.members || [];

  return (
    <View>
      {/* Self confirm */}
      <View style={styles.attendSelfCard}>
        <Text style={styles.attendSelfTitle}>Your Attendance</Text>
        <TouchableOpacity
          style={[styles.confirmBtn, (confirmed || submitting) && styles.btnDisabled]}
          onPress={confirm}
          disabled={confirmed || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmBtnTxt}>
              {confirmed ? "✓ Confirmed" : "Confirm Attendance"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Members list */}
      {members.length > 0 && (
        <View style={styles.membersCard}>
          <Text style={styles.membersTitle}>Members ({members.length})</Text>
          {members.map((m) => {
            const u = m.User || m.user || m;
            return (
              <View key={u.id_user || m.user_id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarTxt}>
                    {/* FIX: API returns full_name, not name */}
                    {(u.full_name || "?")[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{u.full_name || "Unknown"}</Text>
                  <Text style={styles.memberEmail}>{u.email || ""}</Text>
                </View>
                {isPresident && u.id_user !== currentUserId && (
                  <TouchableOpacity
                    style={styles.validateBtn}
                    onPress={() => validate(u.id_user)}
                  >
                    <Text style={styles.validateBtnTxt}>Validate</Text>
                  </TouchableOpacity>
                )}
                {m.attendance_confirmed && (
                  <Text style={styles.attendTick}>✓</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Draft Tab ────────────────────────────────────────────────────
function DraftTab({ meetingId }) {
  const [draft, setDraft]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [newPt, setNewPt]       = useState("");
  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editVal, setEditVal]   = useState("");

  async function load() {
    try {
      const { data } = await draftAPI.getByMeeting(meetingId);
      setDraft(data);
    } catch { setDraft({ points: [] }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function addPoint() {
    if (!newPt.trim()) return;
    setAdding(true);
    try {
      await draftAPI.addPoint(meetingId, { content: newPt.trim() });
      setNewPt("");
      load();
    } catch (e) { Alert.alert("Error", e?.response?.data?.message || "Failed."); }
    finally { setAdding(false); }
  }

  async function saveEdit(id) {
    try {
      await draftAPI.editPoint(id, { content: editVal });
      setEditId(null);
      load();
    } catch (e) { Alert.alert("Error", e?.response?.data?.message || "Failed."); }
  }

  async function deletePoint(id) {
    Alert.alert("Delete", "Remove this draft point?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await draftAPI.deletePoint(id); load(); }
          catch (e) { Alert.alert("Error", "Failed to delete."); }
        },
      },
    ]);
  }

  if (loading) return <View style={styles.tabLoading}><ActivityIndicator color="#4F46E5" /></View>;

  return (
    <View>
      {(draft?.points || []).length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyTxt}>No draft notes yet</Text>
        </View>
      )}
      {(draft?.points || []).map((pt) => (
        <View key={pt.id_draft_point} style={styles.draftCard}>
          {editId === pt.id_draft_point ? (
            <>
              <TextInput
                style={styles.draftEditInput}
                value={editVal}
                onChangeText={setEditVal}
                multiline
              />
              <View style={styles.draftEditActions}>
                <TouchableOpacity onPress={() => setEditId(null)} style={styles.draftCancelBtn}>
                  <Text style={styles.draftCancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => saveEdit(pt.id_draft_point)} style={styles.draftSaveBtn}>
                  <Text style={styles.draftSaveTxt}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.draftRow}>
              <Text style={styles.draftContent} numberOfLines={4}>{pt.content}</Text>
              <View style={styles.draftRowActions}>
                <TouchableOpacity onPress={() => { setEditId(pt.id_draft_point); setEditVal(pt.content); }}>
                  <Text style={styles.draftEditIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deletePoint(pt.id_draft_point)}>
                  <Text style={styles.draftDeleteIcon}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add a draft note…"
          placeholderTextColor="#9CA3AF"
          value={newPt}
          onChangeText={setNewPt}
          multiline
        />
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.btnDisabled]}
          onPress={addPoint}
          disabled={adding}
        >
          {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnTxt}>Add</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── PV Tab ───────────────────────────────────────────────────────
function PVTab({ meetingId, isPresident }) {
  const [pv, setPV]             = useState(null);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPt, setNewPt]       = useState("");
  const [adding, setAdding]     = useState(false);

  async function load() {
    try {
      const { data } = await pvAPI.getByMeeting(meetingId);
      setPV(data);
    } catch { setPV(null); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createPV() {
    setCreating(true);
    try {
      // FIX: pvAPI has no `.create()`. Use `createFromDraft` to copy draft points,
      // or `createEmpty` for a blank PV. createFromDraft is the most useful flow.
      const { data } = await pvAPI.createFromDraft(meetingId);
      setPV(data.pv || data);
    } catch (e) {
      // If no draft exists yet, fall back to an empty PV
      try {
        const { data } = await pvAPI.createEmpty(meetingId);
        setPV(data.pv || data);
      } catch (e2) {
        Alert.alert("Error", e2?.response?.data?.message || "Failed to create PV.");
      }
    } finally { setCreating(false); }
  }

  async function addPoint() {
    if (!newPt.trim() || !pv) return;
    setAdding(true);
    try {
      await pvAPI.addPoint(pv.id_pv, { content: newPt.trim() });
      setNewPt("");
      load();
    } catch (e) { Alert.alert("Error", e?.response?.data?.message || "Failed."); }
    finally { setAdding(false); }
  }

  if (loading) return <View style={styles.tabLoading}><ActivityIndicator color="#4F46E5" /></View>;

  if (!pv) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyTxt}>No PV (Procès-Verbal) yet</Text>
        {isPresident && (
          <TouchableOpacity
            style={[styles.createPVBtn, creating && styles.btnDisabled]}
            onPress={createPV}
            disabled={creating}
          >
            {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createPVBtnTxt}>Create PV from Draft</Text>}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.pvHeader}>
        <Text style={styles.pvId}>PV #{pv.id_pv}</Text>
      </View>
      {(pv.points || []).length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📃</Text>
          <Text style={styles.emptyTxt}>No PV points yet</Text>
        </View>
      )}
      {(pv.points || []).map((pt, i) => (
        <View key={pt.id_pv_point || i} style={styles.pvPointCard}>
          <Text style={styles.pvPointNum}>{i + 1}.</Text>
          <Text style={styles.pvPointContent}>{pt.content}</Text>
        </View>
      ))}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add a PV point…"
          placeholderTextColor="#9CA3AF"
          value={newPt}
          onChangeText={setNewPt}
          multiline
        />
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.btnDisabled]}
          onPress={addPoint}
          disabled={adding}
        >
          {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnTxt}>Add</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
const TABS = ["Agenda", "Votes", "Attendance", "Draft", "PV"];

export default function MeetingDetail() {
  const router  = useRouter();
  const { id }  = useLocalSearchParams();
  const [meeting, setMeeting]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab]     = useState("Agenda");
  const [refreshing, setRefreshing]   = useState(false);

  async function load() {
    try {
      const [mRes, uRes] = await Promise.all([
        meetingAPI.getOne(id),
        authAPI.me(),
      ]);
      setMeeting(mRes.data);
      setCurrentUser(uRes.data);
    } catch {
      Alert.alert("Error", "Could not load meeting.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [id]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [id]);

  async function changeStatus(status) {
    Alert.alert("Change Status", `Set meeting to "${status}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await meetingAPI.changeStatus(id, { status });
            setMeeting((m) => ({ ...m, status }));
          } catch (e) {
            Alert.alert("Error", e?.response?.data?.message || "Failed.");
          }
        },
      },
    ]);
  }

  async function deleteMeeting() {
    Alert.alert("Delete", "Permanently delete this meeting?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await meetingAPI.delete(id);
            router.back();
          } catch (e) {
            Alert.alert("Error", e?.response?.data?.message || "Failed.");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!meeting) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTxt}>Meeting not found.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Go back</Text></TouchableOpacity>
      </View>
    );
  }

  // FIX: committee is lowercase in API response; also support capitalised Sequelize alias
  const committee = meeting.committee || meeting.Committee;

  const isPresident =
    currentUser?.is_admin ||
    committee?.president_id === currentUser?.id_user ||
    meeting.president_id    === currentUser?.id_user;

  const STATUS_COLORS = {
    scheduled: "#3B82F6",
    ongoing:   "#22C55E",
    completed: "#6B7280",
    cancelled: "#EF4444",
  };

  // FIX: API field is `timing`, not `date`
  const date = meeting.timing ? new Date(meeting.timing) : null;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.detailContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backTxt}>← Back</Text>
      </TouchableOpacity>

      {/* Meeting header */}
      <View style={styles.meetingHeader}>
        <View style={styles.meetingHeaderTop}>
          <Text style={styles.meetingDetailTitle} numberOfLines={2}>{meeting.title}</Text>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[meeting.status] || "#6B7280" }]} />
        </View>
        <Text style={styles.meetingDetailCommittee}>
          {committee?.name || ""}
        </Text>
        <Text style={styles.meetingDetailDate}>
          {date ? date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}
          {date ? "  ·  " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </Text>
        {/* FIX: API field is `site`, not `location` */}
        {meeting.site && (
          <Text style={styles.meetingLocation}>📍 {meeting.site}</Text>
        )}
      </View>

      {/* Status controls (president only) */}
      {isPresident && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusActions} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {["scheduled", "ongoing", "completed", "cancelled"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusActionBtn,
                meeting.status === s && styles.statusActionBtnActive,
              ]}
              onPress={() => changeStatus(s)}
              disabled={meeting.status === s}
            >
              <Text
                style={[
                  styles.statusActionTxt,
                  meeting.status === s && styles.statusActionTxtActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.deleteBtn} onPress={deleteMeeting}>
            <Text style={styles.deleteBtnTxt}>🗑 Delete</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Tab navigation */}
      <SectionTab tabs={TABS} active={activeTab} onPress={setActiveTab} />

      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === "Agenda" && (
          <AgendaTab meetingId={id} isPresident={isPresident} />
        )}
        {activeTab === "Votes" && (
          <VotesTab meetingId={id} />
        )}
        {activeTab === "Attendance" && (
          <AttendanceTab
            meeting={meeting}
            isPresident={isPresident}
            currentUserId={currentUser?.id_user}
          />
        )}
        {activeTab === "Draft" && (
          <DraftTab meetingId={id} />
        )}
        {activeTab === "PV" && (
          <PVTab meetingId={id} isPresident={isPresident} />
        )}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex:     { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  notFoundTxt: { fontSize: 16, color: "#6B7280", marginBottom: 12 },
  link:     { color: "#4F46E5", fontWeight: "600" },

  detailContainer: { paddingBottom: 60 },

  backBtn: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4 },
  backTxt: { fontSize: 15, color: "#4F46E5", fontWeight: "600" },

  meetingHeader:    { paddingHorizontal: 20, paddingVertical: 16 },
  meetingHeaderTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  meetingDetailTitle:     { flex: 1, fontSize: 22, fontWeight: "800", color: "#111827", letterSpacing: -0.4, lineHeight: 28 },
  statusDot:              { width: 12, height: 12, borderRadius: 6, marginTop: 6, marginLeft: 10 },
  meetingDetailCommittee: { fontSize: 14, color: "#4F46E5", fontWeight: "600", marginBottom: 4 },
  meetingDetailDate:      { fontSize: 13, color: "#6B7280" },
  meetingLocation:        { fontSize: 13, color: "#6B7280", marginTop: 4 },

  statusActions: { marginBottom: 12 },
  statusActionBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#F3F4F6",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  statusActionBtnActive: { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  statusActionTxt:       { fontSize: 13, color: "#6B7280", fontWeight: "500", textTransform: "capitalize" },
  statusActionTxtActive: { color: "#4F46E5", fontWeight: "700" },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  deleteBtnTxt: { fontSize: 13, color: "#EF4444", fontWeight: "600" },

  tabBar: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6", backgroundColor: "#fff" },
  tabBarContent: { paddingHorizontal: 16, gap: 4 },
  tab: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#4F46E5" },
  tabText:       { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },
  tabTextActive: { color: "#4F46E5", fontWeight: "700" },
  tabContent: { padding: 20 },
  tabLoading: { paddingVertical: 48, alignItems: "center" },

  // Agenda / shared
  pointCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  pointHeader:   { flexDirection: "row", alignItems: "flex-start" },
  pointContent:  { flex: 1, fontSize: 14, color: "#111827", lineHeight: 20, marginRight: 8 },
  pointBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pointBadgeTxt: { fontSize: 11, fontWeight: "600" },
  pointActions:  { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  ptBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  ptBtnTxt: { fontSize: 12, fontWeight: "600", color: "#fff" },
  ptApprove: { backgroundColor: "#22C55E" },
  ptReject:  { backgroundColor: "#EF4444" },
  ptOpen:    { backgroundColor: "#3B82F6" },
  ptClose:   { backgroundColor: "#6B7280" },
  ptDelete:  { backgroundColor: "#F3F4F6" },

  addRow:   { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 12 },
  addInput: {
    flex: 1, backgroundColor: "#fff", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111827",
    borderWidth: 1, borderColor: "#E5E7EB", maxHeight: 80,
  },
  addBtn:    { backgroundColor: "#4F46E5", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },

  emptyBox: {
    alignItems: "center", paddingVertical: 40,
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#F3F4F6",
    marginBottom: 12,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTxt:   { fontSize: 14, color: "#9CA3AF" },
  btnDisabled: { opacity: 0.6 },

  // Votes
  voteCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  votePointContent: { fontSize: 14, color: "#111827", lineHeight: 20, marginBottom: 12 },
  votingLabel:      { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 8 },
  voteRow: { flexDirection: "row", gap: 8 },
  voteBtn:          { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  voteBtnAgree:     { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  voteBtnDisagree:  { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  voteBtnAbstain:   { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
  voteBtnSelected:  { borderWidth: 2 },
  voteBtnTxt:       { fontSize: 12, fontWeight: "500", color: "#374151" },
  voteBtnTxtSelected: { fontWeight: "700" },

  closedHeader: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginTop: 8, marginBottom: 8, textTransform: "uppercase" },
  closedVoteCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  resultsRow:    { flexDirection: "row", gap: 8, marginTop: 8 },
  resultItem:    { flex: 1, alignItems: "center" },
  resultNum:     { fontSize: 20, fontWeight: "800", color: "#111827" },
  resultLabel:   { fontSize: 11, color: "#6B7280", textTransform: "capitalize", marginBottom: 4 },
  resultBar:     { width: "100%", height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", overflow: "hidden" },
  resultBarFill: { height: "100%", backgroundColor: "#4F46E5", borderRadius: 2 },
  noVotesTxt:    { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  // Attendance
  attendSelfCard: {
    backgroundColor: "#EEF2FF", borderRadius: 14, padding: 16, marginBottom: 16,
    alignItems: "center",
  },
  attendSelfTitle: { fontSize: 15, fontWeight: "700", color: "#4F46E5", marginBottom: 12 },
  confirmBtn: {
    backgroundColor: "#4F46E5", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32,
  },
  confirmBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },

  membersCard: {
    backgroundColor: "#fff", borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  membersTitle: { fontSize: 13, fontWeight: "700", color: "#6B7280", padding: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  memberRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  memberAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  memberAvatarTxt: { fontSize: 14, fontWeight: "700", color: "#4F46E5" },
  memberInfo:      { flex: 1 },
  memberName:      { fontSize: 14, fontWeight: "600", color: "#111827" },
  memberEmail:     { fontSize: 12, color: "#9CA3AF" },
  validateBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "#EEF2FF", borderRadius: 8,
  },
  validateBtnTxt: { fontSize: 12, color: "#4F46E5", fontWeight: "600" },
  attendTick:     { fontSize: 16, color: "#22C55E", marginLeft: 8 },

  // Draft
  draftCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  draftRow:        { flexDirection: "row", alignItems: "flex-start" },
  draftContent:    { flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 },
  draftRowActions: { flexDirection: "row", gap: 8, marginLeft: 8 },
  draftEditIcon:   { fontSize: 16 },
  draftDeleteIcon: { fontSize: 16 },
  draftEditInput: {
    backgroundColor: "#F3F4F6", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, color: "#111827", minHeight: 60,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  draftEditActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
  draftCancelBtn:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: "#F3F4F6" },
  draftCancelTxt:   { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  draftSaveBtn:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: "#4F46E5" },
  draftSaveTxt:     { fontSize: 13, color: "#fff", fontWeight: "600" },

  // PV
  pvHeader:       { backgroundColor: "#F5F3FF", borderRadius: 10, padding: 12, marginBottom: 12 },
  pvId:           { fontSize: 13, color: "#4F46E5", fontWeight: "700" },
  pvPointCard: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  pvPointNum:     { fontSize: 14, fontWeight: "700", color: "#4F46E5", marginRight: 10, minWidth: 20 },
  pvPointContent: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 },
  createPVBtn: {
    marginTop: 16, backgroundColor: "#4F46E5",
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32,
  },
  createPVBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
