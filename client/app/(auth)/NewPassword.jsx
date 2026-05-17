import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useState } from "react";

import {
  useRouter,
  useLocalSearchParams,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import { authAPI } from "../../services/api";

export default function NewPassword() {
  const router = useRouter();

  const { token } =
    useLocalSearchParams();

  const [password, setPassword] =
    useState("");

  const [confirm, setConfirm] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleReset() {
    if (!password || !confirm) {
      Alert.alert(
        "Error",
        "Please fill in all fields."
      );

      return;
    }

    if (password !== confirm) {
      Alert.alert(
        "Error",
        "Passwords do not match."
      );

      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Error",
        "Password must be at least 6 characters."
      );

      return;
    }

    if (!token) {
      Alert.alert(
        "Error",
        "Invalid or missing reset token."
      );

      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        token,
        password,
      });

      Alert.alert(
        "Success",
        "Password updated successfully.",
        [
          {
            text: "OK",

            onPress: () =>
              router.replace(
                "/(auth)/Login"
              ),
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data
          ?.message ||
          "Could not reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  const strength =
    password.length < 6
      ? "Weak"
      : password.length < 10
      ? "Medium"
      : "Strong";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={styles.logoWrap}
          >
            <Ionicons
              name="lock-closed-outline"
              size={38}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.title}>
            New Password
          </Text>

          <Text
            style={styles.subtitle}
          >
            Create a strong password
            for your account
          </Text>
        </View>

        <View style={styles.card}>
          {/* PASSWORD */}

          <Text
            style={styles.label}
          >
            New Password
          </Text>

          <View
            style={styles.inputWrap}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#9CA3AF"
            />

            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={
                setPassword
              }
            />
          </View>

          {/* STRENGTH */}

          {password.length > 0 && (
            <View
              style={
                styles.strengthWrap
              }
            >
              <View
                style={
                  styles.strengthBars
                }
              >
                {[1, 2, 3, 4].map(
                  (i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,

                        password.length >=
                          i * 3 &&
                          styles.strengthActive,

                        password.length >=
                          10 &&
                          styles.strengthStrong,
                      ]}
                    />
                  )
                )}
              </View>

              <Text
                style={
                  styles.strengthText
                }
              >
                {strength}
              </Text>
            </View>
          )}

          {/* CONFIRM */}

          <Text
            style={[
              styles.label,
              {
                marginTop: 20,
              },
            ]}
          >
            Confirm Password
          </Text>

          <View
            style={styles.inputWrap}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#9CA3AF"
            />

            <TextInput
              style={styles.input}
              placeholder="Repeat password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={confirm}
              onChangeText={
                setConfirm
              }
            />
          </View>

          {/* BUTTON */}

          <TouchableOpacity
            style={[
              styles.btn,
              loading &&
                styles.btnDisabled,
            ]}
            onPress={
              handleReset
            }
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text
                  style={
                    styles.btnText
                  }
                >
                  Update Password
                </Text>

                <Ionicons
                  name="checkmark"
                  size={18}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor:
        "#F3F4F6",
    },

    container: {
      flex: 1,

      justifyContent:
        "center",

      paddingHorizontal: 24,
    },

    header: {
      alignItems: "center",
      marginBottom: 36,
    },

    logoWrap: {
      width: 96,
      height: 96,

      borderRadius: 30,

      backgroundColor:
        "#EEF2FF",

      justifyContent:
        "center",

      alignItems: "center",

      marginBottom: 20,
    },

    title: {
      fontSize: 30,
      fontWeight: "800",
      color: "#111827",
      letterSpacing: -0.7,
    },

    subtitle: {
      fontSize: 14,
      color: "#6B7280",
      textAlign: "center",
      marginTop: 10,
      lineHeight: 22,
      paddingHorizontal: 18,
    },

    card: {
      backgroundColor:
        "#fff",

      borderRadius: 28,

      padding: 22,

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
    },

    label: {
      fontSize: 13,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 10,
    },

    inputWrap: {
      flexDirection: "row",
      alignItems: "center",

      backgroundColor:
        "#F9FAFB",

      borderRadius: 16,

      borderWidth: 1,
      borderColor: "#E5E7EB",

      paddingHorizontal: 14,
    },

    input: {
      flex: 1,

      paddingVertical: 14,

      marginLeft: 10,

      fontSize: 15,
      color: "#111827",
    },

    strengthWrap: {
      marginTop: 12,
    },

    strengthBars: {
      flexDirection: "row",
      gap: 5,
    },

    strengthBar: {
      flex: 1,

      height: 5,

      borderRadius: 999,

      backgroundColor:
        "#E5E7EB",
    },

    strengthActive: {
      backgroundColor:
        "#F59E0B",
    },

    strengthStrong: {
      backgroundColor:
        "#10B981",
    },

    strengthText: {
      marginTop: 8,

      fontSize: 12,

      color: "#6B7280",

      fontWeight: "600",
    },

    btn: {
      backgroundColor:
        "#4F46E5",

      borderRadius: 18,

      paddingVertical: 16,

      flexDirection: "row",

      justifyContent:
        "center",

      alignItems: "center",

      gap: 8,

      marginTop: 28,
    },

    btnDisabled: {
      opacity: 0.6,
    },

    btnText: {
      color: "#fff",

      fontWeight: "700",

      fontSize: 15,
    },
  });