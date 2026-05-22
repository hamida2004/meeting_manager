import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  committeeAPI,
  userAPI,
  meetingAPI,
} from "../../../../services/api";

export default function CommitteeDetails() {

  const router =
    useRouter();

  const { id } =
    useLocalSearchParams();

  const [
    committee,
    setCommittee,
  ] = useState(null);

  const [users, setUsers] =
    useState([]);

  const [
    meetings,
    setMeetings,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    memberModal,
    setMemberModal,
  ] = useState(false);

  async function load() {

    try {

      const [
        committeeRes,
        usersRes,
        meetingsRes,
      ] = await Promise.all([
        committeeAPI.getOne(id),
        userAPI.getAll(),
        meetingAPI.getGrouped(),
      ]);

      setCommittee(
        committeeRes.data
      );

      setUsers(
        usersRes.data || []
      );

      // extract committee meetings
      const grouped =
        meetingsRes.data || [];

      const current =
        grouped.find(
          (g) =>
            g.committee
              ?.id_committee ==
            id
        );

      setMeetings(
        current?.meetings || []
      );

    } catch (err) {

      console.log(err);

      Alert.alert(
        "Error",
        err?.response?.data
          ?.msg ||
          "Failed to load committee."
      );

    } finally {

      setLoading(false);

      setRefreshing(false);
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

  async function addMember(
    userId
  ) {

    try {

      await committeeAPI.addMembers(
        id,
        {
          members: [
            userId,
          ],
        }
      );

      await load();

      setMemberModal(false);

    } catch (err) {

      Alert.alert(
        "Error",
        err?.response?.data
          ?.msg ||
          "Failed to add member."
      );
    }
  }

  async function removeMember(
    userId
  ) {

    Alert.alert(
      "Remove Member",
      "Remove this member?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Remove",
          style:
            "destructive",

          onPress:
            async () => {

              try {

                await committeeAPI.removeMember(
                  id,
                  userId
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
                    "Failed"
                );
              }
            },
        },
      ]
    );
  }

  async function changePresident(
    userId
  ) {

    Alert.alert(
      "Change President",
      "Assign this member as committee president?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Confirm",

          onPress:
            async () => {

              try {

                await committeeAPI.changePresident(
                  id,
                  {
                    new_president_id:
                      userId,
                  }
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
                    "Failed"
                );
              }
            },
        },
      ]
    );
  }

  async function deleteCommittee() {

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

          style:
            "destructive",

          onPress:
            async () => {

              try {

                await committeeAPI.delete(
                  id
                );

                router.back();

              } catch (
                err
              ) {

                Alert.alert(
                  "Error",
                  err
                    ?.response
                    ?.data
                    ?.msg ||
                    "Failed"
                );
              }
            },
        },
      ]
    );
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

  const availableUsers =
    users.filter(
      (u) =>
        !committee.members.some(
          (m) =>
            m.user
              .id_user ===
            u.id_user
        )
    );

  return (
    <View style={styles.flex}>

      <FlatList
        data={
          committee.members || []
        }
        keyExtractor={(i) =>
          i.user.id_user.toString()
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
          paddingBottom: 140,
        }}

        ListHeaderComponent={
          <>

            {/* HEADER */}

            <View
              style={
                styles.header
              }
            >

              <View
                style={{
                  flex: 1,
                }}
              >

                <Text
                  style={
                    styles.title
                  }
                >
                  {
                    committee.name
                  }
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  {
                    committee.members
                      ?.length || 0
                  }{" "}
                  members
                </Text>

              </View>

              <TouchableOpacity
                style={
                  styles.deleteBtn
                }
                onPress={
                  deleteCommittee
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#DC2626"
                />
              </TouchableOpacity>

            </View>

            {/* MEETINGS */}

            <View
              style={
                styles.section
              }
            >

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Meetings
              </Text>

              {meetings.length ===
              0 ? (
                <View
                  style={
                    styles.emptyBox
                  }
                >
                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    No meetings
                  </Text>
                </View>
              ) : (
                meetings.map(
                  (m) => (
                    <TouchableOpacity
                      key={
                        m.id_meeting
                      }
                      style={
                        styles.meetingCard
                      }
                      onPress={() =>
                        router.push(
                          `/meeting/${m.id_meeting}`
                        )
                      }
                    >

                      <View
                        style={{
                          flex: 1,
                        }}
                      >

                        <Text
                          style={
                            styles.meetingTitle
                          }
                        >
                          {
                            m.title
                          }
                        </Text>

                        <Text
                          style={
                            styles.meetingMeta
                          }
                        >
                          {
                            m.status
                          }
                        </Text>

                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9CA3AF"
                      />

                    </TouchableOpacity>
                  )
                )
              )}

            </View>

            {/* MEMBERS TITLE */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Members
            </Text>

          </>
        }

        ListEmptyComponent={
          <View
            style={
              styles.emptyBox
            }
          >
            <Text
              style={
                styles.emptyText
              }
            >
              No members
            </Text>
          </View>
        }

        renderItem={({
          item,
        }) => {

          const isPresident =
            committee.president
              ?.id_user ===
            item.user
              .id_user;

          return (
            <View
              style={
                styles.card
              }
            >

              <View
                style={{
                  flex: 1,
                }}
              >

                <Text
                  style={
                    styles.name
                  }
                >
                  {
                    item.user
                      .full_name
                  }
                </Text>

                <Text
                  style={
                    styles.email
                  }
                >
                  {
                    item.user
                      .email
                  }
                </Text>

                {isPresident && (
                  <View
                    style={
                      styles.badge
                    }
                  >
                    <Text
                      style={
                        styles.badgeText
                      }
                    >
                      PRESIDENT
                    </Text>
                  </View>
                )}

              </View>

              {!isPresident && (
                <>

                  <TouchableOpacity
                    style={
                      styles.iconBtn
                    }
                    onPress={() =>
                      changePresident(
                        item
                          .user
                          .id_user
                      )
                    }
                  >
                    <Ionicons
                      name="shield-outline"
                      size={20}
                      color="#4F46E5"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.iconBtn
                    }
                    onPress={() =>
                      removeMember(
                        item
                          .user
                          .id_user
                      )
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#DC2626"
                    />
                  </TouchableOpacity>

                </>
              )}

            </View>
          );
        }}
      />

      {/* FAB */}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          setMemberModal(
            true
          )
        }
      >
        <Ionicons
          name="person-add"
          size={28}
          color="#fff"
        />
      </TouchableOpacity>

      {/* ADD MEMBER MODAL */}

      <Modal
        visible={
          memberModal
        }
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
              Add Member
            </Text>

            <ScrollView>

              {availableUsers.length ===
              0 ? (
                <View
                  style={
                    styles.emptyBox
                  }
                >
                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    No available users
                  </Text>
                </View>
              ) : (
                availableUsers.map(
                  (u) => (
                    <TouchableOpacity
                      key={
                        u.id_user
                      }
                      style={
                        styles.userRow
                      }
                      onPress={() =>
                        addMember(
                          u.id_user
                        )
                      }
                    >

                      <Text
                        style={
                          styles.userName
                        }
                      >
                        {
                          u.full_name
                        }
                      </Text>

                      <Text
                        style={
                          styles.userEmail
                        }
                      >
                        {
                          u.email
                        }
                      </Text>

                    </TouchableOpacity>
                  )
                )
              )}

            </ScrollView>

            <TouchableOpacity
              style={
                styles.closeBtn
              }
              onPress={() =>
                setMemberModal(
                  false
                )
              }
            >
              <Text
                style={
                  styles.closeText
                }
              >
                Close
              </Text>
            </TouchableOpacity>

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
      alignItems:
        "center",
      marginBottom: 24,
    },

    title: {
      fontSize: 30,
      fontWeight: "800",
      color: "#111827",
      marginBottom: 6,
    },

    subtitle: {
      fontSize: 15,
      color: "#6B7280",
    },

    section: {
      marginBottom: 30,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#111827",
      marginBottom: 16,
    },

    deleteBtn: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor:
        "#FEF2F2",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    meetingCard: {
      backgroundColor:
        "#fff",
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems:
        "center",
    },

    meetingTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111827",
    },

    meetingMeta: {
      marginTop: 4,
      fontSize: 12,
      color: "#6B7280",
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

    name: {
      fontSize: 16,
      fontWeight: "700",
      color: "#111827",
    },

    email: {
      marginTop: 4,
      fontSize: 13,
      color: "#6B7280",
    },

    badge: {
      marginTop: 10,
      alignSelf:
        "flex-start",
      backgroundColor:
        "#EEF2FF",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },

    badgeText: {
      color: "#4F46E5",
      fontWeight: "700",
      fontSize: 11,
    },

    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        "#F9FAFB",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginLeft: 10,
    },

    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor:
        "#4F46E5",
      justifyContent:
        "center",
      alignItems:
        "center",
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
      maxHeight: "75%",
    },

    modalTitle: {
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 20,
    },

    userRow: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor:
        "#F3F4F6",
    },

    userName: {
      fontSize: 15,
      fontWeight: "700",
    },

    userEmail: {
      marginTop: 4,
      fontSize: 13,
      color: "#6B7280",
    },

    closeBtn: {
      backgroundColor:
        "#4F46E5",
      borderRadius: 16,
      paddingVertical: 16,
      alignItems:
        "center",
      marginTop: 20,
    },

    closeText: {
      color: "#fff",
      fontWeight: "700",
    },

    emptyBox: {
      backgroundColor:
        "#fff",
      borderRadius: 18,
      padding: 24,
      alignItems:
        "center",
    },

    emptyText: {
      color: "#9CA3AF",
    },
  });