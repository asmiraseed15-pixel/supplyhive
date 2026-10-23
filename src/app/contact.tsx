

import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CommonFooter from "../components/CommonFooter";

const C = {
  bg: "#F7F9FF",
  container: "#D3DFF8",
  blue: "#097AFA",
  field: "#7AABF5",
  black: "#111827",
  white: "#FFFFFF",
  muted: "#64748B",
  border: "#D8E2F3",
};

const EMAILS = [
  "asmiraseed15@gmail.com",
  "afzalakram1@gmail.com",
];

const PHONES = ["9344418518", "8220418021"];

const LOCATION = "Lalpet, Cuddalore District, Tamil Nadu, India";

// Local testing: http://127.0.0.1:8000
// Production: set EXPO_PUBLIC_API_URL to your public backend URL.
const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000")
    .trim()
    .replace(/\/+$/, "");

const CONTACT_API_URL = `${API_BASE_URL}/api/contact/`;

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSuccess, setStatusSuccess] = useState(false);

  const showStatus = (text: string, success = false) => {
    setStatusMessage(text);
    setStatusSuccess(success);

    if (Platform.OS !== "web") {
      Alert.alert(success ? "Success" : "Notice", text);
    }
  };

  const openEmail = async (address: string) => {
    const url =
      Platform.OS === "web"
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(address)}`
        : `mailto:${address}`;

    try {
      await Linking.openURL(url);
    } catch {
      showStatus(`Please email us at ${address}`);
    }
  };

  const openPhone = async (number: string) => {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      showStatus(`Please call ${number}`);
    }
  };

  const openLocation = async () => {
    const url =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(LOCATION)}`;

    try {
      await Linking.openURL(url);
    } catch {
      showStatus(LOCATION);
    }
  };

  const sendMessage = async () => {
    if (submitting) return;

    setStatusMessage("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      showStatus(
        "Please enter your name, email address, and message."
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      showStatus("Please enter a valid email address.");
      return;
    }

    if (name.trim().length > 150 || phone.trim().length > 20) {
      showStatus("Please check your name and phone number length.");
      return;
    }

    if (message.trim().length > 5000) {
      showStatus("Your message is too long.");
      return;
    }

    setSubmitting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      let response: Response;

      try {
        response = await fetch(CONTACT_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            message: message.trim(),
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
            `The server returned error ${response.status}.`
        );
      }

      if (result.success !== true) {
        throw new Error(
          result.message || "The server could not send your message."
        );
      }

      showStatus(
        "Message successfully sent! Thank you for contacting Supplyhive.",
        true
      );

      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      console.error("Contact form submission failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "";

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        showStatus(
          "The request timed out. Please check your backend and try again, or email asmiraseed15@gmail.com."
        );
      } else if (
        errorMessage.toLowerCase().includes("failed to fetch") ||
        errorMessage.toLowerCase().includes("network request failed")
      ) {
        showStatus(
          "Cannot connect to the contact server. Check your backend URL, server status, and CORS settings. You can email asmiraseed15@gmail.com."
        );
      } else {
        showStatus(
          `${errorMessage || "Unable to send your message."} Please contact asmiraseed15@gmail.com if the problem continues.`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO */}
        <View style={styles.hero}>
          <Image
            source={require("../../assets/phone.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />

          <Text style={styles.heroQuote}>
            “Your Perfect Stationery Partner Is Just a Message Away.”
          </Text>

          <Text style={styles.eyebrow}>WE'RE HERE TO HELP</Text>

          <Text style={styles.heroTitle}>
            Get in <Text style={styles.heroTitleBlue}>Touch</Text>
          </Text>

          <Text style={styles.heroDescription}>
            Have a question about Supplyhive? Our team is ready
            to help you with your stationery and supply needs.
          </Text>
        </View>

        {/* CONTACT DETAILS */}
        <View style={styles.contactDetailsSection}>
          <Text style={styles.contactDetailsTitle}>
            Contact Details
          </Text>

          <Text style={styles.contactDetailsSubtitle}>
            We're here to help with all your stationery needs.
          </Text>

          <View style={styles.infoGrid}>
            <Pressable onPress={openLocation} style={styles.infoCard}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="location-outline" size={28} color={C.white} />
              </View>
              <Text style={styles.infoTitle}>Location</Text>
              <Text style={styles.infoDescription}>{LOCATION}</Text>
              <Text style={styles.contactCardLink}>View Location</Text>
            </Pressable>

            <View style={styles.infoCard}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="mail-outline" size={28} color={C.white} />
              </View>
              <Text style={styles.infoTitle}>Email Us</Text>
              <Text style={styles.infoDescription}>
                Have a question? Send us an email.
              </Text>

              {EMAILS.map((address) => (
                <Pressable
                  key={address}
                  onPress={() => openEmail(address)}
                  style={styles.contactLink}
                >
                  <Text style={styles.contactCardLink}>{address}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.infoCard}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="call-outline" size={28} color={C.white} />
              </View>
              <Text style={styles.infoTitle}>Contact Us</Text>
              <Text style={styles.infoDescription}>
                Talk to our team directly.
              </Text>

              {PHONES.map((number) => (
                <Pressable
                  key={number}
                  onPress={() => openPhone(number)}
                  style={styles.contactLink}
                >
                  <Text style={styles.contactCardLink}>{number}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* MAP */}
        <View style={styles.mapSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Find Our Location</Text>
            <Text style={styles.sectionDescription}>
              Visit us in Lalpet, Tamil Nadu.
            </Text>
          </View>

          <Pressable onPress={openLocation} style={styles.mapCard}>
            <View style={styles.mapDecoration}>
              <View style={styles.mapRoadHorizontal} />
              <View style={styles.mapRoadVertical} />
              <View style={styles.mapRoadDiagonal} />
              <View style={styles.mapBlockOne} />
              <View style={styles.mapBlockTwo} />
              <View style={styles.mapBlockThree} />
              <View style={styles.mapBlockFour} />

              <View style={styles.mapPin}>
                <Ionicons name="location" size={34} color={C.blue} />
              </View>
            </View>

            <View style={styles.mapBottom}>
              <View style={styles.mapTextContainer}>
                <Text style={styles.mapTitle}>Supplyhive</Text>
                <Text style={styles.mapAddress}>{LOCATION}</Text>
              </View>

              <View style={styles.mapButton}>
                <Ionicons name="navigate-outline" size={20} color={C.white} />
              </View>
            </View>
          </Pressable>

          <Text style={styles.mapNote}>
            Tap the map preview to open Google Maps.
          </Text>
        </View>

        {/* CONTACT FORM */}
        <View style={styles.formSection}>
          <View style={styles.formHeading}>
            <Text style={styles.sectionTitle}>Send Us a Message</Text>
            <Text style={styles.sectionDescription}>
              Fill in the form and let us know how we can help.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={C.black} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#40516B"
                style={styles.input}
                autoCapitalize="words"
                maxLength={150}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.fieldLabel}>Email Address *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={C.black} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor="#40516B"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={C.black} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#40516B"
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={20}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.fieldLabel}>Your Message *</Text>
            <View style={[styles.inputWrapper, styles.messageWrapper]}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={20}
                color={C.black}
                style={styles.messageIcon}
              />
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="How can we help you?"
                placeholderTextColor="#40516B"
                style={[styles.input, styles.messageInput]}
                multiline
                textAlignVertical="top"
                maxLength={5000}
              />
            </View>

            <Text style={styles.requiredNote}>* Required fields</Text>

            <Pressable
              onPress={sendMessage}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !submitting && styles.submitButtonPressed,
                submitting && styles.submitButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <Ionicons name="paper-plane-outline" size={19} color={C.white} />
              )}

              <Text style={styles.submitButtonText}>
                {submitting ? "Sending..." : "Send Message"}
              </Text>
            </Pressable>

            {statusMessage ? (
              <View
                style={[
                  styles.statusBox,
                  statusSuccess ? styles.statusSuccess : styles.statusError,
                ]}
              >
                <Ionicons
                  name={
                    statusSuccess
                      ? "checkmark-circle-outline"
                      : "alert-circle-outline"
                  }
                  size={20}
                  color={statusSuccess ? "#166534" : "#B91C1C"}
                />

                <Text
                  style={[
                    styles.statusText,
                    { color: statusSuccess ? "#166534" : "#B91C1C" },
                  ]}
                >
                  {statusMessage}
                </Text>
              </View>
            ) : null}

            <Text style={styles.formNote}>
              Your message will be submitted to our contact service.
            </Text>
          </View>
        </View>

        {/* QUICK HELP */}
        <View style={styles.helpCard}>
          <View style={styles.helpIcon}>
            <Ionicons name="headset-outline" size={26} color={C.blue} />
          </View>

          <View style={styles.helpTextContainer}>
            <Text style={styles.helpTitle}>Need immediate assistance?</Text>
            <Text style={styles.helpDescription}>
              Contact our team directly by email or phone.
            </Text>
          </View>

          <Pressable
            onPress={() => openEmail(EMAILS[0])}
            style={styles.helpButton}
          >
            <Text style={styles.helpButtonText}>Email Us</Text>
          </Pressable>
        </View>

        <CommonFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingBottom: 0,
    backgroundColor: C.bg,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: "center",
  },
  heroImage: {
    width: "400%",
    maxWidth: 800,
    height: 280,
    alignSelf: "center",
    marginBottom: 20,
  },
  heroQuote: {
    color: C.black,
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 36,
    textAlign: "center",
    maxWidth: 650,
    alignSelf: "center",
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  eyebrow: {
    color: C.blue,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: "center",
  },
  heroTitle: {
    color: C.black,
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1,
  },
  heroTitleBlue: {
    color: C.blue,
  },
  heroDescription: {
    color: C.muted,
    fontSize: 15,
    lineHeight: 25,
    textAlign: "center",
    maxWidth: 650,
    marginTop: 14,
  },
  contactDetailsSection: {
    marginHorizontal: 20,
    marginBottom: 35,
    padding: 22,
    backgroundColor: "#7AABF5",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#6799E6",
  },
  contactDetailsTitle: {
    color: C.black,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  contactDetailsSubtitle: {
    color: "#172A46",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  infoCard: {
    width: Platform.OS === "web" ? 250 : "100%",
    maxWidth: 340,
    flexGrow: 1,
    backgroundColor: "#097AFA",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  contactIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  infoTitle: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  infoDescription: {
    color: "#000000",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  contactLink: {
    alignItems: "center",
    paddingVertical: 5,
  },
  contactCardLink: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  mapSection: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },
  sectionHeading: {
    marginBottom: 17,
  },
  sectionTitle: {
    color: C.black,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sectionDescription: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  mapCard: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#EAF1FA",
  },
  mapDecoration: {
    height: 205,
    backgroundColor: "#E8F0E8",
    overflow: "hidden",
    position: "relative",
  },
  mapRoadHorizontal: {
    position: "absolute",
    left: -20,
    right: -20,
    top: 85,
    height: 27,
    backgroundColor: C.white,
    transform: [{ rotate: "-8deg" }],
  },
  mapRoadVertical: {
    position: "absolute",
    width: 23,
    height: 280,
    left: "49%",
    top: -35,
    backgroundColor: C.white,
    transform: [{ rotate: "23deg" }],
  },
  mapRoadDiagonal: {
    position: "absolute",
    width: 500,
    height: 15,
    left: -40,
    top: 150,
    backgroundColor: "#D4DDE7",
    transform: [{ rotate: "-18deg" }],
  },
  mapBlockOne: {
    position: "absolute",
    width: 72,
    height: 48,
    left: "10%",
    top: 20,
    backgroundColor: "#D2E2D0",
    borderRadius: 8,
  },
  mapBlockTwo: {
    position: "absolute",
    width: 75,
    height: 46,
    right: "9%",
    top: 25,
    backgroundColor: "#D2E2D0",
    borderRadius: 8,
  },
  mapBlockThree: {
    position: "absolute",
    width: 65,
    height: 37,
    left: "13%",
    bottom: 16,
    backgroundColor: "#D2E2D0",
    borderRadius: 8,
  },
  mapBlockFour: {
    position: "absolute",
    width: 76,
    height: 36,
    right: "11%",
    bottom: 18,
    backgroundColor: "#D2E2D0",
    borderRadius: 8,
  },
  mapPin: {
    position: "absolute",
    top: 58,
    left: "50%",
    marginLeft: -22,
    width: 44,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
    borderRadius: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 5,
  },
  mapBottom: {
    backgroundColor: C.white,
    paddingHorizontal: 18,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  mapTextContainer: {
    flex: 1,
  },
  mapTitle: {
    color: C.black,
    fontSize: 17,
    fontWeight: "800",
  },
  mapAddress: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  mapButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  mapNote: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },
  formHeading: {
    marginBottom: 18,
  },
  formCard: {
    backgroundColor: C.container,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  fieldLabel: {
    color: C.black,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 9,
    marginTop: 15,
  },
  inputWrapper: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B4C9EB",
    backgroundColor: C.field,
  },
  input: {
    flex: 1,
    color: C.black,
    fontSize: 14,
    paddingVertical: 14,
    minWidth: 0,
    ...(Platform.OS === "web"
      ? ({ outlineStyle: "none" } as any)
      : {}),
  },
  messageWrapper: {
    minHeight: 145,
    alignItems: "flex-start",
    paddingTop: 14,
  },
  messageIcon: {
    marginTop: 2,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  requiredNote: {
    color: C.muted,
    fontSize: 12,
    marginTop: 12,
  },
  submitButton: {
    minHeight: 54,
    marginTop: 20,
    borderRadius: 13,
    backgroundColor: C.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "800",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 13,
    borderRadius: 12,
    marginTop: 14,
  },
  statusSuccess: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  statusError: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  formNote: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 12,
  },
  helpCard: {
    marginHorizontal: 20,
    marginBottom: 35,
    padding: 18,
    borderRadius: 18,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  helpIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: "#E8F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  helpTextContainer: {
    flex: 1,
    minWidth: 150,
  },
  helpTitle: {
    color: C.black,
    fontSize: 14,
    fontWeight: "800",
  },
  helpDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  helpButton: {
    backgroundColor: "#E8F1FF",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  helpButtonText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: "800",
  },
});
