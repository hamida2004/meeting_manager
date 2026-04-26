import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useState } from "react";
import { useTranslation } from "@/context/langContext";

export default function MeetingsScreen() {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [meetings, setMeetings] = useState([
    {
      id: "1",
      title: "Charity Event",
      date: "2026-03-10",
      time: "14:00",
      status: "upcoming",
      agenda: [
        {
          id: "a1",
          text: "Choose location",
          votes: { accept: 0, reject: 0, abstain: 0 },
        },
      ],
    },
  ]);

  // 🆕 Create form states
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [agendaInput, setAgendaInput] = useState("");
  const [agendaList, setAgendaList] = useState([]);

  // Filter
  const filtered = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.date.includes(search)
  );

  // ➕ Add agenda point inside modal
  const addAgendaPoint = () => {
    if (!agendaInput) return;

    setAgendaList([
      ...agendaList,
      {
        id: Date.now().toString(),
        text: agendaInput,
        votes: { accept: 0, reject: 0, abstain: 0 },
      },
    ]);

    setAgendaInput("");
  };

  // ✅ Create meeting
  const createMeeting = () => {
    if (!newTitle || !newDate || !newTime) {
      alert(t("fillAllFields"));
      return;
    }

    const newMeeting = {
      id: Date.now().toString(),
      title: newTitle,
      date: newDate,
      time: newTime,
      status: "upcoming",
      agenda: agendaList,
    };

    setMeetings([newMeeting, ...meetings]);

    // reset
    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setAgendaList([]);
    setModalVisible(false);
  };

  const renderMeeting = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.date} - {item.time}</Text>

      {/* Agenda */}
      {item.agenda.map((a) => (
        <View key={a.id} style={styles.agendaItem}>
          <Text>{a.text}</Text>

          {item.status === "voting" && (
            <View style={styles.voteRow}>
              <Text>✔ {t("accept")} {a.votes.accept}</Text>
              <Text>✖ {t("reject")} {a.votes.reject}</Text>
              <Text>– {t("abstain")} {a.votes.abstain}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Actions */}
      <View style={styles.actions}>
        <Text style={styles.action}>{t("edit")}</Text>
        <Text style={styles.action}>{t("delete")}</Text>
        <Text style={styles.action}>{t("launchVote")}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* Search */}
      <TextInput
        placeholder={t("search")}
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: "#fff" }}>+ {t("create")}</Text>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderMeeting}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.title}>{t("createMeeting")}</Text>

          <TextInput
            placeholder={t("title")}
            style={styles.input}
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <TextInput
            placeholder={t("date")}
            style={styles.input}
            value={newDate}
            onChangeText={setNewDate}
          />

          <TextInput
            placeholder={t("time")}
            style={styles.input}
            value={newTime}
            onChangeText={setNewTime}
          />

          {/* Agenda input */}
          <TextInput
            placeholder={t("addPoint")}
            style={styles.input}
            value={agendaInput}
            onChangeText={setAgendaInput}
          />

          <TouchableOpacity style={styles.addBtn} onPress={addAgendaPoint}>
            <Text style={{ color: "#fff" }}>{t("add")}</Text>
          </TouchableOpacity>

          {/* Agenda preview */}
          {agendaList.map((a) => (
            <Text key={a.id}>• {a.text}</Text>
          ))}

          <TouchableOpacity style={styles.createBtn} onPress={createMeeting}>
            <Text style={{ color: "#fff" }}>{t("createMeeting")}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={{ color: "blue", marginTop: 10 }}>
              {t("close")}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingVertical: 60 },

  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  createBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  addBtn: {
    backgroundColor: "#34A853",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  title: { fontSize: 18, fontWeight: "bold" },

  agendaItem: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 6,
  },

  voteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },

  action: { color: "#007AFF" },

  modal: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});