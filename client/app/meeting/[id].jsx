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
  Modal,
} from "react-native";

import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  MaterialIcons,
  Ionicons,
  AntDesign,
} from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import {
  meetingAPI,
  agendaAPI,
  voteAPI,
  draftAPI,
  pvAPI,
  authAPI,
  userAPI,
  committeeAPI,
  notificationAPI,
} from "../../services/api";

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────

const TABS = ["Agenda", "Votes", "Attendance", "Draft", "PV"];

function SectionTabs({ active, setActive }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsContainer}
    >
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabBtn, active === tab && styles.tabBtnActive]}
          onPress={() => setActive(tab)}
        >
          <Text style={[styles.tabTxt, active === tab && styles.tabTxtActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function MeetingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [meeting, setMeeting] = useState(null);
  const [members, setMembers] = useState([]);
  const [agenda, setAgenda] = useState({ points: [] });
  const [draft, setDraft] = useState({ points: [] });
  const [pv, setPV] = useState(null);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Agenda");
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [reporterModalVisible, setReporterModalVisible] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [exportingPDF, setExportingPDF] = useState(false);

  // ─────────────────────────────────────────────────────────
  // Load
  // ─────────────────────────────────────────────────────────

  async function load() {
    if (!id || id === "undefined" || id === "null") {
      setLoading(false);
      Alert.alert("Error", "Invalid meeting ID");
      return;
    }

    try {
      const meetingRes = await meetingAPI.getOne(id);
      setMeeting(meetingRes.data);

      const loadMembers = meetingAPI
        .getMembers(id)
        .then((res) => setMembers(res.data || []))
        .catch((err) => {
          if (err.response?.status !== 404) console.error("Failed to load members:", err);
          setMembers([]);
        });

      const loadAgenda = agendaAPI
        .getByMeeting(id)
        .then((res) => setAgenda(res.data || { points: [] }))
        .catch((err) => {
          if (err.response?.status !== 404) console.error("Failed to load agenda:", err);
          setAgenda({ points: [] });
        });

      const loadDraft = draftAPI
        .getByMeeting(id)
        .then((res) => setDraft(res.data || { points: [] }))
        .catch((err) => {
          if (err.response?.status !== 404) console.error("Failed to load draft:", err);
          setDraft({ points: [] });
        });

      const loadCommitteeMembers = meetingRes.data.committee_id
        ? committeeAPI
            .getOne(meetingRes.data.committee_id)
            .then((res) => {
              setCommitteeMembers(res.data?.members || []);
            })
            .catch((err) => {
              if (err.response?.status !== 404) {
                console.error("Failed to load committee members:", err);
              }
              setCommitteeMembers([]);
            })
        : Promise.resolve();

      const loadCurrentUser = authAPI
        .me()
        .then((res) => setCurrentUser(res.data))
        .catch((err) => {
          if (err.response?.status !== 404) console.error("Failed to load current user:", err);
          setCurrentUser(null);
        });

      await Promise.all([
        loadMembers,
        loadAgenda,
        loadDraft,
        loadCommitteeMembers,
        loadCurrentUser,
      ]);

      try {
        const pvRes = await pvAPI.getByMeeting(id);
        setPV(pvRes.data);
      } catch (err) {
        if (err.response?.status !== 404) console.error("Failed to load PV:", err);
        setPV(null);
      }
    } catch (err) {
      console.error("CRITICAL ERROR:", err?.response?.data || err);
      Alert.alert("Error", "Failed to load meeting details. Please try again.");
      setMeeting(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!meeting) {
    return (
      <View style={styles.center}>
        <Text>Meeting not found</Text>
      </View>
    );
  }

  const committee = meeting.committee || meeting.Committee;

  const isManager =
    currentUser?.is_admin ||
    (committee && committee.president_id === currentUser?.id_user) ||
    meeting.creator_id === currentUser?.id_user;

  // ─────────────────────────────────────────────────────────
  // PDF Export
  // ─────────────────────────────────────────────────────────

  async function exportPDF() {
    setExportingPDF(true);

    try {
      // Fetch votes for all agenda points
      const votesMap = {};
      for (const point of (agenda?.points || [])) {
        try {
          const res = await voteAPI.getVotes(point.id_point);
          const stats = res.data.stats;
          votesMap[point.id_point] = {
            agree: stats.agree || 0,
            disagree: stats.disagree || 0,
            abstain: stats.abstain || 0,
          };
        } catch {
          votesMap[point.id_point] = { agree: 0, disagree: 0, abstain: 0 };
        }
      }

      // Format date/time
      const meetingDate = meeting.date
        ? new Date(meeting.date).toLocaleDateString("ar-DZ", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "غير محدد";

      const startTime = meeting.start_time
        ? new Date(`1970-01-01T${meeting.start_time}`).toLocaleTimeString("ar-DZ", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "غير محدد";

      const endTime = meeting.end_time
        ? new Date(`1970-01-01T${meeting.end_time}`).toLocaleTimeString("ar-DZ", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "غير محدد";

      // Translate status
      const statusMap = {
        scheduled: "مجدول",
        ongoing: "جاري",
        closed: "مغلق",
        canceled: "ملغى",
      };

      const stateMap = {
        pending: "قيد الانتظار",
        approved: "موافق عليه",
        rejected: "مرفوض",
        open: "مفتوح للتصويت",
        closed: "مغلق",
      };

      // Build attendance rows
      const attendanceRows = members
        .map((m) => {
          const user = m.user || m.User;
          return `
            <tr>
              <td>${user?.full_name || "—"}</td>
              <td>${m.confirmed ? "✅ مؤكد" : "❌ غير مؤكد"}</td>
              <td>${m.attended ? "✅ حاضر" : "❌ غائب"}</td>
            </tr>
          `;
        })
        .join("");

      // Build agenda rows
      const agendaRows = (agenda?.points || [])
        .map((p, i) => {
          const votes = votesMap[p.id_point] || { agree: 0, disagree: 0, abstain: 0 };
          return `
            <tr>
              <td>${i + 1}</td>
              <td>${p.content}</td>
              <td>${stateMap[p.state] || p.state}</td>
              <td>${votes.agree}</td>
              <td>${votes.disagree}</td>
              <td>${votes.abstain}</td>
            </tr>
          `;
        })
        .join("");

      // Build PV points
      const pvPoints = (pv?.points || [])
        .map((p, i) => `<li>${p.content}</li>`)
        .join("");

      // HTML Template
      const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Noto Naskh Arabic', 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
      padding: 40px;
      color: #111827;
      line-height: 1.8;
      font-size: 14px;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #2563EB;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 26px;
      color: #2563EB;
      margin-bottom: 8px;
    }

    .header p {
      color: #6B7280;
      font-size: 13px;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #2563EB;
      border-right: 4px solid #2563EB;
      padding-right: 12px;
      margin-bottom: 14px;
    }

    .info-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .info-item {
      background: #F3F4F6;
      padding: 10px 16px;
      border-radius: 8px;
      flex: 1;
      min-width: 200px;
    }

    .info-item .label {
      font-size: 11px;
      color: #6B7280;
      margin-bottom: 4px;
    }

    .info-item .value {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 13px;
    }

    th {
      background: #2563EB;
      color: #fff;
      padding: 10px 8px;
      text-align: center;
      font-weight: 700;
    }

    td {
      padding: 10px 8px;
      border-bottom: 1px solid #E5E7EB;
      text-align: center;
    }

    tr:nth-child(even) {
      background: #F9FAFB;
    }

    .pv-list {
      list-style: none;
      padding: 0;
    }

    .pv-list li {
      background: #F9FAFB;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      border-right: 3px solid #2563EB;
    }

    .pv-list li::before {
      content: "• ";
      color: #2563EB;
      font-weight: 700;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #E5E7EB;
      text-align: center;
      color: #9CA3AF;
      font-size: 11px;
    }

    .empty-msg {
      color: #9CA3AF;
      text-align: center;
      padding: 20px;
      font-style: italic;
    }

    .reporter-box {
      background: #EFF6FF;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 10px;
      border: 1px solid #BFDBFE;
    }

    .page-break {
  page-break-before: always;
  break-before: page;
  margin-top: 40px;
}

  </style>
</head>
<body>

  <div class="header">
    <h1>محضر الاجتماع</h1>
    <p>${meeting.title}</p>
  </div>

  <!-- معلومات الاجتماع -->
  <div class="section">
    <div class="section-title"> معلومات الاجتماع</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">عنوان الاجتماع</div>
        <div class="value">${meeting.title}</div>
      </div>
      <div class="info-item">
        <div class="label">اللجنة</div>
        <div class="value">${committee?.name || "—"}</div>
      </div>
      <div class="info-item">
        <div class="label">التاريخ</div>
        <div class="value">${meetingDate}</div>
      </div>
      <div class="info-item">
        <div class="label">التوقيت</div>
        <div class="value">${startTime} — ${endTime}</div>
      </div>
      <div class="info-item">
        <div class="label">الحالة</div>
        <div class="value">${statusMap[meeting.status] || meeting.status}</div>
      </div>
      <div class="info-item">
        <div class="label">المقرر</div>
        <div class="value">${meeting.reporter?.full_name || "لم يتم التعيين"}</div>
      </div>
    </div>
  </div>

  <!-- الحضور -->
  <div class="section">
    <div class="section-title"> الحضور (${members.length} عضو)</div>
    ${
      members.length > 0
        ? `
      <table>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>تأكيد الحضور</th>
            <th>الحضور الفعلي</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceRows}
        </tbody>
      </table>
    `
        : '<div class="empty-msg">لا يوجد أعضاء في هذا الاجتماع</div>'
    }
  </div>

  <!-- جدول الأعمال -->
  <div class="section">
    <div class="section-title"> جدول الأعمال والتصويت</div>
    ${
      (agenda?.points || []).length > 0
        ? `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>البند</th>
            <th>الحالة</th>
            <th>موافق</th>
            <th>معارض</th>
            <th>ممتنع</th>
          </tr>
        </thead>
        <tbody>
          ${agendaRows}
        </tbody>
      </table>
    `
        : '<div class="empty-msg">لا توجد نقاط في جدول الأعمال</div>'
    }
  </div>

  <!-- محضر الاجتماع (PV) -->
  <div class="section page-break">
    <div class="section-title"> محضر الاجتماع</div>
    ${
      pv && (pv.points || []).length > 0
        ? `<ul class="pv-list">${pvPoints}</ul>`
        : pv
        ? '<div class="empty-msg">لا توجد نقاط في المحضر</div>'
        : '<div class="empty-msg">لم يتم إنشاء محضر الاجتماع بعد</div>'
    }
  </div>

  <div class="footer">
    <p>تم إنشاء هذا المحضر تلقائيًا — ${new Date().toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</p>
  </div>

</body>
</html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share / Save the PDF
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "تصدير محضر الاجتماع",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("تنبيه", "لا يمكن مشاركة الملف على هذا الجهاز.");
      }
    } catch (err) {
      console.error("PDF Export Error:", err);
      Alert.alert("خطأ", "فشل في تصدير ملف PDF. يرجى المحاولة مرة أخرى.");
    } finally {
      setExportingPDF(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Meeting Actions
  // ─────────────────────────────────────────────────────────

  async function updateStatus(status) {
    try {
      await meetingAPI.changeStatus(id, { status });

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `The meeting status has been changed to "${status}".`,
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to update status");
    }
  }

  async function updateVotingState(voting_state) {
    try {
      await meetingAPI.changeVotingState(id, { voting_state });

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `The voting state has been changed to "${voting_state}".`,
      });

      load();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", err?.response?.data?.msg || "Failed to update voting state");
    }
  }

  async function addMembers() {
    try {
      await meetingAPI.addMembers(id, { members: selectedMembers });

      for (const userId of selectedMembers) {
        await notificationAPI.createNotification({
          id_user: userId,
          content: `You have been added to the meeting "${meeting.title}".`,
        });
      }

      setMemberModalVisible(false);
      setSelectedMembers([]);
      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to add members");
    }
  }

  async function assignReporter(reporter_id) {
    try {
      await meetingAPI.addReporter(id, { reporter_id });

      await notificationAPI.createNotification({
        id_user: reporter_id,
        content: `You have been assigned as the reporter for the meeting "${meeting.title}".`,
      });

      setReporterModalVisible(false);
      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to assign reporter");
    }
  }

  // ─────────────────────────────────────────────────────────
  // Agenda Actions
  // ─────────────────────────────────────────────────────────

  async function addAgendaPoint(content) {
    try {
      await agendaAPI.addPoint(id, { content });

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `A new agenda point has been added to the meeting: "${content.substring(0, 50)}${
          content.length > 50 ? "..." : ""
        }".`,
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to add agenda point");
    }
  }

  async function agendaAction(fn, pointId) {
    try {
      await fn(pointId);

      let action = "";
      if (fn === agendaAPI.approve) action = "approved";
      else if (fn === agendaAPI.reject) action = "rejected";
      else if (fn === agendaAPI.openVoting) action = "voting opened";
      else if (fn === agendaAPI.closeVoting) action = "voting closed";
      else if (fn === agendaAPI.deletePoint) action = "deleted";

      if (action) {
        await notificationAPI.notifyMeeting({
          meeting_id: id,
          content: `An agenda point has been ${action}.`,
        });
      }

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to process agenda action");
    }
  }

  async function votePoint(pointId, vote) {
    try {
      await voteAPI.vote(pointId, { vote });

      await notificationAPI.createNotification({
        id_user: currentUser.id_user,
        content: "Your vote has been recorded successfully.",
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to submit vote");
    }
  }

  // ─────────────────────────────────────────────────────────
  // Draft Actions
  // ─────────────────────────────────────────────────────────

  async function addDraftPoint(content) {
    try {
      await draftAPI.addPoint(id, { content });

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `A new draft point has been added: "${content.substring(0, 50)}${
          content.length > 50 ? "..." : ""
        }".`,
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to add draft point");
    }
  }

  async function editDraftPoint(pointId, content) {
    try {
      await draftAPI.editPoint(pointId, { content });

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `A draft point has been updated.`,
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to edit draft point");
    }
  }

  async function deleteDraftPoint(pointId) {
    try {
      await draftAPI.deletePoint(pointId);

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `A draft point has been deleted.`,
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to delete draft point");
    }
  }

  // ─────────────────────────────────────────────────────────
  // PV Actions
  // ─────────────────────────────────────────────────────────

  async function createPVFromDraft() {
    try {
      await pvAPI.createFromDraft(id);

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `The PV has been created from the draft.`,
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to create PV from draft");
    }
  }

  async function createPVEmpty() {
    try {
      await pvAPI.createEmpty(id);

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `An empty PV has been created.`,
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to create empty PV");
    }
  }

  async function addPVPoint(content) {
    try {
      await pvAPI.addPoint(pv.id_pv, { content });

      await notificationAPI.notifyMeeting({
        meeting_id: id,
        content: `A new point has been added to the PV: "${content.substring(0, 50)}${
          content.length > 50 ? "..." : ""
        }".`,
      });

      load();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to add PV point");
    }
  }

  // ─────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.title}>{meeting.title}</Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity onPress={exportPDF} disabled={exportingPDF}>
            {exportingPDF ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <MaterialIcons name="picture-as-pdf" size={24} color="#DC2626" />
            )}
          </TouchableOpacity>

          {isManager && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Delete Meeting", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await meetingAPI.delete(id);
                        router.back();
                      } catch {
                        Alert.alert("Error");
                      }
                    },
                  },
                ]);
              }}
            >
              <MaterialIcons name="delete" size={24} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Meeting Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meeting Information</Text>

        <InfoRow icon="groups" label="Committee" value={committee?.name} />
        <InfoRow icon="event" label="Status" value={meeting.status} />
        <InfoRow icon="how-to-vote" label="Voting" value={meeting.voting_state} />
        <InfoRow
          icon="person"
          label="Reporter"
          value={meeting.reporter?.full_name || "None"}
        />

        {/* Export PDF Button */}
        <TouchableOpacity
          style={styles.exportPdfBtn}
          onPress={exportPDF}
          disabled={exportingPDF}
        >
          {exportingPDF ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
              <Text style={styles.exportPdfBtnTxt}>تصدير PDF — Export PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {isManager && (
          <>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setMemberModalVisible(true)}
              >
                <MaterialIcons name="person-add" size={18} color="#fff" />
                <Text style={styles.primaryBtnTxt}>Add Members</Text>
              </TouchableOpacity>

              {currentUser?.id_user === meeting.creator_id && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setReporterModalVisible(true)}
                >
                  <MaterialIcons name="assignment-ind" size={18} color="#2563EB" />
                  <Text style={styles.secondaryBtnTxt}>Assign Reporter</Text>
                </TouchableOpacity>
              )}
            </View>

            {currentUser?.id_user === meeting.creator_id && (
              <View style={styles.statusActions}>
                {["scheduled", "ongoing", "closed", "canceled"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.statusBtn}
                    onPress={() => updateStatus(status)}
                  >
                    <Text>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {currentUser?.id_user === meeting.creator_id && (
              <View style={styles.statusActions}>
                <TouchableOpacity
                  style={styles.voteStateBtn}
                  onPress={() => updateVotingState("open")}
                >
                  <Text>Open Voting</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.voteStateBtn}
                  onPress={() => updateVotingState("closed")}
                >
                  <Text>Close Voting</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Tabs */}
      <SectionTabs active={activeTab} setActive={setActiveTab} />

      {/* Agenda */}
      {activeTab === "Agenda" && (
        <AgendaSection
          agenda={agenda}
          isManager={isManager}
          onAdd={addAgendaPoint}
          onApprove={(id) => agendaAction(agendaAPI.approve, id)}
          onReject={(id) => agendaAction(agendaAPI.reject, id)}
          onOpen={(id) => agendaAction(agendaAPI.openVoting, id)}
          onClose={(id) => agendaAction(agendaAPI.closeVoting, id)}
          onDelete={(id) => agendaAction(agendaAPI.deletePoint, id)}
        />
      )}

      {/* Votes */}
      {activeTab === "Votes" && (
        <VotesSection agenda={agenda} onVote={votePoint} />
      )}

      {/* Attendance */}
      {activeTab === "Attendance" && (
        <AttendanceSection
          members={members}
          meetingId={id}
          currentUser={currentUser}
          isManager={isManager}
          reload={load}
          meeting={meeting}
        />
      )}

      {/* Draft */}
      {activeTab === "Draft" && (
        <DraftSection
          draft={draft}
          onAdd={addDraftPoint}
          onEdit={editDraftPoint}
          onDelete={deleteDraftPoint}
        />
      )}

      {/* PV */}
      {activeTab === "PV" && (
        <PVSection
          pv={pv}
          isManager={isManager}
          onCreateFromDraft={createPVFromDraft}
          onCreateEmpty={createPVEmpty}
          onAdd={addPVPoint}
          hasDraftPoints={draft?.points?.length > 0}
          currentUser={currentUser}
          meeting={meeting}
        />
      )}

      {/* Add Members Modal */}
      <Modal visible={memberModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Members</Text>

            <ScrollView>
              {committeeMembers
                .filter((cm) => {
                  const alreadyMember = members.some((m) => {
                    const user = m.user || m.User;
                    return (
                      user?.id_user ===
                      (cm.user?.id_user || cm.User?.id_user || cm.id_user)
                    );
                  });
                  return !alreadyMember;
                })
                .map((cm) => {
                  const user = cm.user || cm.User || cm;
                  const selected = selectedMembers.includes(user.id_user);

                  return (
                    <TouchableOpacity
                      key={user.id_user}
                      style={styles.userRow}
                      onPress={() => {
                        if (selected) {
                          setSelectedMembers((prev) =>
                            prev.filter((x) => x !== user.id_user)
                          );
                        } else {
                          setSelectedMembers((prev) => [...prev, user.id_user]);
                        }
                      }}
                    >
                      <View>
                        <Text style={{ fontWeight: "600" }}>
                          {user.full_name}
                        </Text>

                        {!!user.email && (
                          <Text
                            style={{
                              color: "#6B7280",
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {user.email}
                          </Text>
                        )}
                      </View>

                      {selected && (
                        <AntDesign name="checkcircle" size={20} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <TouchableOpacity style={styles.primaryBtn} onPress={addMembers}>
              <Text style={styles.primaryBtnTxt}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 12, display: "flex", alignItems: "center" }}
              onPress={() => setMemberModalVisible(false)}
            >
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reporter Modal */}
      <Modal visible={reporterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign Reporter</Text>

            <ScrollView>
              {members.map((m) => {
                const user = m.user || m.User;
                return (
                  <TouchableOpacity
                    key={user.id_user}
                    style={styles.userRow}
                    onPress={() => assignReporter(user.id_user)}
                  >
                    <Text>{user.full_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={{ marginTop: 12, display: "flex", alignItems: "center" }}
              onPress={() => setReporterModalVisible(false)}
            >
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={20} color="#2563EB" />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function AgendaSection({ agenda, isManager, onAdd, onApprove, onReject, onOpen, onClose, onDelete }) {
  const [text, setText] = useState("");
  const [votesData, setVotesData] = useState({});

  useEffect(() => {
    loadVotesForAgenda();
  }, [agenda]);

  async function loadVotesForAgenda() {
    const votesMap = {};

    for (const point of (agenda?.points || [])) {
      try {
        const res = await voteAPI.getVotes(point.id_point);
        const stats = res.data.stats;

        votesMap[point.id_point] = {
          agree: stats.agree || 0,
          disagree: stats.disagree || 0,
          abstain: stats.abstain || 0,
        };
      } catch (err) {
        votesMap[point.id_point] = { agree: 0, disagree: 0, abstain: 0 };
      }
    }

    setVotesData(votesMap);
  }

  return (
    <View style={styles.section}>
      {(agenda?.points || []).map((p) => (
        <View key={p.id_point} style={styles.pointCard}>
          <Text style={styles.pointContent}>{p.content}</Text>
          <Text style={styles.pointState}>{p.state}</Text>

          {p.state === "open" && (
            <View style={styles.voteCountsContainer}>
              <View style={styles.voteCountItem}>
                <Text style={styles.voteCountValue}>{votesData[p.id_point]?.agree || 0}</Text>
                <Text style={styles.voteCountLabel}>Agree</Text>
              </View>
              <View style={styles.voteCountItem}>
                <Text style={styles.voteCountValue}>{votesData[p.id_point]?.disagree || 0}</Text>
                <Text style={styles.voteCountLabel}>Disagree</Text>
              </View>
              <View style={styles.voteCountItem}>
                <Text style={styles.voteCountValue}>{votesData[p.id_point]?.abstain || 0}</Text>
                <Text style={styles.voteCountLabel}>Abstain</Text>
              </View>
            </View>
          )}

          {isManager && (
            <View style={styles.pointActions}>
              {p.state === "pending" && (
                <>
                  <TouchableOpacity onPress={() => onApprove(p.id_point)}>
                    <MaterialIcons name="check" size={20} color="#16A34A" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onReject(p.id_point)}>
                    <MaterialIcons name="close" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </>
              )}

              {p.state === "approved" && (
                <TouchableOpacity onPress={() => onOpen(p.id_point)}>
                  <MaterialIcons name="how-to-vote" size={20} color="#2563EB" />
                </TouchableOpacity>
              )}

              {p.state === "open" && (
                <TouchableOpacity onPress={() => onClose(p.id_point)}>
                  <MaterialIcons name="lock" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => onDelete(p.id_point)}>
                <MaterialIcons name="delete" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <View style={styles.addBox}>
        <TextInput
          style={styles.input}
          placeholder="Add agenda point"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (!text.trim()) return;
            onAdd(text);
            setText("");
          }}
        >
          <Text style={styles.primaryBtnTxt}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VotesSection({ agenda, onVote }) {
  const [myVotes, setMyVotes] = useState({});

  const openPoints = (agenda?.points || []).filter((p) => p.state === "open");

  useEffect(() => {
    loadVotes();
  }, [agenda]);

  async function loadVotes() {
    try {
      const votesMap = {};

      await Promise.all(
        openPoints.map(async (point) => {
          try {
            const res = await voteAPI.getMyVote(point.id_point);
            votesMap[point.id_point] = res.data?.vote || null;
          } catch (err) {
            if (err?.response?.status !== 404) {
              console.log(err);
            }
            votesMap[point.id_point] = null;
          }
        })
      );

      setMyVotes(votesMap);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleVote(pointId, vote) {
    try {
      await onVote(pointId, vote);
      setMyVotes((prev) => ({ ...prev, [pointId]: vote }));
    } catch (err) {
      console.log(err);
    }
  }

  function renderVoteBadge(vote) {
    if (vote === "agree") {
      return (
        <View style={[styles.userVoteBadge, styles.userVoteAgree]}>
          <MaterialIcons name="check-circle" size={18} color="#16A34A" />
          <Text style={[styles.userVoteText, { color: "#16A34A" }]}>
            You voted: Agree
          </Text>
        </View>
      );
    }

    if (vote === "disagree") {
      return (
        <View style={[styles.userVoteBadge, styles.userVoteDisagree]}>
          <MaterialIcons name="cancel" size={18} color="#DC2626" />
          <Text style={[styles.userVoteText, { color: "#DC2626" }]}>
            You voted: Disagree
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.userVoteBadge, styles.userVoteAbstain]}>
        <MaterialIcons name="remove-circle" size={18} color="#6B7280" />
        <Text style={[styles.userVoteText, { color: "#6B7280" }]}>
          You voted: Abstain
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {openPoints.length === 0 && (
        <Text style={styles.emptyText}>No open voting points right now.</Text>
      )}

      {openPoints.map((p) => {
        const userVote = myVotes[p.id_point];

        return (
          <View key={p.id_point} style={styles.voteCard}>
            <Text style={styles.pointContent}>{p.content}</Text>

            {userVote ? (
              renderVoteBadge(userVote)
            ) : (
              <View style={styles.voteBtns}>
                <TouchableOpacity
                  style={[styles.voteBtn, styles.voteBtnAgree]}
                  onPress={() => handleVote(p.id_point, "agree")}
                >
                  <Text style={styles.voteBtnTxt}>Agree</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voteBtn, styles.voteBtnDisagree]}
                  onPress={() => handleVote(p.id_point, "disagree")}
                >
                  <Text style={styles.voteBtnTxt}>Disagree</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voteBtn, styles.voteBtnAbstain]}
                  onPress={() => handleVote(p.id_point, "abstain")}
                >
                  <Text style={styles.voteBtnTxt}>Abstain</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function AttendanceSection({ members, meetingId, currentUser, isManager, reload, meeting }) {
  async function confirm() {
    try {
      await meetingAPI.confirmAttendance(meetingId);

      await notificationAPI.createNotification({
        id_user: currentUser.id_user,
        content: "Your attendance for the meeting has been confirmed.",
      });

      reload();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to confirm attendance");
    }
  }

  async function validate(userId) {
    try {
      await meetingAPI.validateAttendance(meetingId, userId);

      await notificationAPI.createNotification({
        id_user: userId,
        content: `Your attendance for the meeting has been validated.`,
      });

      reload();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to validate attendance");
    }
  }

  return (
    <View style={styles.section}>
      {members.map((m) => {
        const user = m.user || m.User;
        const isMe = currentUser && user.id_user === currentUser.id_user;

        return (
          <View key={user.id_user} style={styles.memberCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{user.full_name}</Text>
              <Text>Confirmed: {m.confirmed ? "Yes" : "No"}</Text>
              <Text>Attended: {m.attended ? "Yes" : "No"}</Text>
            </View>

            <View style={{ gap: 8 }}>
              {isMe && !m.confirmed && (
                <TouchableOpacity style={styles.secondaryBtn} onPress={confirm}>
                  <Text style={styles.secondaryBtnTxt}>Confirm</Text>
                </TouchableOpacity>
              )}

              {currentUser?.id_user === meeting.creator_id && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => validate(user.id_user)}
                >
                  <Text style={styles.primaryBtnTxt}>Validate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {members.length === 0 && (
        <Text style={styles.emptyText}>No members in this meeting yet.</Text>
      )}
    </View>
  );
}

function DraftSection({ draft, onAdd, onEdit, onDelete }) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  function startEdit(point) {
    setEditingId(point.id_dpoint);
    setEditingText(point.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  async function saveEdit() {
    if (!editingText.trim()) return;
    await onEdit(editingId, editingText);
    setEditingId(null);
    setEditingText("");
  }

  return (
    <View style={styles.section}>
      {(draft?.points || []).map((p) => (
        <View key={p.id_dpoint} style={styles.pointCard}>
          {editingId === p.id_dpoint ? (
            <View style={{ gap: 8 }}>
              <TextInput
                style={styles.input}
                value={editingText}
                onChangeText={setEditingText}
                autoFocus
                multiline
              />
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.primaryBtn} onPress={saveEdit}>
                  <Text style={styles.primaryBtnTxt}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={cancelEdit}>
                  <Text style={styles.secondaryBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.pointContent}>{p.content}</Text>
              {p.author && (
                <Text style={styles.pointMeta}>By: {p.author.full_name}</Text>
              )}
              <View style={styles.pointActions}>
                <TouchableOpacity onPress={() => startEdit(p)}>
                  <MaterialIcons name="edit" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Delete Point", "Remove this draft point?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => onDelete(p.id_dpoint),
                      },
                    ])
                  }
                >
                  <MaterialIcons name="delete" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}

      <View style={styles.addBox}>
        <TextInput
          style={styles.input}
          placeholder="Add draft point"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (!text.trim()) return;
            onAdd(text);
            setText("");
          }}
        >
          <Text style={styles.primaryBtnTxt}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PVSection({ pv, isManager, onCreateFromDraft, onCreateEmpty, onAdd, hasDraftPoints, currentUser, meeting }) {
  const [text, setText] = useState("");

  if (!pv) {
    return (
      <View style={styles.section}>
        {isManager ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionLabel}>No PV created yet.</Text>

            {hasDraftPoints && (
              <TouchableOpacity style={styles.primaryBtn} onPress={onCreateFromDraft}>
                <MaterialIcons name="content-copy" size={18} color="#fff" />
                <Text style={styles.primaryBtnTxt}>Create PV from Draft</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={onCreateEmpty}>
              <MaterialIcons name="add-circle-outline" size={18} color="#2563EB" />
              <Text style={styles.secondaryBtnTxt}>Create Empty PV</Text>
            </TouchableOpacity>

            {!hasDraftPoints && (
              <Text style={styles.hintText}>
                Tip: Add draft points first to create a PV from draft.
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>No PV available for this meeting.</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {(pv.points || []).map((p, i) => (
        <View key={p.id_pv_point || i} style={styles.pointCard}>
          <Text style={styles.pointContent}>{p.content}</Text>
        </View>
      ))}

      {pv.points?.length === 0 && (
        <Text style={styles.emptyText}>No points in this PV yet.</Text>
      )}

      {meeting?.reporter_id === currentUser?.id_user && (
        <View style={styles.addBox}>
          <TextInput
            style={styles.input}
            placeholder="Add PV point"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              if (!text.trim()) return;
              onAdd(text);
              setText("");
            }}
          >
            <Text style={styles.primaryBtnTxt}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    paddingTop: 56,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginHorizontal: 12,
    color: "#111827",
  },

  card: { backgroundColor: "#fff", margin: 16, borderRadius: 18, padding: 18 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#111827" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  infoLabel: { fontSize: 12, color: "#6B7280" },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#111827" },

  actionsRow: { flexDirection: "row", gap: 12, marginTop: 16 },

  primaryBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "700" },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnTxt: { color: "#2563EB", fontWeight: "700" },

  statusActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  statusBtn: { backgroundColor: "#E5E7EB", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  voteStateBtn: { backgroundColor: "#DBEAFE", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },

  tabsContainer: { paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  tabBtn: { backgroundColor: "#E5E7EB", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  tabBtnActive: { backgroundColor: "#2563EB" },
  tabTxt: { color: "#374151", fontWeight: "600" },
  tabTxtActive: { color: "#fff" },

  section: { padding: 16, gap: 14 },
  sectionLabel: { fontSize: 15, color: "#6B7280", textAlign: "center" },

  pointCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16 },
  pointContent: { fontSize: 15, color: "#111827", marginBottom: 6 },
  pointMeta: { fontSize: 12, color: "#9CA3AF", marginBottom: 10 },
  pointState: { fontWeight: "700", color: "#2563EB", marginBottom: 12 },
  pointActions: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },

  addBox: { gap: 12 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, minHeight: 54 },

  voteCard: { backgroundColor: "#fff", padding: 16, borderRadius: 14, gap: 16 },
  voteBtns: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  voteBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  voteBtnAgree: { backgroundColor: "#D1FAE5" },
  voteBtnDisagree: { backgroundColor: "#FEE2E2" },
  voteBtnAbstain: { backgroundColor: "#E5E7EB" },
  voteBtnTxt: { fontWeight: "600", fontSize: 13 },

  memberCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  memberName: { fontWeight: "700", marginBottom: 4 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 18, maxHeight: "80%", padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },

  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  emptyText: { color: "#9CA3AF", textAlign: "center", fontSize: 14 },
  hintText: { color: "#6B7280", fontSize: 13, textAlign: "center" },
  warningText: { color: "#DC2626", textAlign: "center" },

  userVoteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  userVoteAgree: { backgroundColor: "#DCFCE7" },
  userVoteDisagree: { backgroundColor: "#FEE2E2" },
  userVoteAbstain: { backgroundColor: "#E5E7EB" },
  userVoteText: { fontWeight: "700", fontSize: 14 },

  voteCountsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
  },
  voteCountItem: { alignItems: "center", flex: 1 },
  voteCountValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  voteCountLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  cancel: { fontSize: 12, color: "red" },

  // ── Export PDF Button Styles ──
  exportPdfBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
  },
  exportPdfBtnTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});