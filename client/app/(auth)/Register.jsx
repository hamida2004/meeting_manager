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
  ScrollView,
} from "react-native";

import { useState } from "react";

import {
  useRouter,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";

import { authAPI } from "../../services/api";

export default function Register() {
  const router = useRouter();

  const { login } = useAuth();

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      confirm: "",
    });

  const [loading, setLoading] =
    useState(false);

  const set =
    (key) => (val) =>
      setForm((f) => ({
        ...f,
        [key]: val,
      }));

  async function handleRegister() {
    const {
      name,
      email,
      password,
      confirm,
    } = form;

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirm
    ) {
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

    setLoading(true);

    try {
      await authAPI.register({
        full_name:
          name.trim(),

        email:
          email.trim(),

        password,
      });

      await login(
        email.trim(),
        password
      );

      // Guard redirects automatically
    } catch (err) {
      Alert.alert(
        "Registration Failed",
        err?.response?.data
          ?.message ||
          "Something went wrong."
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
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View
            style={styles.logoWrap}
          >
            <Ionicons
              name="person-add-outline"
              size={38}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.title}>
            Create Account
          </Text>

          <Text
            style={styles.subtitle}
          >
            Join Meeting Manager
            and collaborate with
            your committees
          </Text>
        </View>

        {/* CARD */}

        <View style={styles.card}>
          {/* NAME */}

          <Text
            style={styles.label}
          >
            Full Name
          </Text>

          <View
            style={styles.inputWrap}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color="#9CA3AF"
            />

            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              value={form.name}
              onChangeText={set(
                "name"
              )}
            />
          </View>

          {/* EMAIL */}

          <Text
            style={[
              styles.label,
              {
                marginTop: 18,
              },
            ]}
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
              value={form.email}
              onChangeText={set(
                "email"
              )}
            />
          </View>

          {/* PASSWORD */}

          <Text
            style={[
              styles.label,
              {
                marginTop: 18,
              },
            ]}
          >
            Password
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
              value={form.password}
              onChangeText={set(
                "password"
              )}
            />
          </View>

          {/* CONFIRM */}

          <Text
            style={[
              styles.label,
              {
                marginTop: 18,
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
              value={form.confirm}
              onChangeText={set(
                "confirm"
              )}
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
              handleRegister
            }
            disabled={loading}
            activeOpacity={0.8}
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
                  Create Account
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* LOGIN */}

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.linkText}
          >
            Already have an
            account?{" "}
            <Text style={styles.link}>
              Sign In
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
      flexGrow: 1,
      justifyContent:
        "center",

      paddingHorizontal: 24,
      paddingVertical: 42,
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

      marginBottom: 26,
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

    linkText: {
      textAlign: "center",
      fontSize: 14,
      color: "#6B7280",
    },

    link: {
      color: "#4F46E5",
      fontWeight: "700",
    },
  });