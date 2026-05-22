import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
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
  committeeAPI,
  userAPI,
} from "../../../services/api";

export default function Committees() {

  const router =
    useRouter();

  const [
    committees,
    setCommittees,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    createModal,
    setCreateModal,
  ] = useState(false);

  const [creating, setCreating] =
    useState(false);

  const [name, setName] =
    useState("");
    
  const [users, setUsers] = 
    useState([]);
    
  const [presidentId, setPresidentId] = 
    useState(null);

  async function load() {

    try {

      const { data } =
        await committeeAPI.getAll();

      setCommittees(data || []);

    } catch (err) {

      Alert.alert(
        "Error",
        err?.response?.data?.msg ||
          "Failed to load committees."
      );

    } finally {

      setLoading(false);

      setRefreshing(false);
    }
  }
  
  async function loadUsers() {
    try {
      const { data } = await userAPI.getAll();
      setUsers(data || []);
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to load users for president selection."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onRefresh =
    useCallback(() => {

      setRefreshing(true);

      load();

    }, []);

  async function createCommittee() {

    if (!name.trim()) {
      Alert.alert(
        "Error",
        "Committee name required."
      );

      return;
    }
    
    if (!presidentId) {
      Alert.alert(
        "Error",
        "President selection required."
      );
      
      return;
    }

    setCreating(true);

    try {

      await committeeAPI.create({
        name: name.trim(),
        president_id: presidentId,
      });

      setCreateModal(false);
      setName("");
      setPresidentId(null);
      setUsers([]);

      load();

    } catch (err) {

      Alert.alert(
        "Error",
        err?.response?.data?.msg ||
          "Could not create committee."
      );

    } finally {

      setCreating(false);
    }
  }
  
  function renderPresidentSelection() {
    return (
      <View style={styles.presidentContainer}>
        <Text style={styles.label}>Select President</Text>
        <ScrollView style={styles.userList}>
          {users.map(user => (
            <TouchableOpacity
              key={user.id_user}
              style={[
                styles.userItem,
                presidentId === user.id_user && styles.userItemSelected
              ]}
              onPress={() => setPresidentId(user.id_user)}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {user.full_name?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.full_name}
                </Text>
                <Text style={styles.userEmail}>
                  {user.email}
                </Text>
              </View>
              {presidentId === user.id_user && (
                <Ionicons name="checkmark" size={24} color="#4F46E5" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  async function deleteCommittee(id) {

    Alert.alert(
      "Delete Committee",
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

              await committeeAPI.delete(
                id
              );

              load();

            } catch (err) {

              Alert.alert(
                "Error",
                err?.response?.data
                  ?.msg ||
                  "Could not delete committee."
              );
            }
          },
        },
      ]
    );
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
    <View style={styles.flex}>

      <FlatList
        data={committees}
        keyExtractor={(i) =>
          i.id_committee.toString()
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
          paddingBottom: 120,
        }}

        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.page}>
              Committees
            </Text>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setCreateModal(true);
                loadUsers();
              }}
            >
              <Ionicons
                name="add"
                size={18}
                color="#fff"
              />

              <Text
                style={styles.addBtnTxt}
              >
                New
              </Text>
            </TouchableOpacity>
          </View>
        }

        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="layers-outline"
              size={42}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTxt}>
              No committees
            </Text>
          </View>
        }

        renderItem={({ item }) => (

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                `/(tabs)/(Manage)/committee/${item.id_committee}`
              )
            }
          >

            <View style={{ flex: 1 }}>

              <Text style={styles.name}>
                {item.name}
              </Text>

              <Text
                style={styles.president}
              >
                President:
                {" "}
                {item.president
                  ?.full_name ||
                  "—"}
              </Text>

              <Text
                style={styles.members}
              >
                Members:
                {" "}
                {item.members_count ||
                  item.members
                    ?.length ||
                  0}
              </Text>

            </View>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() =>
                deleteCommittee(
                  item.id_committee
                )
              }
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#DC2626"
              />
            </TouchableOpacity>

          </TouchableOpacity>
        )}
      />

      {/* CREATE MODAL */}

      <Modal
        visible={createModal}
        transparent
        animationType="slide"
        onDismiss={() => {
          setName("");
          setPresidentId(null);
          setUsers([]);
        }}
      >

        <View style={styles.overlay}>

          <View style={styles.modal}>

            <Text
              style={styles.modalTitle}
            >
              Create Committee
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Committee name"
              placeholderTextColor="#9CA3AF"
            />
            
            {renderPresidentSelection()}

            <View
              style={styles.modalActions}
            >

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setCreateModal(false);
                  setName("");
                  setPresidentId(null);
                  setUsers([]);
                }}
              >
                <Text
                  style={
                    styles.cancelTxt
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={
                  createCommittee
                }
                disabled={creating}
              >

                {creating ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={
                      styles.submitTxt
                    }
                  >
                    Create
                  </Text>
                )}

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

    </View>
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
      alignItems:
        "center",
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
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
      backgroundColor:
        "#4F46E5",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      gap: 6,
    },

    addBtnTxt: {
      color: "#fff",
      fontWeight: "700",
    },

    card: {
      backgroundColor:
        "#fff",
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
    },

    name: {
      fontSize: 18,
      fontWeight: "800",
      color: "#111827",
    },

    president: {
      fontSize: 13,
      color: "#6B7280",
      marginTop: 6,
    },

    members: {
      fontSize: 12,
      color: "#9CA3AF",
      marginTop: 4,
    },

    deleteBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor:
        "#FEF2F2",
    },

    empty: {
      alignItems: "center",
      paddingTop: 120,
    },

    emptyTxt: {
      marginTop: 12,
      color: "#9CA3AF",
      fontSize: 15,
    },

    overlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.4)",
      justifyContent:
        "flex-end",
    },

    modal: {
      backgroundColor:
        "#fff",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
    },

    modalTitle: {
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 18,
    },

    input: {
      backgroundColor:
        "#F3F4F6",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 15,
      marginBottom: 16,
    },
    
    presidentContainer: {
      marginBottom: 16,
    },
    
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: "#374151",
      marginBottom: 8,
    },
    
    userList: {
      maxHeight: 200,
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
    },
    
    userItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    },
    
    userItemSelected: {
      backgroundColor: "#EEF2FF",
    },
    
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#EEF2FF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    
    avatarText: {
      color: "#4F46E5",
      fontWeight: "bold",
    },
    
    userInfo: {
      flex: 1,
    },
    
    userName: {
      fontWeight: "600",
      color: "#111827",
    },
    
    userEmail: {
      fontSize: 12,
      color: "#6B7280",
      marginTop: 2,
    },

    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 22,
    },

    cancelBtn: {
      flex: 1,
      backgroundColor:
        "#F3F4F6",
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
    },

    cancelTxt: {
      fontWeight: "700",
      color: "#374151",
    },

    submitBtn: {
      flex: 1,
      backgroundColor:
        "#4F46E5",
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
    },

    submitTxt: {
      color: "#fff",
      fontWeight: "700",
    },
  });