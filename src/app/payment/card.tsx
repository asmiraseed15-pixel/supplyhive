

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useRouter } from "expo-router";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

type PaymentMethod = "card" | "wallet" | "netbanking";

type CartItem = {
  id?: number | string;
  product_id?: number | string;
  product?: number | string;
  name?: string;
  title?: string;
  price?: number | string;
  quantity?: number;
};

type DeliveryAddress = {
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postal_code?: string;
  country?: string;
};

type PaymentResponse = {
  success?: boolean;
  message?: string;
  detail?: string;
  order_number?: string;
  razorpay_order_id?: string;
  razorpay_key_id?: string;
  amount?: number;
  currency?: string;
  payment_status?: string;
  order_status?: string;
  total_amount?: string | number;
};

type RazorpayResult = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void;
    };
  }
}

const COLORS = {
  background: "#F4F7FC",
  white: "#FFFFFF",
  blue: "#1769E8",
  blueDark: "#1053BD",
  text: "#152440",
  muted: "#71809B",
  border: "#DCE6F5",
  paleBlue: "#EAF2FF",
  green: "#16834A",
  red: "#D92D3A",
};

const PAYMENT_METHODS: {
  id: PaymentMethod;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  background: string;
}[] = [
  {
    id: "card",
    title: "Credit / Debit Card",
    description: "Visa, Mastercard and supported cards",
    icon: "card",
    background: "#DCE9FF",
  },
  {
    id: "wallet",
    title: "Wallet",
    description: "Pay using a supported digital wallet",
    icon: "wallet",
    background: "#E8E2FF",
  },
  {
    id: "netbanking",
    title: "Net Banking",
    description: "Pay through your supported bank",
    icon: "business",
    background: "#DDF7EB",
  },
];

export default function CardPaymentScreen() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadCheckout = async () => {
      try {
        const [itemsValue, addressValue] = await Promise.all([
          AsyncStorage.getItem("supplyhive_checkout_items"),
          AsyncStorage.getItem("supplyhive_delivery_address"),
        ]);

        if (!active) return;

        if (itemsValue) {
          const parsed = JSON.parse(itemsValue);
          setItems(Array.isArray(parsed) ? parsed : []);
        }

        if (addressValue) {
          setAddress(JSON.parse(addressValue));
        }
      } catch {
        if (active) {
          setErrorMessage("Unable to load checkout details. Please try again.");
        }
      } finally {
        if (active) setReady(true);
      }
    };

    void loadCheckout();

    return () => {
      active = false;
    };
  }, []);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.price ?? 0) * Number(item.quantity ?? 1),
        0
      ),
    [items]
  );

  // Read an ACCESS token only. Never use the refresh token as Bearer.
  const getAccessToken = async (): Promise<string | null> => {
    const possibleKeys = [
      "supplyhive_access_token",
      "access",
      "access_token",
      "accessToken",
      "authTokens",
      "tokens",
      "userToken",
      "token",
      "jwt",
      "authToken",
    ];

    for (const key of possibleKeys) {
      const value = await AsyncStorage.getItem(key);
      if (!value) continue;

      try {
        const parsed = JSON.parse(value);

        if (typeof parsed === "string" && parsed.trim()) {
          // A JSON string is usable only if it looks like a JWT.
          const candidate = parsed.trim();
          if (candidate.split(".").length === 3) return candidate;
          continue;
        }

        if (parsed && typeof parsed === "object") {
          const access =
            parsed.access ??
            parsed.access_token ??
            parsed.accessToken;

          if (
            typeof access === "string" &&
            access.trim().split(".").length === 3
          ) {
            return access.trim();
          }

          // Do not return parsed.refresh or parsed.refresh_token here.
        }
      } catch {
        const candidate = value.trim();

        // Avoid treating arbitrary storage values as tokens.
        if (candidate.split(".").length === 3) return candidate;
      }
    }

    return null;
  };

  const apiRequest = async (
    path: string,
    accessToken: string,
    body: Record<string, unknown>
  ): Promise<{ response: Response; data: PaymentResponse }> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as PaymentResponse;

    return { response, data };
  };

  const loadRazorpay = async (): Promise<void> => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error(
        "Razorpay Web Checkout requires a browser. For Expo Go, integrate a compatible native Razorpay SDK."
      );
    }

    if (window.Razorpay) return;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existing) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          reject(new Error("Razorpay is taking too long to load. Try again."));
        }, 15000);

        const finish = () => {
          window.clearTimeout(timeout);
          if (window.Razorpay) resolve();
          else reject(new Error("Razorpay checkout could not initialize."));
        };

        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener(
          "error",
          () => {
            window.clearTimeout(timeout);
            reject(new Error("Unable to load Razorpay checkout."));
          },
          { once: true }
        );

        if (window.Razorpay) finish();
      });

      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        if (window.Razorpay) resolve();
        else reject(new Error("Razorpay checkout could not initialize."));
      };

      script.onerror = () =>
        reject(
          new Error(
            "Unable to load Razorpay. Check your internet connection."
          )
        );

      document.body.appendChild(script);
    });
  };

  const payNow = async () => {
    if (loading) return;

    setErrorMessage("");

    if (Platform.OS !== "web") {
      setErrorMessage(
        "This screen currently uses Razorpay Web Checkout. Native Expo requires a compatible Razorpay native SDK."
      );
      return;
    }

    if (!items.length) {
      setErrorMessage("Your cart is empty. Please return to your cart.");
      return;
    }

    const fullName = (
      address?.full_name ??
      address?.name ??
      ""
    ).trim();
    const phone = (address?.phone ?? "").trim();
    const deliveryAddress = (address?.address ?? "").trim();
    const city = (address?.city ?? "").trim();
    const state = (address?.state ?? "").trim();
    const postalCode = (
      address?.postal_code ??
      address?.pincode ??
      ""
    ).trim();

    if (
      !fullName ||
      !phone ||
      !deliveryAddress ||
      !city ||
      !state ||
      !postalCode
    ) {
      setErrorMessage(
        "Delivery details are incomplete. Please return to checkout and enter your name, phone, address, city, state and PIN code."
      );
      return;
    }

    const normalizedItems = items.map((item) => ({
      product_id: item.product_id ?? item.product ?? item.id,
      quantity: Number(item.quantity ?? 1),
    }));

    if (
      normalizedItems.some(
        (item) =>
          item.product_id == null ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      setErrorMessage(
        "A cart item has an invalid product ID or quantity. Please check your cart."
      );
      return;
    }

    setLoading(true);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error(
          "Access token not found. Please log out, log in again, and retry payment."
        );
      }

      // Create the order. The backend must calculate the actual price.
      const { response: createResponse, data: orderData } =
        await apiRequest(
          "/api/payments/create-order/",
          accessToken,
          {
            items: normalizedItems,
            payment_method: "RAZORPAY",
            full_name: fullName,
            phone,
            address: deliveryAddress,
            landmark: address?.landmark ?? "",
            city,
            state,
            postal_code: postalCode,
            country: address?.country ?? "India",
          }
        );

      if (
        createResponse.status === 401 ||
        createResponse.status === 403
      ) {
        throw new Error(
          "Your access token was rejected by Django. Log out and log in again. If the error continues, the login page may be saving the refresh token instead of the access token."
        );
      }

      if (!createResponse.ok || orderData.success !== true) {
        throw new Error(
          orderData.message ??
            orderData.detail ??
            `Order creation failed (HTTP ${createResponse.status}).`
        );
      }

      const razorpayOrderId = orderData.razorpay_order_id;
      const razorpayKeyId = orderData.razorpay_key_id;
      const orderNumber = orderData.order_number;
      const amount = Number(orderData.amount);

      if (
        !razorpayOrderId ||
        !razorpayKeyId ||
        !orderNumber ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
      ) {
        throw new Error(
          "The backend returned incomplete Razorpay details. Check the create-order API response and Razorpay test-key settings."
        );
      }

      await loadRazorpay();

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is unavailable.");
      }

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount,
        currency: orderData.currency || "INR",
        name: "SupplyHive",
        description:
          selectedMethod === "card"
            ? "Credit / Debit Card Payment"
            : selectedMethod === "wallet"
              ? "Wallet Payment"
              : "Net Banking Payment",
        order_id: razorpayOrderId,
        prefill: {
          name: fullName,
          email: address?.email ?? "",
          contact: phone,
        },
        notes: {
          order_number: String(orderNumber),
          payment_method: selectedMethod,
        },
        theme: {
          color: COLORS.blue,
        },
        method: {
          card: selectedMethod === "card",
          wallet: selectedMethod === "wallet",
          netbanking: selectedMethod === "netbanking",
          upi: false,
          emi: false,
          paylater: false,
        },
        handler: async (payment: RazorpayResult) => {
          try {
            const { response: verifyResponse, data: verifyData } =
              await apiRequest(
                "/api/payments/verify-payment/",
                accessToken,
                {
                  order_number: orderNumber,
                  razorpay_order_id: payment.razorpay_order_id,
                  razorpay_payment_id: payment.razorpay_payment_id,
                  razorpay_signature: payment.razorpay_signature,
                }
              );

            if (
              verifyResponse.status === 401 ||
              verifyResponse.status === 403
            ) {
              throw new Error(
                "Django rejected the access token during verification. Do not retry payment immediately; first check the order status with the backend."
              );
            }

            if (
              !verifyResponse.ok ||
              verifyData.success !== true ||
              verifyData.payment_status !== "PAID"
            ) {
              throw new Error(
                verifyData.message ??
                  verifyData.detail ??
                  "The server has not confirmed payment. Check the order status before trying to pay again."
              );
            }

            const savedOrder = {
              order_number: verifyData.order_number ?? orderNumber,
              payment_method: selectedMethod.toUpperCase(),
              payment_status: verifyData.payment_status,
              order_status: verifyData.order_status,
              total_amount:
                verifyData.total_amount ?? (amount / 100).toFixed(2),
              currency: orderData.currency || "INR",
              payment_id: payment.razorpay_payment_id,
              delivery_address: address,
              items,
              created_at: new Date().toISOString(),
            };

            await AsyncStorage.setItem(
              "supplyhive_last_order",
              JSON.stringify(savedOrder)
            );

            await AsyncStorage.multiRemove([
              "supplyhive_checkout_items",
              "supplyhive_cart",
            ]);

            setLoading(false);

            router.replace({
              pathname: "/payment/success",
              params: {
                amount: String(savedOrder.total_amount),
                method: selectedMethod.toUpperCase(),
                order_number: String(savedOrder.order_number),
              },
            } as never);
          } catch (error) {
            setLoading(false);
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Unable to verify payment. Check your order status before retrying."
            );
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      razorpay.open();
    } catch (error) {
      setLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start payment. Please try again."
      );
    }
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.muted}>Loading checkout...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={23} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <Text style={styles.headerSubtitle}>SupplyHive checkout</Text>
        </View>

        <View style={styles.shield}>
          <Ionicons
            name="shield-checkmark"
            size={25}
            color={COLORS.blue}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="lock-closed" size={27} color={COLORS.blue} />
          </View>
          <Text style={styles.pageTitle}>Choose payment method</Text>
          <Text style={styles.pageSubtitle}>
            Select your preferred way to pay securely.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>PAYMENT OPTIONS</Text>

        <View style={styles.methods}>
          {PAYMENT_METHODS.map((method) => {
            const selected = selectedMethod === method.id;

            return (
              <Pressable
                key={method.id}
                disabled={loading}
                onPress={() => {
                  setSelectedMethod(method.id);
                  setErrorMessage("");
                }}
                style={[
                  styles.methodCard,
                  selected && styles.methodCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.methodIcon,
                    { backgroundColor: method.background },
                    selected && styles.methodIconSelected,
                  ]}
                >
                  <Ionicons
                    name={method.icon}
                    size={29}
                    color={selected ? COLORS.white : COLORS.blue}
                  />
                </View>

                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodDescription}>
                    {method.description}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    selected && styles.radioSelected,
                  ]}
                >
                  {selected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="receipt-outline"
                size={23}
                color={COLORS.blue}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Order total</Text>
              <Text style={styles.summarySubtitle}>
                {items.length} product type(s)
              </Text>
            </View>
          </View>

          <Text style={styles.amount}>₹{total.toFixed(2)}</Text>

          <View style={styles.divider} />

          <View style={styles.secureRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color={COLORS.green}
            />
            <Text style={styles.secureText}>
              Secure checkout powered by Razorpay
            </Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={COLORS.red}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={payNow}
          disabled={loading || !items.length}
          style={({ pressed }) => [
            styles.payButton,
            pressed && !loading && styles.payButtonPressed,
            (loading || !items.length) && styles.payButtonDisabled,
          ]}
        >
          {loading ? (
            <>
              <ActivityIndicator color={COLORS.white} />
              <Text style={styles.payButtonText}>Preparing payment...</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={19} color={COLORS.white} />
              <Text style={styles.payButtonText}>Continue to Payment</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={COLORS.white}
              />
            </>
          )}
        </Pressable>

        <View style={styles.trustRow}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={COLORS.green}
          />
          <Text style={styles.trustText}>
            Payment details are handled by Razorpay checkout.
          </Text>
        </View>

        <Pressable
          style={styles.backLink}
          disabled={loading}
          onPress={() => router.replace("/payment" as never)}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.blue} />
          <Text style={styles.backLinkText}>
            Choose another payment option
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  muted: {
    color: COLORS.muted,
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 13,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    color: COLORS.text,
    fontWeight: "900",
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  shield: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.paleBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 35,
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },
  intro: {
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 25,
  },
  introIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.paleBlue,
    borderWidth: 1,
    borderColor: "#D5E4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  pageSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
    textAlign: "center",
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  methods: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 13,
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  methodCardSelected: {
    borderColor: COLORS.blue,
    backgroundColor: "#F0F6FF",
  },
  methodIcon: {
    width: 55,
    height: 55,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E5FB",
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconSelected: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  methodDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: "#B8C6D9",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: COLORS.blue,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: COLORS.blue,
  },
  summary: {
    marginTop: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 19,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.paleBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  summarySubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  amount: {
    color: COLORS.blue,
    fontSize: 33,
    fontWeight: "900",
    marginTop: 17,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secureText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  errorBox: {
    marginTop: 16,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#F4B9BD",
    backgroundColor: "#FFF0F1",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  errorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
  },
  payButton: {
    marginTop: 20,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  payButtonPressed: {
    backgroundColor: COLORS.blueDark,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
    flexShrink: 1,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 16,
  },
  trustText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 21,
  },
  backLinkText: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "800",
  },
});
