import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../context/langContext";

export default function HomeScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  const meetings = [
    {
      id: "1",
      title: "Charity Event",
      date: "2026-03-10",
      status: "upcoming",
    },
  ];

  // 🔁 Cycle languages: en → fr → ar
  const switchLanguage = () => {
    if (language === "en") setLanguage("fr");
    else if (language === "fr") setLanguage("ar");
    else setLanguage("en");
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/meeting/${item.id}`)}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>{t("upcomingMeetings")}</Text>

        <View style={styles.iconsRow}>
          {/* 🌐 Language Switch */}
          <TouchableOpacity onPress={switchLanguage}>
            <Ionicons name="language-outline" size={26} />
          </TouchableOpacity>

          {/* 🔔 Notifications */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/Notifications")}
          >
            <Ionicons name="notifications-outline" size={26} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Meetings List */}
      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>{t("noMeetings")}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingVertical: 60 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  iconsRow: {
    flexDirection: "row",
    gap: 12,
  },

  header: {
    fontSize: 22,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
});