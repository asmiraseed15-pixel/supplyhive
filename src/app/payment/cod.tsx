
// src/app/cod.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const C = {
  blue: "#1769FF",
  blueDark: "#1255D5",
  bg: "#F4F7FF",
  white: "#FFFFFF",
  text: "#18243A",
  muted: "#69758A",
  border: "#DCE5F5",
  green: "#16834A",
  greenBg: "#E8F8EF",
  red: "#C62828",
};

type CheckoutItem = {
  id?: number | string;
  product_id?: number | string;
  productId?: number | string;
  name?: string;
  title?: string;
  price?: number | string;
  quantity?: number | string;
  image?: string | null;
  image_url?: string | null;
  [key: string]: any;
};

type DeliveryAddress = {
  full_name?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  address_line?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  postalCode?: string;
  pincode?: string;
  pin_code?: string;
  [key: string]: any;
};

type OrderResponse = {
  id?: number | string;
  order_id?: number | string;
  order_number?: string;
  total_amount?: number | string;
  total?: number | string;
  subtotal?: number | string;
  delivery_fee?: number | string;
  payment_method?: string;
  payment_status?: string;
  order_status?: string;
  status?: string;
  [key: string]: any;
};

function first(...values: any[]): string {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function money(value: number | string | undefined): string {
  const numberValue = Number(value ?? 0);
  return `₹${(Number.isFinite(numberValue) ? numberValue : 0).toFixed(2)}`;
}

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function showMessage(title: string, message: string) {
  Alert.alert(title, message);
}

export default function CODScreen() {
  const router = useRouter();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [address, setAddress] = useState<DeliveryAddress>({});
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);

  // Editable delivery details
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const price = Number(item.price ?? 0);
      const quantity = Number(item.quantity ?? 1);

      return (
        total +
        (Number.isFinite(price) ? price : 0) *
          (Number.isFinite(quantity) ? quantity : 1)
      );
    }, 0);
  }, [items]);

  const loadCheckout = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [storedItems, storedAddress] = await Promise.all([
        AsyncStorage.getItem("supplyhive_checkout_items"),
        AsyncStorage.getItem("supplyhive_delivery_address"),
      ]);

      const checkoutItems = parseJSON<CheckoutItem[]>(storedItems, []);
      const savedAddress = parseJSON<DeliveryAddress>(storedAddress, {});

      setItems(Array.isArray(checkoutItems) ? checkoutItems : []);
      setAddress(savedAddress);

      setFullName(
        first(
          savedAddress.full_name,
          savedAddress.fullName,
          savedAddress.name
        )
      );
      setPhone(first(savedAddress.phone, savedAddress.mobile));
      setAddressLine(
        first(
          savedAddress.address,
          savedAddress.address_line,
          savedAddress.addressLine
        )
      );
      setCity(first(savedAddress.city));
      setState(first(savedAddress.state));
      setPostalCode(
        first(
          savedAddress.postal_code,
          savedAddress.postalCode,
          savedAddress.pincode,
          savedAddress.pin_code
        )
      );
    } catch {
      setMessage("Unable to load checkout details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  async function getAccessToken(): Promise<string> {
    let token = (await AsyncStorage.getItem("supplyhive_access_token")) || "";

    // Check whether the stored access token has expired.
    try {
      const payloadPart = token.split(".")[1];

      if (payloadPart) {
        const normalized = payloadPart
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        const decoded =
          typeof atob === "function"
            ? atob(normalized)
            : "";

        if (decoded) {
          const payload = JSON.parse(decoded);
          const expiry = Number(payload.exp ?? 0);

          if (expiry && expiry * 1000 <= Date.now()) {
            token = "";
          }
        }
      }
    } catch {
      // The backend will validate the token if it cannot be decoded here.
    }

    if (token) return token;

    const refreshToken =
      (await AsyncStorage.getItem("supplyhive_refresh_token")) || "";

    if (!refreshToken) {
      throw new Error("Your login session has expired. Please log in again.");
    }

    const refreshResponse = await fetch(
      `${API_BASE_URL}/api/auth/refresh-token/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    const refreshData = await refreshResponse.json().catch(() => ({}));

    if (!refreshResponse.ok || !refreshData.access) {
      await AsyncStorage.removeItem("supplyhive_access_token");

      throw new Error("Your login session has expired. Please log in again.");
    }

    token = String(refreshData.access);

    await AsyncStorage.setItem("supplyhive_access_token", token);

    if (refreshData.refresh) {
      await AsyncStorage.setItem(
        "supplyhive_refresh_token",
        String(refreshData.refresh)
      );
    }

    return token;
  }

  function validateDeliveryDetails(): string | null {
    if (!items.length) {
      return "Your checkout has no products. Please return to your cart.";
    }

    if (!fullName.trim()) return "Please enter your full name.";

    if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ""))) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (!addressLine.trim()) return "Please enter your delivery address.";
    if (!city.trim()) return "Please enter your city.";
    if (!state.trim()) return "Please enter your state.";

    if (!/^[0-9]{6}$/.test(postalCode.trim())) {
      return "Please enter a valid 6-digit PIN code.";
    }

    for (const item of items) {
      const productId = item.product_id ?? item.productId ?? item.id;
      const quantity = Number(item.quantity ?? 1);

      if (
        productId === undefined ||
        productId === null ||
        !Number.isFinite(Number(productId)) ||
        Number(productId) <= 0
      ) {
        return `A valid backend product ID is missing for ${
          item.name ?? item.title ?? "a product"
        }.`;
      }

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return "Please check your product quantities.";
      }
    }

    return null;
  }

  async function placeOrder() {
    if (placingOrder) return;

    setMessage("");

    const validationError = validateDeliveryDetails();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setPlacingOrder(true);

    try {
      const token = await getAccessToken();

      const payload = {
        items: items.map((item) => ({
          product_id: Number(
            item.product_id ?? item.productId ?? item.id
          ),
          quantity: Number(item.quantity ?? 1),
        })),
        full_name: fullName.trim(),
        phone: phone.replace(/\D/g, ""),
        address: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        payment_method: "COD",
      };

      const response = await fetch(
        `${API_BASE_URL}/api/payments/create-order/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        const backendError =
          data.detail ||
          data.error ||
          data.message ||
          (typeof data === "object"
            ? Object.entries(data)
                .map(([key, value]) => {
                  const readableValue = Array.isArray(value)
                    ? value.join(", ")
                    : String(value);

                  return `${key}: ${readableValue}`;
                })
                .join("\n")
            : "");

        throw new Error(
          backendError || "Unable to place your COD order. Please try again."
        );
      }

      const savedOrder: OrderResponse = {
        ...data,
        payment_method: data.payment_method || "COD",
      };

      const orderNumber = first(
        savedOrder.order_number,
        savedOrder.order_id,
        savedOrder.id
      );

      if (!orderNumber) {
        throw new Error(
          "The backend did not return an order number. Please check your orders before trying again."
        );
      }

      // Save the delivery information and the backend-created order.
      const updatedAddress = {
        ...address,
        full_name: fullName.trim(),
        phone: phone.replace(/\D/g, ""),
        address: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
      };

      await AsyncStorage.setItem(
        "supplyhive_delivery_address",
        JSON.stringify(updatedAddress)
      );

      await AsyncStorage.setItem(
        "supplyhive_last_order",
        JSON.stringify({
          ...savedOrder,
          order_number: orderNumber,
          payment_method: "COD",
          items,
          full_name: fullName.trim(),
          phone: phone.replace(/\D/g, ""),
          address: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
        })
      );

      // Clear cart and checkout items only after the backend confirms success.
      await AsyncStorage.removeItem("supplyhive_checkout_items");
      await AsyncStorage.removeItem("supplyhive_cart");

      setOrder({
        ...savedOrder,
        order_number: orderNumber,
      });
      setSuccess(true);
    } catch (error: any) {
      const errorMessage =
        error?.message || "Something went wrong. Please try again.";

      setMessage(errorMessage);

      if (
        errorMessage.toLowerCase().includes("log in again") ||
        errorMessage.toLowerCase().includes("session has expired")
      ) {
        Alert.alert(
          "Login required",
          errorMessage,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Log in",
              onPress: () =>
                router.replace({
                  pathname: "/login",
                  params: { next: "/checkout" },
                } as never),
            },
          ]
        );
      }
    } finally {
      setPlacingOrder(false);
    }
  }

  function viewTracking() {
    const orderId = first(
      order?.order_number,
      order?.order_id,
      order?.id
    );

    if (!orderId) {
      Alert.alert(
        "Tracking unavailable",
        "The backend order number was not found. Please check your order."
      );
      return;
    }

    router.push({
      pathname: "/tracking",
      params: {
        orderId: String(orderId),
        amount: String(order?.total_amount ?? order?.total ?? subtotal),
        method: "COD",
      },
    } as never);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={styles.loadingText}>Loading delivery details...</Text>
      </SafeAreaView>
    );
  }

  if (success) {
    const orderNumber = first(
      order?.order_number,
      order?.order_id,
      order?.id
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content"  />

        <ScrollView
          contentContainerStyle={styles.successScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={76}
                color={C.green}
              />
            </View>

            <Text style={styles.successTitle}>Order Placed Successfully!</Text>

            <Text style={styles.successDescription}>
              Thank you for shopping with Supplyhive. Your order has been
              placed with Cash on Delivery.
            </Text>

            <View style={styles.orderNumberBox}>
              <Text style={styles.orderNumberLabel}>ORDER NUMBER</Text>
              <Text selectable style={styles.orderNumberValue}>
                {orderNumber}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="wallet-outline"
                  size={21}
                  color={C.blue}
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment method</Text>
                <Text style={styles.detailValue}>Cash on Delivery</Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Pay on delivery</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="cash-outline"
                  size={21}
                  color={C.blue}
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Order total</Text>
                <Text style={styles.detailValue}>
                  {money(order?.total_amount ?? order?.total ?? subtotal)}
                </Text>
              </View>
            </View>

            <View style={styles.addressBox}>
              <View style={styles.addressHeading}>
                <Ionicons
                  name="location-outline"
                  size={21}
                  color={C.blue}
                />
                <Text style={styles.addressTitle}>Delivery address</Text>
              </View>

              <Text style={styles.addressName}>{fullName}</Text>
              <Text style={styles.addressText}>{addressLine}</Text>
              <Text style={styles.addressText}>
                {city}, {state} - {postalCode}
              </Text>
              <Text style={styles.addressText}>Phone: {phone}</Text>
            </View>

            <View style={styles.noticeBox}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={C.green}
              />
              <Text style={styles.noticeText}>
                Keep the payment ready and pay the delivery person when your
                order arrives.
              </Text>
            </View>

            <View style={styles.successButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.shoppingButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.replace("/shop" as never)}
              >
                <Ionicons
                  name="cart-outline"
                  size={19}
                  color={C.white}
                />
                <Text style={styles.buttonText}>Continue Shopping</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.trackingButton,
                  pressed && styles.trackingButtonPressed,
                ]}
                onPress={viewTracking}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={C.blue}
                />
                <Text style={styles.trackingButtonText}>
                  View Tracking
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content"  />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={C.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.pageTitle}>Cash on Delivery</Text>
          <Text style={styles.pageSubtitle}>
            Confirm your delivery details to place your order.
          </Text>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}>
                <Ionicons
                  name="location-outline"
                  size={22}
                  color={C.blue}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.sectionTitle}>Delivery Details</Text>
                <Text style={styles.sectionSubtitle}>
                  You can edit your information below.
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#929DB0"
              autoCapitalize="words"
              editable={!placingOrder}
            />

            <Text style={styles.inputLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(value) =>
                setPhone(value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile number"
              placeholderTextColor="#929DB0"
              keyboardType="phone-pad"
              maxLength={10}
              editable={!placingOrder}
            />

            <Text style={styles.inputLabel}>Delivery address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={addressLine}
              onChangeText={setAddressLine}
              placeholder="House number, street, area"
              placeholderTextColor="#929DB0"
              multiline
              textAlignVertical="top"
              editable={!placingOrder}
            />

            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Enter your city"
              placeholderTextColor="#929DB0"
              autoCapitalize="words"
              editable={!placingOrder}
            />

            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="Enter your state"
              placeholderTextColor="#929DB0"
              autoCapitalize="words"
              editable={!placingOrder}
            />

            <Text style={styles.inputLabel}>PIN code</Text>
            <TextInput
              style={styles.input}
              value={postalCode}
              onChangeText={(value) =>
                setPostalCode(value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit PIN code"
              placeholderTextColor="#929DB0"
              keyboardType="number-pad"
              maxLength={6}
              editable={!placingOrder}
            />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={22}
                  color={C.blue}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <Text style={styles.sectionSubtitle}>
                  {items.length} product line{items.length === 1 ? "" : "s"}
                </Text>
              </View>
            </View>

            {items.map((item, index) => (
              <View
                key={String(
                  item.product_id ?? item.productId ?? item.id ?? index
                )}
                style={styles.productRow}
              >
                <View style={styles.productIcon}>
                  <Ionicons
                    name="cube-outline"
                    size={23}
                    color={C.blue}
                  />
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {item.name ?? item.title ?? "Product"}
                  </Text>
                  <Text style={styles.productQuantity}>
                    Qty: {Number(item.quantity ?? 1)}
                  </Text>
                </View>

                <Text style={styles.productPrice}>
                  {money(
                    Number(item.price ?? 0) *
                      Number(item.quantity ?? 1)
                  )}
                </Text>
              </View>
            ))}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{money(subtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.freeDelivery}>Free</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(subtotal)}</Text>
            </View>
          </View>

          <View style={styles.codNotice}>
            <Ionicons name="cash-outline" size={24} color={C.green} />
            <View style={styles.flex}>
              <Text style={styles.codNoticeTitle}>Pay when delivered</Text>
              <Text style={styles.codNoticeText}>
                No online payment is required now. Pay the delivery person
                when you receive your order.
              </Text>
            </View>
          </View>

          {!!message && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color={C.red}
              />
              <Text style={styles.errorText}>{message}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.placeOrderButton,
              pressed && !placingOrder && styles.buttonPressed,
              placingOrder && styles.buttonDisabled,
            ]}
            onPress={placeOrder}
            disabled={placingOrder}
          >
            {placingOrder ? (
              <>
                <ActivityIndicator color={C.white} />
                <Text style={styles.buttonText}>Placing Order...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color={C.white}
                />
                <Text style={styles.buttonText}>Place COD Order</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.secureText}>
            <Ionicons name="shield-checkmark-outline" size={14} /> Your order
            will be saved securely.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
  loadingText: {
    marginTop: 12,
    color: C.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 35,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 10,
  },
  backText: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  pageTitle: {
    color: C.text,
    fontSize: 27,
    fontWeight: "900",
    marginBottom: 6,
  },
  pageSubtitle: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8EEF9",
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 19,
  },
  headingIcon: {
    height: 44,
    width: 44,
    borderRadius: 13,
    backgroundColor: "#EDF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
  },
  inputLabel: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 5,
  },
  input: {
    minHeight: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#FBFCFF",
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 84,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 11,
  },
  productIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#EDF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  productQuantity: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },
  productPrice: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  summaryLabel: {
    color: C.muted,
    fontSize: 14,
  },
  summaryValue: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },
  freeDelivery: {
    color: C.green,
    fontSize: 14,
    fontWeight: "800",
  },
  totalLabel: {
    color: C.text,
    fontSize: 16,
    fontWeight: "900",
  },
  totalValue: {
    color: C.blue,
    fontSize: 20,
    fontWeight: "900",
  },
  codNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.greenBg,
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
  },
  codNoticeTitle: {
    color: C.green,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 5,
  },
  codNoticeText: {
    color: "#37684C",
    fontSize: 12,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD5D5",
    padding: 13,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: C.red,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  button: {
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  placeOrderButton: {
    backgroundColor: C.blue,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    backgroundColor: "#F28C28",
  },
  buttonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  secureText: {
    color: C.muted,
    textAlign: "center",
    fontSize: 12,
    marginTop: 13,
  },

  // Order success screen
  successScroll: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 35,
    flexGrow: 1,
    justifyContent: "center",
  },
  successCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EEF9",
  },
  successIcon: {
    marginBottom: 10,
  },
  successTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  successDescription: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 20,
  },
  orderNumberBox: {
    width: "100%",
    backgroundColor: "#F1F5FF",
    borderRadius: 13,
    padding: 14,
    alignItems: "center",
    marginBottom: 15,
  },
  orderNumberLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 7,
  },
  orderNumberValue: {
    color: C.blue,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 11,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1F8",
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EDF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: C.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
  },
  pendingBadge: {
    backgroundColor: "#FFF3D9",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
  },
  pendingText: {
    color: "#8A5A00",
    fontSize: 10,
    fontWeight: "800",
  },
  addressBox: {
    width: "100%",
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    padding: 14,
    marginTop: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  addressHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  addressTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
  },
  addressName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },
  addressText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  noticeBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: C.greenBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 17,
  },
  noticeText: {
    flex: 1,
    color: "#37684C",
    fontSize: 12,
    lineHeight: 18,
  },
  successButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 3,
  },
  shoppingButton: {
    flex: 1,
    backgroundColor: C.blue,
    paddingHorizontal: 8,
  },
  trackingButton: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.blue,
    paddingHorizontal: 8,
  },
  trackingButtonPressed: {
    backgroundColor: "#FFF0DD",
    borderColor: "#F28C28",
  },
  trackingButtonText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
});
