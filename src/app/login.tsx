
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

const COLORS = {
  background: "#7AABF5",
  button: "#097AFA",
  black: "#000000",
  white: "#FFFFFF",
  border: "#315D91",
  placeholder: "#444444",
  errorBackground: "#F5D8D8",
  successBackground: "#D8F5E0",
  logout: "#DC2626",
};

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

type LoginResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  detail?: string;
  access?: string;
  refresh?: string;
  user?: {
    id: number | string;
    name?: string;
    email: string;
    [key: string]: unknown;
  };
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string | string[] }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error"
  );

  const showMessage = (
    text: string,
    type: "error" | "success" = "error"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const getErrorMessage = (
    data: LoginResponse | null,
    fallback: string
  ): string => {
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
    return fallback;
  };

  // LOGOUT
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setMessage("");

    try {
      await AsyncStorage.multiRemove([
        "supplyhive_access_token",
        "supplyhive_refresh_token",
        "supplyhive_user",
        "supplyhive_remember_me",
        "access_token",
        "refresh_token",
      ]);

      setEmail("");
      setPassword("");
      setShowPassword(false);
      setRememberMe(false);

      showMessage("Logged out successfully!", "success");
    } catch {
      showMessage("Logout failed. Please try again.", "error");
    } finally {
      setLoggingOut(false);
    }
  };

  // LOGIN
  const handleLogin = async () => {
    if (loading || loggingOut) return;

    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showMessage("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      showMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data: LoginResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallback =
          response.status === 401
            ? "Invalid email or password."
            : response.status === 403
            ? "Your account is inactive."
            : response.status >= 500
            ? "Server error. Please try again later."
            : "Login failed. Please try again.";

        throw new Error(getErrorMessage(data, fallback));
      }

      if (!data.access || !data.refresh || !data.user) {
        throw new Error(
          "Login response is missing authentication tokens. Please check the backend."
        );
      }

      await AsyncStorage.multiSet([
        ["supplyhive_access_token", data.access],
        ["supplyhive_refresh_token", data.refresh],
        ["supplyhive_user", JSON.stringify(data.user)],
        ["supplyhive_remember_me", rememberMe ? "true" : "false"],
        ["access_token", data.access],
        ["refresh_token", data.refresh],
      ]);

      showMessage("Login successful!", "success");

      const requestedNext = Array.isArray(params.next)
        ? params.next[0]
        : params.next;

      const nextPage =
        typeof requestedNext === "string" &&
        requestedNext.startsWith("/") &&
        !requestedNext.startsWith("//")
          ? requestedNext
          : "/home";

      router.replace(nextPage as any);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to connect to the backend.";

      if (
        errorMessage.toLowerCase().includes("network request failed") ||
        errorMessage.toLowerCase().includes("failed to fetch")
      ) {
        showMessage(
          `Cannot connect to the backend at ${API_URL}. Check that the server is running and the API URL is correct.`
        );
      } else {
        showMessage(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Banner */}
            <View style={styles.bannerCard}>
              <Image
                source={require("../../assets/banner.png")}
                style={styles.bannerImage}
                resizeMode="cover"
                accessibilityLabel="Supplyhive stationery banner"
              />
            </View>

            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.taglineLabel}>WELCOME TO SUPPLYHIVE</Text>

              <Text style={styles.tagline}>
                Your Perfect Stationery Partner Is Just a Message Away.
              </Text>

              <Text style={styles.subtitle}>
                Sign in to continue your stationery shopping.
              </Text>
            </View>

            {/* Login form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Welcome Back!</Text>

              <Text style={styles.formDescription}>
                Enter your details to sign in to your account.
              </Text>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email Address *</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={COLORS.black}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor={COLORS.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    editable={!loading && !loggingOut}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password *</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.black}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    editable={!loading && !loggingOut}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((value) => !value)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading || loggingOut}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={21}
                      color={COLORS.black}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Remember me and Forgot Password */}
              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberRow}
                  onPress={() => setRememberMe((value) => !value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  disabled={loading || loggingOut}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={COLORS.white}
                      />
                    )}
                  </View>

                  <Text style={styles.rememberText}>Remember me</Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    showMessage(
                      "Password reset is not configured yet. Please contact Supplyhive support."
                    )
                  }
                  disabled={loading || loggingOut}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
              </View>

              {/* Status message */}
              {!!message && (
                <View
                  accessibilityRole="alert"
                  style={[
                    styles.messageBox,
                    messageType === "success"
                      ? styles.successMessage
                      : styles.errorMessage,
                  ]}
                >
                  <Ionicons
                    name={
                      messageType === "success"
                        ? "checkmark-circle-outline"
                        : "alert-circle-outline"
                    }
                    size={19}
                    color={COLORS.black}
                  />

                  <Text style={styles.messageText}>{message}</Text>
                </View>
              )}

              {/* Sign in button */}
              <Pressable
                style={[
                  styles.loginButton,
                  (loading || loggingOut) && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={loading || loggingOut}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={COLORS.white}
                    />
                  </>
                )}
              </Pressable>

              {/* Logout button */}
              <Pressable
                style={[
                  styles.logoutButton,
                  (loading || loggingOut) && styles.disabledButton,
                ]}
                onPress={handleLogout}
                disabled={loading || loggingOut}
                accessibilityRole="button"
              >
                {loggingOut ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </>
                )}
              </Pressable>

              {/* Register navigation */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>
                  Don't have an account?{" "}
                </Text>

                <Pressable
                  onPress={() => router.push("/register" as any)}
                  disabled={loading || loggingOut}
                >
                  <Text style={styles.registerLink}>Create Account</Text>
                </Pressable>
              </View>

              {/* Footer divider */}
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>SUPPLYHIVE</Text>
                <View style={styles.divider} />
              </View>

              <Text style={styles.bottomText}>
                Your ideas deserve the right supplies.
              </Text>
            </View>

            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Supplyhive. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },
  container: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  bannerCard: {
    width: "100%",
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 22,
    paddingBottom: 24,
  },
  taglineLabel: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  tagline: {
    color: COLORS.black,
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 34,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.black,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },
  formCard: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    color: COLORS.black,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  formDescription: {
    color: COLORS.black,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 19,
  },
  label: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 13,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.black,
  },
  eyeButton: {
    padding: 5,
    marginLeft: 5,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
  },
  rememberText: {
    color: COLORS.black,
    fontSize: 13,
  },
  forgotText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
    gap: 8,
  },
  errorMessage: {
    backgroundColor: COLORS.errorBackground,
  },
  successMessage: {
    backgroundColor: COLORS.successBackground,
  },
  messageText: {
    flex: 1,
    color: COLORS.black,
    fontSize: 13,
    lineHeight: 19,
  },
  loginButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.button,
    borderRadius: 11,
    paddingHorizontal: 18,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
  logoutButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.logout,
    borderRadius: 11,
    paddingHorizontal: 18,
    marginTop: 12,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.65,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 23,
  },
  registerText: {
    color: COLORS.black,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  bottomText: {
    color: COLORS.black,
    fontSize: 13,
    textAlign: "center",
    marginTop: 14,
  },
  footerText: {
    color: COLORS.black,
    fontSize: 12,
    textAlign: "center",
    marginTop: 22,
  },
});
