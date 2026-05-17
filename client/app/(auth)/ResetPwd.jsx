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
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import { authAPI } from "../../services/api";

export default function ResetPwd() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  async function handleRequest() {
    if (!email.trim()) {
      Alert.alert(
        "Error",
        "Please enter your email."
      );
      return;
    }

    setLoading(true);

    try {
      await authAPI.requestReset({
        email: email.trim(),
      });

      setSent(true);
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data
          ?.message ||
          "Could not send reset email."
      );
    } finally {
      setLoading(false);
    }
  }

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#111827"
          />
        </TouchableOpacity>

        <View style={styles.header}>
          <View
            style={styles.iconWrap}
          >
            <Ionicons
              name="key-outline"
              size={34}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.title}>
            Reset Password
          </Text>

          <Text
            style={styles.subtitle}
          >
            Enter your email and
            we'll send you a reset
            link.
          </Text>
        </View>

        {sent ? (
          <View
            style={
              styles.successCard
            }
          >
            <View
              style={
                styles.successIconWrap
              }
            >
              <Ionicons
                name="checkmark"
                size={36}
                color="#10B981"
              />
            </View>

            <Text
              style={
                styles.successTitle
              }
            >
              Email Sent
            </Text>

            <Text
              style={
                styles.successMsg
              }
            >
              Check your inbox for
              the password reset
              link.
            </Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={() =>
                router.replace(
                  "/(auth)/Login"
                )
              }
            >
              <Text
                style={
                  styles.btnText
                }
              >
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text
              style={styles.label}
            >
              Email Address
            </Text>

            <View
              style={styles.inputWrap}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color="#9CA3AF"
              />

              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.btn,
                loading &&
                  styles.btnDisabled,
              ]}
              onPress={
                handleRequest
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={
                    styles.btnText
                  }
                >
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
      paddingHorizontal: 24,
      paddingTop: 34,
      paddingBottom: 32,
    },

    backBtn: {
      width: 46,
      height: 46,

      borderRadius: 16,

      backgroundColor:
        "#fff",

      justifyContent:
        "center",

      alignItems: "center",

      marginBottom: 36,
    },

    header: {
      alignItems: "center",
      marginBottom: 36,
    },

    iconWrap: {
      width: 86,
      height: 86,

      borderRadius: 28,

      backgroundColor:
        "#EEF2FF",

      justifyContent:
        "center",

      alignItems: "center",

      marginBottom: 18,
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
      paddingHorizontal: 20,
    },

    card: {
      backgroundColor:
        "#fff",

      borderRadius: 26,

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

    btn: {
      backgroundColor:
        "#4F46E5",

      borderRadius: 16,

      paddingVertical: 15,

      alignItems: "center",

      marginTop: 24,
    },

    btnDisabled: {
      opacity: 0.6,
    },

    btnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15,
    },

    successCard: {
      backgroundColor:
        "#fff",

      borderRadius: 26,

      padding: 32,

      alignItems: "center",
    },

    successIconWrap: {
      width: 88,
      height: 88,

      borderRadius: 28,

      backgroundColor:
        "#ECFDF5",

      justifyContent:
        "center",

      alignItems: "center",

      marginBottom: 22,
    },

    successTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#111827",
      marginBottom: 10,
    },

    successMsg: {
      fontSize: 14,
      color: "#6B7280",
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
    },
  });