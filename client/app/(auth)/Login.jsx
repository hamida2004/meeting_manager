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

export default function Login() {
  const router = useRouter();

  const { login } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin() {
    if (
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        "Error",
        "Please fill in all fields."
      );

      return;
    }

    setLoading(true);

    try {
      await login(
        email.trim(),
        password
      );

      // DO NOT NAVIGATE HERE
      // Guard handles redirect
    } catch (err) {
      console.log(
        err?.response?.data || err
      );

      Alert.alert(
        "Login Failed",
        err?.response?.data
          ?.msg ||
          "Invalid credentials."
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
              name="clipboard-outline"
              size={38}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.title}>
            Meeting Manager
          </Text>

          <Text
            style={styles.subtitle}
          >
            Sign in to access your
            meetings and committees
          </Text>
        </View>

        {/* CARD */}

        <View style={styles.card}>
          {/* EMAIL */}

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
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={
                setPassword
              }
            />
          </View>

          {/* FORGOT */}

          <TouchableOpacity
            style={
              styles.forgotBtn
            }
            onPress={() =>
              router.push(
                "/(auth)/ResetPwd"
              )
            }
          >
            <Text
              style={
                styles.forgotText
              }
            >
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* BUTTON */}

          <TouchableOpacity
            style={[
              styles.btn,
              loading &&
                styles.btnDisabled,
            ]}
            onPress={
              handleLogin
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
                  Sign In
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

        {/* REGISTER */}

        <TouchableOpacity
          onPress={() =>
            router.push(
              "/(auth)/Register"
            )
          }
        >
          <Text
            style={styles.linkText}
          >
            Don't have an account?{" "}
            <Text style={styles.link}>
              Register
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

    forgotBtn: {
      alignSelf: "flex-end",

      marginTop: 12,
      marginBottom: 26,
    },

    forgotText: {
      fontSize: 13,

      color: "#4F46E5",

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