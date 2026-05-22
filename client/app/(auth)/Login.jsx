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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import {
  useState,
} from "react";

import {
  useRouter,
} from "expo-router";

import {
  useAuth,
} from "../../context/AuthContext";

export default function Login() {

  const router =
    useRouter();

  const { login } =
    useAuth();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin() {

    Keyboard.dismiss();

    if (
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        "Missing Fields",
        "Please fill all fields."
      );

      return;
    }

    try {

      setLoading(true);

      await login(
        email,
        password
      );

      router.replace(
        "/(tabs)/(Home)"
      );

    } catch (err) {

      console.log(
        err?.response?.data ||
          err
      );

      Alert.alert(
        "Login Failed",
        err?.response?.data?.msg ||
          "Invalid credentials"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
    >

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
        >

          <View style={styles.header}>
            <Text style={styles.logo}>
              📋
            </Text>

            <Text style={styles.title}>
              Meeting Manager
            </Text>

            <Text
              style={styles.subtitle}
            >
              Sign in to continue
            </Text>
          </View>

          <View style={styles.card}>

            <Text style={styles.label}>
              Email
            </Text>

            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>
              Password
            </Text>

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

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() =>
                router.push(
                  "/(auth)/ResetPwd"
                )
              }
            >
              <Text
                style={styles.forgotText}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>

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
            >

              {loading ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <Text
                  style={styles.btnText}
                >
                  Sign In
                </Text>
              )}

            </TouchableOpacity>

          </View>

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

    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor:
      "#F9FAFB",
  },

  container: {
    flexGrow: 1,
    justifyContent:
      "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  logo: {
    fontSize: 52,
    marginBottom: 8,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    backgroundColor:
      "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 22,
  },

  forgotText: {
    color: "#4F46E5",
    fontWeight: "600",
    fontSize: 13,
  },

  btn: {
    backgroundColor:
      "#4F46E5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  btnDisabled: {
    opacity: 0.6,
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
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