
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

type TrackingStep = {
  status: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const TRACKING_STEPS: TrackingStep[] = [
  {
    status: "PLACED",
    title: "Order Placed",
    description: "Your order has been received.",
    icon: "receipt-outline",
  },
  {
    status: "CONFIRMED",
    title: "Order Confirmed",
    description: "Your order has been confirmed.",
    icon: "checkmark-circle-outline",
  },
  {
    status: "PACKED",
    title: "Packed",
    description: "Your items have been packed.",
    icon: "cube-outline",
  },
  {
    status: "SHIPPED",
    title: "Shipped",
    description: "Your package is on its way.",
    icon: "airplane-outline",
  },
  {
    status: "OUT_FOR_DELIVERY",
    title: "Out for Delivery",
    description: "Your package is on the way to your address.",
    icon: "bicycle-outline",
  },
  {
    status: "DELIVERED",
    title: "Delivered",
    description: "Your order has been delivered.",
    icon: "home-outline",
  },
];

type OrderItem = {
  product_id?: number;
  product_name?: string;
  quantity?: number;
  unit_price?: string | number;
  line_total?: string | number;
};

type DeliveryAddress = {
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
};

type OrderData = {
  order_number?: string;
  created_at?: string;
  updated_at?: string;
  order_date?: string;
  order_status?: string;
  order_status_label?: string;
  payment_method?: string;
  payment_status?: string;
  payment_status_label?: string;
  subtotal?: string | number;
  delivery_fee?: string | number;
  total_amount?: string | number;
  amount?: string | number;
  delivery_address?: DeliveryAddress;
  shipping_address?: DeliveryAddress;
  items?: OrderItem[];
};

type TrackingData = {
  steps?: string[];
  current_step_index?: number;
  is_cancelled?: boolean;
  is_delivered?: boolean;
};

function formatMoney(value: string | number | undefined): string {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

function formatDate(value?: string): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readableStatus(value?: string): string {
  if (!value) return "Not available";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function getStoredAccessToken(): Promise<string | null> {
  const allKeys = await AsyncStorage.getAllKeys();

  const preferredKeys = [
    "supplyhive_access_token",
    "access_token",
    "access",
  ];

  const keys = [
    ...preferredKeys.filter((key) => allKeys.includes(key)),
    ...allKeys.filter(
      (key) =>
        !preferredKeys.includes(key) &&
        /supplyhive.*access|access.*token/i.test(key)
    ),
  ];

  for (const key of keys) {
    const storedValue = await AsyncStorage.getItem(key);
    if (!storedValue) continue;

    let candidates: string[] = [];

    try {
      const parsed = JSON.parse(storedValue);

      if (typeof parsed === "string") {
        candidates = [parsed];
      } else if (parsed && typeof parsed === "object") {
        candidates = [
          parsed.access,
          parsed.access_token,
          parsed.token,
          parsed.supplyhive_access_token,
        ].filter(
          (value): value is string => typeof value === "string"
        );
      }
    } catch {
      candidates = [storedValue];
    }

    for (const candidate of candidates) {
      const token = candidate.trim();
      if (!token) continue;

      const payload = decodeJwtPayload(token);

      // Accept a valid, non-expired JWT access token.
      // If the token is not a JWT, let the server validate it.
      if (payload) {
        if (
          payload.token_type &&
          payload.token_type !== "access"
        ) {
          continue;
        }

        if (
          typeof payload.exp === "number" &&
          payload.exp <= Date.now() / 1000
        ) {
          continue;
        }
      }

      return token;
    }
  }

  return null;
}

export default function TrackingScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    orderId?: string | string[];
    amount?: string | string[];
    method?: string | string[];
  }>();

  const getParam = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const orderId = getParam(params.orderId);
  const paramAmount = getParam(params.amount);
  const paramMethod = getParam(params.method);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchTracking = useCallback(
    async (isRefresh = false) => {
      if (!orderId || orderId === "Not available") {
        setErrorMessage(
          "Order ID missing. Please open tracking from your order success page."
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const token = await getStoredAccessToken();

        if (!token) {
          throw new Error(
            "Your login session is missing or expired. Please log in again."
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/api/payments/order-status/${encodeURIComponent(
            orderId
          )}/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const responseText = await response.text();

        let result: any = {};

        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error(
            "The server returned an unexpected response. Please check your backend server."
          );
        }

        if (response.status === 401) {
          throw new Error(
            "Your login session is invalid or expired. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view this order. Please log in with the account used to place it."
          );
        }

        if (response.status === 404) {
          throw new Error(
            "This order was not found. Please check the Order ID and backend endpoint."
          );
        }

        if (!response.ok) {
          throw new Error(
            result.detail ||
              result.message ||
              `Unable to load order tracking (${response.status}).`
          );
        }

        const orderResult: any =
          result.order ??
          result.order_details ??
          result.data?.order ??
          result.data ??
          result;

        const trackingResult: any =
          result.tracking ??
          result.data?.tracking ??
          null;

        if (
          !orderResult ||
          typeof orderResult !== "object" ||
          !(
            orderResult.order_number ||
            orderResult.order_id ||
            orderResult.id
          )
        ) {
          throw new Error(
            "Order details were not found in the server response. Please check the order-status API response."
          );
        }

        const normalizedOrder: OrderData = {
          ...orderResult,
          order_number:
            orderResult.order_number ??
            orderResult.order_id ??
            String(orderResult.id ?? orderId),
          created_at:
            orderResult.created_at ??
            orderResult.order_date ??
            orderResult.ordered_at ??
            orderResult.created ??
            orderResult.date,
          updated_at:
            orderResult.updated_at ??
            orderResult.modified_at ??
            orderResult.last_updated,
          payment_method:
            orderResult.payment_method ??
            orderResult.payment_method_label ??
            orderResult.method,
          payment_status:
            orderResult.payment_status ??
            orderResult.payment_status_label ??
            orderResult.payment_state,
          order_status:
            orderResult.order_status ??
            orderResult.status ??
            "PLACED",
          total_amount:
            orderResult.total_amount ??
            orderResult.amount ??
            orderResult.total ??
            orderResult.grand_total,
          delivery_address:
            orderResult.delivery_address ??
            orderResult.shipping_address ??
            orderResult.address_details,
        };

        if (!normalizedOrder.payment_method && paramMethod) {
          normalizedOrder.payment_method = paramMethod;
        }

        if (
          normalizedOrder.total_amount === undefined &&
          paramAmount !== undefined
        ) {
          normalizedOrder.total_amount = paramAmount;
        }

        setOrder(normalizedOrder);
        setTracking(trackingResult);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading tracking."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId, paramAmount, paramMethod]
  );

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const status = order?.order_status ?? "PLACED";

  const isCancelled =
    status.toUpperCase() === "CANCELLED" ||
    tracking?.is_cancelled === true;

  const statusIndex = TRACKING_STEPS.findIndex(
    (step) => step.status === status.toUpperCase()
  );

  const currentStepIndex =
    typeof tracking?.current_step_index === "number"
      ? tracking.current_step_index
      : statusIndex >= 0
        ? statusIndex
        : 0;

  const displayAmount =
    order?.total_amount ?? paramAmount ?? "0.00";

  const displayMethod =
    order?.payment_method ?? paramMethod ?? "Not available";

  const paymentStatusLabel =
    order?.payment_status_label ??
    readableStatus(order?.payment_status);

  const statusLabel =
    order?.order_status_label ??
    TRACKING_STEPS.find(
      (step) => step.status === status.toUpperCase()
    )?.title ??
    readableStatus(status);

  const address = order?.delivery_address;

  const handleLogin = () => {
    router.replace({
      pathname: "/login",
      params: {
        next: `/tracking?orderId=${encodeURIComponent(orderId ?? "")}`,
      },
    } as any);
  };

  const loginError = /log in|login session|session is invalid/i.test(
    errorMessage
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={23} color="#172554" />
        </Pressable>

        <Text style={styles.headerTitle}>Order Tracking</Text>

        <Pressable
          onPress={() => fetchTracking(true)}
          style={styles.refreshButton}
          accessibilityLabel="Refresh tracking"
        >
          <Ionicons name="refresh-outline" size={22} color="#2563EB" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTracking(true)}
            tintColor="#2563EB"
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="cube-outline" size={34} color="#2563EB" />
          </View>

          <Text style={styles.heroTitle}>Track Your Order</Text>

          <Text style={styles.heroSubtitle}>
            Follow your SupplyHive order and check its latest status.
          </Text>

          <View style={styles.orderInfo}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text selectable style={styles.orderId}>
              {order?.order_number ?? orderId ?? "Not available"}
            </Text>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Order Amount</Text>
                <Text style={styles.infoValue}>
                  ₹{formatMoney(displayAmount)}
                </Text>
              </View>

              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>
                  {String(displayMethod).replace(/_/g, " ")}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Payment Status</Text>
                <Text style={styles.smallValue}>
                  {paymentStatusLabel}
                </Text>
              </View>

              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Order Status</Text>
                <Text
                  style={[
                    styles.smallValue,
                    isCancelled && styles.cancelledText,
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.smallValue}>
              {formatDate(order?.created_at)}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>
              Loading your order details...
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color="#DC2626"
            />

            <Text style={styles.errorTitle}>
              Unable to load tracking
            </Text>

            <Text style={styles.errorDescription}>
              {errorMessage}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={loginError ? handleLogin : () => fetchTracking()}
            >
              <Text style={styles.retryButtonText}>
                {loginError ? "Go to Login" : "Try Again"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.statusCard}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Delivery Progress</Text>

                <View
                  style={[
                    styles.liveBadge,
                    isCancelled && styles.cancelledBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.liveDot,
                      isCancelled && styles.cancelledDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.liveBadgeText,
                      isCancelled && styles.cancelledBadgeText,
                    ]}
                  >
                    {isCancelled ? "Cancelled" : "Live Status"}
                  </Text>
                </View>
              </View>

              <Text style={styles.pendingNotice}>
                Pull down to refresh and check the latest status saved in the
                backend.
              </Text>

              {isCancelled ? (
                <View style={styles.cancelledNotice}>
                  <Ionicons
                    name="close-circle-outline"
                    size={25}
                    color="#DC2626"
                  />
                  <View style={styles.noticeTextContainer}>
                    <Text style={styles.cancelledTitle}>
                      Order Cancelled
                    </Text>
                    <Text style={styles.stepDescription}>
                      This order has been marked as cancelled.
                    </Text>
                  </View>
                </View>
              ) : (
                TRACKING_STEPS.map((step, index) => {
                  const completed = index <= currentStepIndex;
                  const current = index === currentStepIndex;
                  const last = index === TRACKING_STEPS.length - 1;

                  return (
                    <View key={step.status} style={styles.stepRow}>
                      <View style={styles.timeline}>
                        <View
                          style={[
                            styles.stepCircle,
                            completed && styles.completedCircle,
                            current && styles.currentCircle,
                          ]}
                        >
                          <Ionicons
                            name={completed ? "checkmark" : step.icon}
                            size={19}
                            color={completed ? "#FFFFFF" : "#94A3B8"}
                          />
                        </View>

                        {!last && (
                          <View
                            style={[
                              styles.timelineLine,
                              index < currentStepIndex &&
                                styles.completedLine,
                            ]}
                          />
                        )}
                      </View>

                      <View
                        style={[
                          styles.stepContent,
                          last && styles.lastStepContent,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepTitle,
                            completed && styles.completedStepTitle,
                          ]}
                        >
                          {step.title}
                        </Text>

                        <Text style={styles.stepDescription}>
                          {step.description}
                        </Text>

                        {current && (
                          <Text style={styles.stepStatus}>
                            Current order status
                          </Text>
                        )}

                        {completed && !current && (
                          <Text style={styles.completedLabel}>
                            Completed
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              <Text style={styles.updatedAt}>
                Last updated: {formatDate(order?.updated_at)}
              </Text>
            </View>

            {address && (
              <View style={styles.addressCard}>
                <View style={styles.addressHeading}>
                  <Ionicons
                    name="location-outline"
                    size={23}
                    color="#2563EB"
                  />
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>

                {!!address.full_name && (
                  <Text style={styles.addressName}>
                    {address.full_name}
                  </Text>
                )}

                {!!address.phone && (
                  <Text style={styles.addressText}>{address.phone}</Text>
                )}

                <Text style={styles.addressText}>
                  {[address.address, address.city, address.state]
                    .filter(Boolean)
                    .join(", ")}
                </Text>

                {!!address.postal_code && (
                  <Text style={styles.addressText}>
                    PIN Code: {address.postal_code}
                  </Text>
                )}
              </View>
            )}

            {!!order?.items?.length && (
              <View style={styles.itemsCard}>
                <Text style={styles.sectionTitle}>Order Items</Text>

                {order.items.map((item, index) => (
                  <View
                    key={`${item.product_id ?? item.product_name}-${index}`}
                    style={styles.itemRow}
                  >
                    <View style={styles.itemIcon}>
                      <Ionicons
                        name="reader-outline"
                        size={21}
                        color="#2563EB"
                      />
                    </View>

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>
                        {item.product_name ?? "Product"}
                      </Text>
                      <Text style={styles.itemQuantity}>
                        Qty: {item.quantity ?? 1} × ₹
                        {formatMoney(item.unit_price)}
                      </Text>
                    </View>

                    <Text style={styles.itemPrice}>
                      ₹{formatMoney(item.line_total)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.helpCard}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#2563EB"
          />

          <View style={styles.helpTextContainer}>
            <Text style={styles.helpTitle}>Need help with your order?</Text>
            <Text style={styles.helpDescription}>
              Order progress depends on the status updated by your backend
              or order administrator.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.shopButton}
          onPress={() => router.replace("/shop" as any)}
        >
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          <Text style={styles.shopButtonText}>Continue Shopping</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  refreshButton: {
    width: 42,
    height: 42,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: "800",
    color: "#172554",
    textAlign: "center",
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 35,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginBottom: 18,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172554",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  orderInfo: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
  },
  orderId: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: "#172554",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoColumn: {
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },
  smallValue: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#172554",
  },
  cancelledText: {
    color: "#DC2626",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    marginBottom: 18,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#991B1B",
    marginTop: 10,
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#172554",
    flexShrink: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#166534",
  },
  cancelledBadge: {
    backgroundColor: "#FEE2E2",
  },
  cancelledDot: {
    backgroundColor: "#DC2626",
  },
  cancelledBadgeText: {
    color: "#991B1B",
  },
  pendingNotice: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 22,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 100,
  },
  timeline: {
    width: 42,
    alignItems: "center",
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  completedCircle: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  currentCircle: {
    borderWidth: 3,
    borderColor: "#86EFAC",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 3,
  },
  completedLine: {
    backgroundColor: "#16A34A",
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 22,
  },
  lastStepContent: {
    paddingBottom: 0,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
  },
  completedStepTitle: {
    color: "#166534",
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    marginTop: 5,
  },
  stepStatus: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "700",
    marginTop: 7,
  },
  completedLabel: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "600",
    marginTop: 7,
  },
  updatedAt: {
    fontSize: 11,
    lineHeight: 17,
    color: "#94A3B8",
    marginTop: 22,
  },
  cancelledNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 15,
  },
  noticeTextContainer: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#991B1B",
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  addressHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },
  addressName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#172554",
    marginBottom: 5,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
  },
  itemsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 16,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#172554",
  },
  itemQuantity: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 5,
  },
  helpDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
  },
  shopButton: {
    minHeight: 54,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
