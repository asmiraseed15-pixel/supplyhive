
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
import { useRouter } from "expo-router";

const COLORS = {
  background: "#7AABF5",
  button: "#097AFA",
  black: "#000000",
  white: "#FFFFFF",
  border: "#315D91",
  placeholder: "#444444",
};

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

type ApiResponse = {
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
    phone?: string;
  };
  [key: string]: unknown;
};

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    data: ApiResponse | null,
    fallback: string
  ): string => {
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;

    if (data && typeof data === "object") {
      const firstKey = Object.keys(data)[0];

      if (firstKey) {
        const value = data[firstKey];

        if (Array.isArray(value)) {
          return String(value[0]);
        }

        if (typeof value === "string") {
          return value;
        }
      }
    }

    return fallback;
  };

  const readResponse = async (
    response: Response
  ): Promise<ApiResponse> => {
    return response.json().catch(() => ({} as ApiResponse));
  };

  // Step 1: Send an OTP to the supplied email address.
  const handleSendOtp = async () => {
    if (sendingOtp || verifyingOtp || submitting) return;

    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      showMessage("Please enter a valid email address.");
      return;
    }

    setSendingOtp(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to send OTP. Please try again.")
        );
      }

      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");

      showMessage(
        data.message || "OTP sent successfully. Please check your email.",
        "success"
      );
    } catch (error: unknown) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Cannot connect to the backend. Please check your server."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify the OTP using the Django verify-otp endpoint.
  const handleVerifyOtp = async () => {
    if (sendingOtp || verifyingOtp || submitting) return;

    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!otpSent) {
      showMessage("Please send an OTP to your email first.");
      return;
    }

    if (!/^\d{6}$/.test(normalizedOtp)) {
      showMessage("Please enter the 6-digit OTP from your email.");
      return;
    }

    setVerifyingOtp(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: normalizedOtp,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          getErrorMessage(data, "OTP verification failed. Please try again.")
        );
      }

      setOtpVerified(true);

      showMessage(
        data.message || "Email verified successfully.",
        "success"
      );
    } catch (error: unknown) {
      setOtpVerified(false);

      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify OTP. Please try again."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 3: Create the account after successful email verification.
  const handleRegister = async () => {
    if (submitting || sendingOtp || verifyingOtp) return;

    setMessage("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (!normalizedName || !normalizedEmail || !normalizedPhone) {
      showMessage("Please fill in your name, email and phone number.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(normalizedPhone)) {
      showMessage("Please enter a valid phone number.");
      return;
    }

    if (!otpSent) {
      showMessage("Please request an email OTP first.");
      return;
    }

    if (!otpVerified) {
      showMessage("Please verify your email OTP before registering.");
      return;
    }

    if (password.length < 8) {
      showMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      showMessage("Please accept the Terms and Conditions.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          password,
          confirmPassword,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          getErrorMessage(data, "Registration failed. Please try again.")
        );
      }

      // Save authentication data only if the backend actually returns it.
      const storageItems: [string, string][] = [];

      if (typeof data.access === "string") {
        storageItems.push(["supplyhive_access_token", data.access]);
      }

      if (typeof data.refresh === "string") {
        storageItems.push(["supplyhive_refresh_token", data.refresh]);
      }

      if (data.user && typeof data.user === "object") {
        storageItems.push([
          "supplyhive_user",
          JSON.stringify(data.user),
        ]);
      }

      if (storageItems.length > 0) {
        await AsyncStorage.multiSet(storageItems);
      }

      showMessage(
        data.message || "Your account has been created successfully.",
        "success"
      );

      // Allow the success message to be displayed before navigating.
      setTimeout(() => {
        router.replace("/login" as any);
      }, 1000);
    } catch (error: unknown) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Cannot connect to the backend. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: React.ComponentProps<typeof Ionicons>["name"],
    options?: {
      keyboardType?: "default" | "email-address" | "phone-pad";
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
      maxLength?: number;
    }
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <Ionicons
          name={icon}
          size={20}
          color={COLORS.black}
          style={styles.inputIcon}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={options?.keyboardType || "default"}
          autoCapitalize={options?.autoCapitalize || "none"}
          autoCorrect={false}
          maxLength={options?.maxLength}
          editable={!submitting}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle="dark-content"
       />

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

            {/* Tagline */}
            <View style={styles.taglineSection}>
              <Text style={styles.taglineLabel}>Tagline</Text>

              <Text style={styles.tagline}>
                Your Perfect Stationery Partner Is Just a Message Away.
              </Text>

              <Text style={styles.subtitle}>
                Create your account and make every idea count.
              </Text>
            </View>

            {/* Registration form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create an Account</Text>

              <Text style={styles.formDescription}>
                Enter your details to get started.
              </Text>

              {renderInput(
                "Full Name *",
                "Enter your full name",
                name,
                setName,
                "person-outline",
                { autoCapitalize: "words" }
              )}

              {renderInput(
                "Email Address *",
                "Enter your email address",
                email,
                (value) => {
                  setEmail(value);
                  setOtp("");
                  setOtpSent(false);
                  setOtpVerified(false);
                  setMessage("");
                },
                "mail-outline",
                { keyboardType: "email-address" }
              )}

              {renderInput(
                "Phone Number *",
                "Enter your phone number",
                phone,
                setPhone,
                "call-outline",
                {
                  keyboardType: "phone-pad",
                  maxLength: 20,
                }
              )}

              {/* Email OTP */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email OTP *</Text>

                <View style={styles.otpRow}>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.otpInputWrapper,
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={COLORS.black}
                      style={styles.inputIcon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor={COLORS.placeholder}
                      value={otp}
                      onChangeText={(value) => {
                        setOtp(value.replace(/\D/g, "").slice(0, 6));
                        setOtpVerified(false);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoCapitalize="none"
                      editable={!submitting && !otpVerified}
                    />
                  </View>

                  <Pressable
                    style={[
                      styles.otpButton,
                      (sendingOtp || verifyingOtp || submitting) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleSendOtp}
                    disabled={
                      sendingOtp || verifyingOtp || submitting
                    }
                  >
                    {sendingOtp ? (
                      <ActivityIndicator
                        color={COLORS.white}
                        size="small"
                      />
                    ) : (
                      <Text style={styles.otpButtonText}>
                        {otpSent ? "Resend OTP" : "Send OTP"}
                      </Text>
                    )}
                  </Pressable>
                </View>

                <Text style={styles.helperText}>
                  Request an OTP and check your email inbox.
                </Text>

                {otpSent && !otpVerified && (
                  <Pressable
                    style={[
                      styles.verifyButton,
                      verifyingOtp && styles.disabledButton,
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={verifyingOtp || submitting}
                  >
                    {verifyingOtp ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={18}
                          color={COLORS.white}
                        />
                        <Text style={styles.verifyButtonText}>
                          Verify Email OTP
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}

                {otpVerified && (
                  <View style={styles.verifiedRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color="#087A35"
                    />
                    <Text style={styles.verifiedText}>
                      Email verified successfully
                    </Text>
                  </View>
                )}
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
                    placeholder="Create a strong password"
                    placeholderTextColor={COLORS.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    editable={!submitting}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowPassword((value) => !value)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={21}
                      color={COLORS.black}
                    />
                  </Pressable>
                </View>

                <Text style={styles.helperText}>
                  Use at least 8 characters. Django password rules may
                  require additional conditions.
                </Text>
              </View>

              {/* Confirm password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password *</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.black}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor={COLORS.placeholder}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    editable={!submitting}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={21}
                      color={COLORS.black}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Terms */}
              <Pressable
                style={styles.termsRow}
                onPress={() =>
                  setAcceptedTerms((value) => !value)
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                disabled={submitting}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedTerms && styles.checkboxChecked,
                  ]}
                >
                  {acceptedTerms && (
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color={COLORS.white}
                    />
                  )}
                </View>

                <Text style={styles.termsText}>
                  I agree to the Terms and Conditions and Privacy Policy.
                </Text>
              </Pressable>

              {/* Success and error messages */}
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

                  <Text style={styles.messageText}>
                    {message}
                  </Text>
                </View>
              )}

              {/* Register button */}
              <Pressable
                style={[
                  styles.submitButton,
                  submitting && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={submitting || sendingOtp || verifyingOtp}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      Create Account
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={COLORS.white}
                    />
                  </>
                )}
              </Pressable>

              {/* Login navigation */}
              <View style={styles.signInRow}>
                <Text style={styles.signInText}>
                  Already have an account?{" "}
                </Text>

                <Pressable
                  onPress={() => router.replace("/login" as any)}
                  disabled={submitting}
                >
                  <Text style={styles.signInLink}>Sign In</Text>
                </Pressable>
              </View>

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
  taglineSection: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 22,
  },
  taglineLabel: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
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
    marginTop: 9,
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
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 6,
  },
  formDescription: {
    color: COLORS.black,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 23,
  },
  fieldGroup: {
    marginBottom: 17,
  },
  label: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    minHeight: 52,
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
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  otpInputWrapper: {
    flex: 1,
  },
  otpButton: {
    minHeight: 50,
    minWidth: 100,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: COLORS.button,
  },
  otpButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },
  verifyButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.button,
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },
  verifiedText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: "700",
  },
  helperText: {
    color: COLORS.black,
    fontSize: 12,
    marginTop: 7,
    lineHeight: 18,
  },
  eyeButton: {
    padding: 5,
    marginLeft: 5,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
    marginBottom: 17,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
  },
  termsText: {
    flex: 1,
    color: COLORS.black,
    fontSize: 13,
    lineHeight: 20,
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
    backgroundColor: "#F5D8D8",
  },
  successMessage: {
    backgroundColor: "#D8F5E0",
  },
  messageText: {
    flex: 1,
    color: COLORS.black,
    fontSize: 13,
    lineHeight: 19,
  },
  submitButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.button,
    borderRadius: 11,
    paddingHorizontal: 18,
    marginTop: 2,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.65,
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 22,
  },
  signInText: {
    color: COLORS.black,
    fontSize: 14,
  },
  signInLink: {
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
