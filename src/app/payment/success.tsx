

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

const LAST_ORDER_KEY = "supplyhive_last_order";
const CART_KEY = "supplyhive_cart";
const CHECKOUT_ITEMS_KEY = "supplyhive_checkout_items";

export default function PaymentSuccessScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    orderId?: string;
    orderNumber?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [resolvedOrderId, setResolvedOrderId] = useState("");
  const [resolvedAmount, setResolvedAmount] = useState(
    params.amount || "0.00"
  );
  const [resolvedMethod, setResolvedMethod] = useState(
    params.method || "Payment"
  );

  useEffect(() => {
    let active = true;

    const loadOrderDetails = async () => {
      try {
        const savedOrderText = await AsyncStorage.getItem(LAST_ORDER_KEY);

        let savedOrder: any = null;

        if (savedOrderText) {
          try {
            savedOrder = JSON.parse(savedOrderText);
          } catch {
            savedOrder = null;
          }
        }

        const paramOrderId =
          typeof params.orderId === "string"
            ? params.orderId
            : typeof params.orderNumber === "string"
            ? params.orderNumber
            : "";

        const savedOrderId = savedOrder
          ? String(
              savedOrder.order_number ||
                savedOrder.orderNumber ||
                savedOrder.order_id ||
                savedOrder.id ||
                ""
            )
          : "";

        const orderId = paramOrderId || savedOrderId;

        const amount =
          params.amount ||
          (savedOrder?.total_amount != null
            ? String(savedOrder.total_amount)
            : savedOrder?.total != null
            ? String(savedOrder.total)
            : "0.00");

        const method =
          params.method ||
          savedOrder?.payment_method ||
          savedOrder?.method ||
          "Payment";

        // Clear cart after reaching the success page.
        await AsyncStorage.multiRemove([
          CART_KEY,
          CHECKOUT_ITEMS_KEY,
        ]);

        if (active) {
          setResolvedOrderId(orderId);
          setResolvedAmount(amount);
          setResolvedMethod(String(method).toUpperCase());
        }
      } catch (error) {
        console.log("Could not load order details:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOrderDetails();

    return () => {
      active = false;
    };
  }, [
    params.amount,
    params.method,
    params.orderId,
    params.orderNumber,
  ]);

  const continueShopping = () => {
    router.replace("/shop");
  };

  const viewTracking = () => {
    // Always open tracking, even when a real order ID is unavailable.
    router.push({
      pathname: "/tracking" as any,
      params: {
        orderId: resolvedOrderId || "DEMO-ORDER",
        amount: resolvedAmount,
        method: resolvedMethod,
        demo: resolvedOrderId ? "false" : "true",
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content"  />
        <ActivityIndicator size="large" color="#087CF0" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content"  />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={88} color="#16A34A" />
        </View>

        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.subtitle}>Your order process is complete.</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#16A34A"
            />
            <Text style={styles.statusText}>Payment method selected</Text>
          </View>

          <View style={styles.statusRow}>
            <Ionicons
              name="receipt-outline"
              size={22}
              color="#087CF0"
            />
            <Text style={styles.statusText}>Method: {resolvedMethod}</Text>
          </View>

          <View style={styles.statusRow}>
            <Ionicons
              name="wallet-outline"
              size={22}
              color="#087CF0"
            />
            <Text style={styles.statusText}>
              Amount: ₹{Number(resolvedAmount || 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Ionicons
              name="cube-outline"
              size={22}
              color="#087CF0"
            />
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderId}>
                {resolvedOrderId || "Demo order"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.infoText}>
          You can view your order tracking details anytime using the button
          below. Live delivery updates may not be available for demo orders.
        </Text>

        <View style={styles.buttonsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={continueShopping}
          >
            <Ionicons name="bag-handle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.buttonText}>Continue Shopping</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.trackingButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={viewTracking}
          >
            <Ionicons name="location-outline" size={19} color="#087CF0" />
            <Text style={styles.trackingButtonText}>View Tracking</Text>
          </Pressable>
        </View>

        <View style={styles.demoNotice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#64748B"
          />
          <Text style={styles.demoNoticeText}>
            Demo UPI/Card flows do not confirm a real payment by themselves.
            Real order tracking requires a valid backend order.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F7FF",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F3F7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 14,
    color: "#475569",
    fontSize: 15,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 30,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#14213D",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },
  statusCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DCE7FA",
    gap: 17,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 3,
  },
  orderId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#14213D",
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 22,
  },
  buttonsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 54,
    borderRadius: 13,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  continueButton: {
    backgroundColor: "#087CF0",
  },
  trackingButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#087CF0",
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  trackingButtonText: {
    color: "#087CF0",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  demoNotice: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 22,
    padding: 12,
    backgroundColor: "#E8EEF8",
    borderRadius: 12,
  },
  demoNoticeText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
});
