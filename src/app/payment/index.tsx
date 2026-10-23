
import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const C = {
  bg: "#F3F7FF",
  white: "#FFFFFF",
  blue: "#087CF0",
  blueDark: "#075EC0",
  text: "#14213D",
  muted: "#69778F",
  border: "#DCE6F5",
  lightBlue: "#EAF3FF",
  green: "#16834A",
  lightGreen: "#E9F8EF",
};

export default function PaymentMethodsScreen() {
  const router = useRouter();

  function renderPaymentOption(
    title: string,
    subtitle: string,
    icon: keyof typeof Ionicons.glyphMap,
    route: "/payment/cod" | "/payment/upi" | "/payment/card",
    accent: string
  ) {
    return (
      <Pressable
        key={route}
        onPress={() => router.push(route)}
        style={({ pressed }) => [
          styles.option,
          pressed && styles.optionPressed,
        ]}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: accent + "18" },
          ]}
        >
          <Ionicons name={icon} size={27} color={accent} />
        </View>

        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={21}
          color={C.muted}
        />
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={C.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Payment Method</Text>
            <Text style={styles.headerSubtitle}>
              Choose how you want to pay
            </Text>
          </View>
        </View>

        {/* Secure banner */}
        <View style={styles.secureBanner}>
          <View style={styles.secureIcon}>
            <Ionicons
              name="shield-checkmark"
              size={25}
              color={C.green}
            />
          </View>

          <View style={styles.secureContent}>
            <Text style={styles.secureTitle}>
              Safe & Secure Checkout
            </Text>
            <Text style={styles.secureSubtitle}>
              Select your preferred payment method to continue.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Available Payment Options
        </Text>

        {renderPaymentOption(
          "Cash on Delivery",
          "Pay when your order arrives",
          "cash-outline",
          "/payment/cod",
          C.green
        )}

        {renderPaymentOption(
          "UPI Payment",
          "Google Pay, PhonePe and supported UPI apps",
          "phone-portrait-outline",
          "/payment/upi",
          C.blue
        )}

        {renderPaymentOption(
          "Credit / Debit Card",
          "Pay using your supported bank card",
          "card-outline",
          "/payment/card",
          "#7047C8"
        )}

        <View style={styles.securityNote}>
          <Ionicons
            name="lock-closed"
            size={19}
            color={C.green}
          />
          <Text style={styles.securityText}>
            Online payments are handled by Razorpay. Supplyhive
            should never store your card CVV or payment OTP.
          </Text>
        </View>

        <Pressable
          style={styles.backToCheckout}
          onPress={() => router.replace("/checkout")}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={C.blue}
          />
          <Text style={styles.backToCheckoutText}>
            Back to Checkout
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: C.white,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  headerText: {
    flex: 1,
    marginLeft: 13,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
  },
  secureBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 17,
    backgroundColor: C.lightGreen,
    borderWidth: 1,
    borderColor: "#BCE8CA",
    marginBottom: 27,
  },
  secureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  secureContent: {
    flex: 1,
    marginLeft: 12,
  },
  secureTitle: {
    color: C.green,
    fontSize: 14,
    fontWeight: "800",
  },
  secureSubtitle: {
    color: "#477458",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    marginBottom: 14,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 13,
  },
  optionPressed: {
    opacity: 0.75,
    borderColor: C.blue,
  },
  optionIcon: {
    width: 51,
    height: 51,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
    marginHorizontal: 13,
  },
  optionTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
  },
  optionSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    backgroundColor: C.lightBlue,
    borderRadius: 14,
    marginTop: 12,
  },
  securityText: {
    flex: 1,
    color: C.blueDark,
    fontSize: 12,
    lineHeight: 19,
  },
  backToCheckout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
    marginTop: 8,
  },
  backToCheckoutText: {
    color: C.blue,
    fontSize: 14,
    fontWeight: "800",
  },
});
