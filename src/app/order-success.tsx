
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function OrderSuccessScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Ionicons
            name="checkmark"
            size={58}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.title}>Order Placed Successfully!</Text>

        <Text style={styles.subtitle}>
          Thank you for shopping with Supplyhive.
          Your order details have been saved.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons
            name="cube-outline"
            size={28}
            color="#126EED"
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>What's next?</Text>
            <Text style={styles.infoText}>
              Your order is currently pending confirmation.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.primaryButtonText}>
            Continue Shopping
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
          />
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.secondaryButtonText}>
            Back to Home
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#172033",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 28,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 26,
    gap: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#172033",
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    marginTop: 5,
  },
  primaryButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#126EED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    padding: 16,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#126EED",
    fontSize: 14,
    fontWeight: "700",
  },
});
