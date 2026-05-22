import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";

import {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  userAPI,
  authAPI,
  notificationAPI,
} from "../../../services/api";

export default function Users() {

  const [users, setUsers] =
    useState([]);

  const [
    filteredUsers,
    setFilteredUsers,
  ] = useState([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [search, setSearch] =
    useState("");

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    editModal,
    setEditModal,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editForm, setEditForm] =
    useState({
      full_name: "",
      email: "",
    });

  async function load() {

    try {

      const [
        usersRes,
        meRes,
      ] = await Promise.all([
        userAPI.getAll(),
        authAPI.me(),
      ]);

      const allUsers =
        usersRes.data || [];

      setUsers(allUsers);

      setFilteredUsers(
        allUsers
      );

      setCurrentUser(
        meRes.data
      );

    } catch (err) {

      console.log(err);

      Alert.alert(
        "Error",
        err?.response?.data
          ?.msg ||
          "Failed to load users."
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

      setFilteredUsers(
        users
      );

      return;
    }

    const q =
      search.toLowerCase();

    setFilteredUsers(
      users.filter(
        (u) =>
          u.full_name
            ?.toLowerCase()
            .includes(q) ||
          u.email
            ?.toLowerCase()
            .includes(q)
      )
    );

  }, [search, users]);

  const onRefresh =
    useCallback(() => {

      setRefreshing(true);

      load();

    }, []);

  async function toggleAdmin(
    id_user
  ) {

    try {

      // CORRECTED: Just pass the ID, not an object
      await userAPI.toggleAdmin(id_user);

      // Notify the user whose admin status was changed
      const user = users.find(u => u.id_user === id_user);
      if (user) {
        await notificationAPI.createNotification({
          id_user: id_user,
          content: `Your admin status has been ${user.is_admin ? "removed" : "granted"}.`,
        });
      }

      load();

    } catch (err) {

      Alert.alert(
        "Error",
        err?.response?.data
          ?.msg ||
          "Failed to update role."
      );
    }
  }

  async function deleteUser(
    id_user
  ) {

    Alert.alert(
      "Delete User",
      "Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style:
            "destructive",

          onPress:
            async () => {

              try {

                await userAPI.delete(
                  id_user
                );

                load();

              } catch (
                err
              ) {

                Alert.alert(
                  "Error",
                  err
                    ?.response
                    ?.data
                    ?.msg ||
                    "Could not delete user."
                );
              }
            },
        },
      ]
    );
  }

  function openEdit(user) {

    setSelectedUser(user);

    setEditForm({
      full_name:
        user.full_name || "",

      email:
        user.email || "",
    });

    setEditModal(true);
  }

  async function saveUser() {

    if (
      !editForm.full_name.trim() ||
      !editForm.email.trim()
    ) {
      Alert.alert(
        "Error",
        "All fields required."
      );

      return;
    }

    setSaving(true);

    try {

      await userAPI.update(
        selectedUser.id_user,
        {
          full_name:
            editForm.full_name.trim(),

          email:
            editForm.email
              .trim()
              .toLowerCase(),
        }
      );

      // Notify the user whose profile was updated
      await notificationAPI.createNotification({
        id_user: selectedUser.id_user,
        content: "Your profile has been updated successfully.",
      });

      setEditModal(false);

      load();

    } catch (err) {

      Alert.alert(
        "Error",
        err?.response?.data
          ?.msg ||
          "Could not update user."
      );

    } finally {

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View
        style={
          styles.centered
        }
      >
        <ActivityIndicator
          size="large"
          color="#4F46E5"
        />
      </View>
    );
  }

  // backend protection
  if (!currentUser?.is_admin) {
    return (
      <View
        style={
          styles.denied
        }
      >

        <Ionicons
          name="lock-closed"
          size={48}
          color="#DC2626"
        />

        <Text
          style={
            styles.deniedTitle
          }
        >
          Access Denied
        </Text>

        <Text
          style={
            styles.deniedText
          }
        >
          Administrator access required.
        </Text>

      </View>
    );
  }

  return (
    <View style={styles.flex}>

      <FlatList
        data={filteredUsers}
        keyExtractor={(i) =>
          i.id_user.toString()
        }

        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
          />
        }

        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 120,
        }}

        ListHeaderComponent={
          <>

            {/* HEADER */}

            <View
              style={
                styles.header
              }
            >

              <Text
                style={
                  styles.page
                }
              >
                Users
              </Text>

              <View
                style={
                  styles.statsBadge
                }
              >
                <Text
                  style={
                    styles.statsText
                  }
                >
                  {
                    users.length
                  }{" "}
                  users
                </Text>
              </View>

            </View>

            {/* SEARCH */}

            <View
              style={
                styles.searchWrap
              }
            >

              <Ionicons
                name="search"
                size={18}
                color="#9CA3AF"
              />

              <TextInput
                style={
                  styles.searchInput
                }
                placeholder="Search users..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={
                  setSearch
                }
              />

            </View>

          </>
        }

        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >

            <Ionicons
              name="people-outline"
              size={44}
              color="#9CA3AF"
            />

            <Text
              style={
                styles.emptyTxt
              }
            >
              No users found
            </Text>

          </View>
        }

        renderItem={({ item }) => {

          const isSelf =
            currentUser?.id_user ===
            item.id_user;

          return (
            <View
              style={
                styles.card
              }
            >

              <View
                style={
                  styles.avatar
                }
              >
                <Text
                  style={
                    styles.avatarTxt
                  }
                >
                  {item.full_name
                    ?.slice(0, 1)
                    ?.toUpperCase()}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >

                <View
                  style={
                    styles.nameRow
                  }
                >

                  <Text
                    style={
                      styles.name
                    }
                  >
                    {
                      item.full_name
                    }
                  </Text>

                  {item.is_admin && (
                    <View
                      style={
                        styles.adminBadge
                      }
                    >
                      <Text
                        style={
                          styles.adminBadgeTxt
                        }
                      >
                        ADMIN
                      </Text>
                    </View>
                  )}

                </View>

                <Text
                  style={
                    styles.email
                  }
                >
                  {item.email}
                </Text>

                <Text
                  style={
                    styles.idTxt
                  }
                >
                  ID:
                  {" "}
                  {
                    item.id_user
                  }
                </Text>

              </View>

              {!isSelf && (
                <View
                  style={
                    styles.actions
                  }
                >

                  <TouchableOpacity
                    style={
                      styles.iconBtn
                    }
                    onPress={() =>
                      openEdit(
                        item
                      )
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color="#4F46E5"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleBtn,

                      item.is_admin &&
                        styles.roleBtnDanger,
                    ]}
                    onPress={() =>
                      toggleAdmin(
                        item.id_user
                      )
                    }
                  >
                    <Text
                      style={
                        styles.roleBtnTxt
                      }
                    >
                      {item.is_admin
                        ? "Remove"
                        : "Admin"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.deleteBtn
                    }
                    onPress={() =>
                      deleteUser(
                        item.id_user
                      )
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#DC2626"
                    />
                  </TouchableOpacity>

                </View>
              )}

            </View>
          );
        }}
      />

      {/* EDIT MODAL */}

      <Modal
        visible={editModal}
        transparent
        animationType="slide"
      >

        <View
          style={
            styles.overlay
          }
        >

          <View
            style={
              styles.modal
            }
          >

            <Text
              style={
                styles.modalTitle
              }
            >
              Edit User
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              value={
                editForm.full_name
              }
              onChangeText={(v) =>
                setEditForm(
                  (p) => ({
                    ...p,
                    full_name: v,
                  })
                )
              }
            />

            <TextInput
              style={
                styles.input
              }
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={
                editForm.email
              }
              onChangeText={(v) =>
                setEditForm(
                  (p) => ({
                    ...p,
                    email: v,
                  })
                )
              }
            />

            <View
              style={
                styles.modalActions
              }
            >

              <TouchableOpacity
                style={
                  styles.cancelBtn
                }
                onPress={() =>
                  setEditModal(
                    false
                  )
                }
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
                style={
                  styles.submitBtn
                }
                onPress={
                  saveUser
                }
                disabled={saving}
              >

                {saving ? (
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
                    Save
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

    denied: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#F3F4F6",
      padding: 24,
    },

    deniedTitle: {
      fontSize: 28,
      fontWeight: "800",
      marginTop: 20,
      color: "#111827",
    },

    deniedText: {
      marginTop: 8,
      color: "#6B7280",
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

    statsBadge: {
      backgroundColor:
        "#EEF2FF",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },

    statsText: {
      color: "#4F46E5",
      fontWeight: "700",
      fontSize: 12,
    },

    searchWrap: {
      flexDirection: "row",
      alignItems:
        "center",
      backgroundColor:
        "#fff",
      borderRadius: 18,
      paddingHorizontal: 14,
      marginBottom: 24,
    },

    searchInput: {
      flex: 1,
      paddingVertical: 14,
      paddingLeft: 10,
      color: "#111827",
    },

    card: {
      backgroundColor:
        "#fff",
      borderRadius: 22,
      padding: 18,
      marginBottom: 14,
      flexDirection: "row",
      alignItems:
        "center",
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor:
        "#EEF2FF",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 14,
    },

    avatarTxt: {
      fontSize: 18,
      fontWeight: "800",
      color: "#4F46E5",
    },

    nameRow: {
      flexDirection: "row",
      alignItems:
        "center",
      gap: 8,
    },

    name: {
      fontSize: 16,
      fontWeight: "700",
      color: "#111827",
    },

    adminBadge: {
      backgroundColor:
        "#111827",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    adminBadgeTxt: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },

    email: {
      fontSize: 13,
      color: "#6B7280",
      marginTop: 4,
    },

    idTxt: {
      marginTop: 4,
      fontSize: 11,
      color: "#9CA3AF",
    },

    actions: {
      marginLeft: 10,
      alignItems:
        "center",
      gap: 10,
    },

    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor:
        "#EEF2FF",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    roleBtn: {
      backgroundColor:
        "#4F46E5",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    roleBtnDanger: {
      backgroundColor:
        "#DC2626",
    },

    roleBtnTxt: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 11,
    },

    deleteBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor:
        "#FEF2F2",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    empty: {
      alignItems:
        "center",
      paddingTop: 120,
    },

    emptyTxt: {
      marginTop: 10,
      color: "#9CA3AF",
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
      marginBottom: 20,
    },

    input: {
      backgroundColor:
        "#F3F4F6",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 14,
      color: "#111827",
    },

    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },

    cancelBtn: {
      flex: 1,
      backgroundColor:
        "#F3F4F6",
      borderRadius: 14,
      paddingVertical: 15,
      alignItems:
        "center",
    },

    cancelTxt: {
      color: "#374151",
      fontWeight: "700",
    },

    submitBtn: {
      flex: 1,
      backgroundColor:
        "#4F46E5",
      borderRadius: 14,
      paddingVertical: 15,
      alignItems:
        "center",
    },

    submitTxt: {
      color: "#fff",
      fontWeight: "700",
    },
  });