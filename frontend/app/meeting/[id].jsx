import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "../../context/langContext";

export default function MeetingDetails() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();

  const [agenda, setAgenda] = useState([
    {
      id: "a1",
      text: t("chooseLocation"),
      votes: { accept: 0, reject: 0, abstain: 0 },
      userVote: null,
    },
  ]);

  const [newPoint, setNewPoint] = useState("");

  const addAgendaPoint = () => {
    if (!newPoint) return;

    setAgenda([
      ...agenda,
      {
        id: Date.now().toString(),
        text: newPoint,
        votes: { accept: 0, reject: 0, abstain: 0 },
        userVote: null,
      },
    ]);

    setNewPoint("");
  };

  const vote = (itemId, type) => {
    setAgenda((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.userVote) return item;

        return {
          ...item,
          userVote: type,
          votes: {
            ...item.votes,
            [type]: item.votes[type] + 1,
          },
        };
      })
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t("meeting")} #{id}
      </Text>

      <TextInput
        placeholder={t("addPoint")}
        value={newPoint}
        onChangeText={setNewPoint}
        style={styles.input}
      />

      <TouchableOpacity style={styles.addBtn} onPress={addAgendaPoint}>
        <Text style={{ color: "#fff" }}>{t("add")}</Text>
      </TouchableOpacity>

      {agenda.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text>{item.text}</Text>

          <View style={styles.voteRow}>
            <TouchableOpacity onPress={() => vote(item.id, "accept")}>
              <Text>✔ {t("accept")} {item.votes.accept}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => vote(item.id, "reject")}>
              <Text>✖ {t("reject")} {item.votes.reject}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => vote(item.id, "abstain")}>
              <Text>– {t("abstain")} {item.votes.abstain}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16,paddingVertical:60 },

  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  addBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  voteRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
});