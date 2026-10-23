

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const COLORS = {
  background: "#F5F8FF",
  header: "#D4E1FA",
  blue: "#087CF0",
  dark: "#14213D",
  muted: "#69758B",
  white: "#FFFFFF",
  border: "#E2E9F5",
  green: "#16834A",
  red: "#D93030",
  lightBlue: "#EAF3FF",
};

type ProfileData = {
  id?: number | string;
  name?: string;
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  mobile_number?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
};

type OrderData = {
  id?: number | string;
  order_number?: string;
  order_status?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  total_amount?: number | string;
  total?: number | string;
  created_at?: string;
  items?: any[];
  order_items?: any[];
  [key: string]: any;
};

type RecentProduct = {
  id?: number | string;
  name?: string;
  title?: string;
  price?: number | string;
  image?: string | null;
  [key: string]: any;
};

const TOKEN_KEYS = [
  "supplyhive_access_token",
  "access_token",
  "access",
  "token",
  "authToken",
  "authData",
  "user",
  "userData",
];

async function getAccessToken(): Promise<string | null> {
  for (const key of TOKEN_KEYS) {
    const stored = await AsyncStorage.getItem(key);

    if (!stored) continue;

    try {
      const parsed = JSON.parse(stored);

      if (typeof parsed === "string" && parsed.split(".").length === 3) {
        return parsed;
      }

      const token =
        parsed?.access ??
        parsed?.access_token ??
        parsed?.token ??
        parsed?.accessToken ??
        parsed?.user?.access ??
        parsed?.user?.access_token;

      if (typeof token === "string" && token.split(".").length === 3) {
        return token;
      }
    } catch {
      if (stored.split(".").length === 3) {
        return stored;
      }
    }
  }

  return null;
}

async function apiRequest(
  path: string,
  token: string,
  method: "GET" | "PUT" = "GET",
  body?: Record<string, unknown>
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        data?.error ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

function showMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message);
  }
}

function getProfileName(profile: ProfileData | null) {
  if (!profile) return "Your Profile";

  const fullName =
    profile.full_name ||
    profile.name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username;

  return fullName || "Your Profile";
}

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return `₹${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getOrderStatus(order: OrderData) {
  return String(order.order_status || order.status || "Pending")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isActiveOrder(order: OrderData) {
  const status = String(
    order.order_status || order.status || ""
  ).toLowerCase();

  return ![
    "delivered",
    "completed",
    "cancelled",
    "canceled",
    "refunded",
  ].includes(status);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [savedAddress, setSavedAddress] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [trackingExpanded, setTrackingExpanded] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");

  const contentWidth = Math.min(width - 32, 760);

  const loadRecentProducts = useCallback(async () => {
    const keys = [
      "supplyhive_recently_viewed",
      "supplyhive_recent_viewed",
      "recently_viewed",
      "recentlyViewed",
    ];

    for (const key of keys) {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) continue;

      try {
        const parsed = JSON.parse(stored);
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.products)
            ? parsed.products
            : Array.isArray(parsed?.items)
              ? parsed.items
              : [];

        setRecentProducts(list);
        return;
      } catch {
        // Try the next supported storage key.
      }
    }

    setRecentProducts([]);
  }, []);

  const loadProfile = useCallback(async () => {
    setProfileError("");

    const token = await getAccessToken();

    if (!token) {
      setProfile(null);
      setProfileError("Please log in to view your profile.");
      return;
    }

    try {
      const data = await apiRequest("/api/auth/profile/", token);
      const userData = data?.user ?? data?.profile ?? data;

      setProfile(userData);
    } catch (error: any) {
      setProfileError(
        error?.message || "Unable to load your profile."
      );
    }
  }, []);

  const startEditingProfile = () => {
    setEditName(getProfileName(profile) === "Your Profile" ? "" : getProfileName(profile));
    setEditEmail(profile?.email || "");
    setEditMobile(
      profile?.mobile_number || profile?.phone || profile?.mobile || ""
    );
    setEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setEditingProfile(false);
    setEditName("");
    setEditEmail("");
    setEditMobile("");
  };

  const saveProfile = async () => {
    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    const mobile = editMobile.trim();

    if (!name) {
      showMessage("Name required", "Please enter your name.");
      return;
    }

    if (!email) {
      showMessage("Email required", "Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (mobile && !/^[0-9+\-()\s]{7,15}$/.test(mobile)) {
      showMessage(
        "Invalid mobile number",
        "Please enter a valid mobile number (up to 15 characters)."
      );
      return;
    }

    setSavingProfile(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Your login session has expired. Please log in again.");
      }

      const data = await apiRequest(
        "/api/auth/profile/",
        token,
        "PUT",
        {
          name,
          email,
          mobile_number: mobile,
        }
      );

      const updatedProfile = data?.user ?? data?.profile ?? data;

      setProfile(updatedProfile);
      setEditingProfile(false);

      // Keep cached user information in sync when these keys exist.
      const cachedKeys = ["supplyhive_user", "userData", "user"];
      for (const key of cachedKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (!stored) continue;

        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const updatedCache = {
              ...parsed,
              ...(parsed.user && typeof parsed.user === "object"
                ? { user: { ...parsed.user, ...updatedProfile } }
                : updatedProfile),
            };
            await AsyncStorage.setItem(key, JSON.stringify(updatedCache));
          }
        } catch {
          // Ignore unrelated storage formats.
        }
      }

      showMessage("Success", "Your profile has been updated.");
    } catch (error: any) {
      showMessage(
        "Unable to save profile",
        error?.message || "Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const loadOrders = useCallback(async () => {
    setOrdersError("");

    const token = await getAccessToken();

    if (!token) {
      setOrders([]);
      setOrdersError("Please log in to view your orders.");
      return;
    }

    try {
      const data = await apiRequest(
        "/api/payments/my-orders/",
        token
      );

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.data)
              ? data.data
              : [];

      setOrders(list);
    } catch (error: any) {
      setOrdersError(error?.message || "Unable to load your orders.");
      setOrders([]);
    }
  }, []);

  const loadAddress = useCallback(async () => {
    const stored = await AsyncStorage.getItem(
      "supplyhive_delivery_address"
    );

    if (!stored) {
      setSavedAddress(null);
      return;
    }

    try {
      setSavedAddress(JSON.parse(stored));
    } catch {
      setSavedAddress(null);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadProfile(),
        loadOrders(),
        loadRecentProducts(),
        loadAddress(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadProfile, loadOrders, loadRecentProducts, loadAddress]);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        loadProfile(),
        loadOrders(),
        loadRecentProducts(),
        loadAddress(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile, loadOrders, loadRecentProducts, loadAddress]);

  const openTracking = (order: OrderData) => {
    const orderNumber = order.order_number;
    const orderId = order.id;

    if (!orderNumber && !orderId) {
      showMessage(
        "Tracking unavailable",
        "Order ID is missing. Please refresh your orders."
      );
      return;
    }

    router.push({
      pathname: "/tracking",
      params: {
        orderId: String(orderId ?? orderNumber),
        order_number: String(orderNumber ?? orderId),
      },
    } as any);
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      setLoggingOut(true);

      try {
        await AsyncStorage.multiRemove([
          "supplyhive_access_token",
          "access_token",
          "access",
          "token",
          "authToken",
          "authData",
          "user",
          "userData",
          "supplyhive_user",
        ]);

        router.replace("/login" as any);
      } catch {
        showMessage("Error", "Unable to log out. Please try again.");
      } finally {
        setLoggingOut(false);
      }
    };

    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined" &&
        window.confirm("Are you sure you want to log out?");

      if (confirmed) await performLogout();
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ]);
    }
  };

  const activeOrders = orders.filter(isActiveOrder);

  const addressText = savedAddress
    ? [
        savedAddress.address,
        savedAddress.address_line,
        savedAddress.address_line_1,
        savedAddress.city,
        savedAddress.state,
        savedAddress.postal_code,
        savedAddress.pincode,
      ]
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index)
        .join(", ")
    : "";

  const renderOrder = (order: OrderData, index: number) => {
    const orderNumber = order.order_number || order.id || index + 1;
    const orderItems = Array.isArray(order.items)
      ? order.items
      : Array.isArray(order.order_items)
        ? order.order_items
        : [];

    return (
      <Pressable
        key={String(order.id ?? order.order_number ?? index)}
        style={styles.orderCard}
        onPress={() => openTracking(order)}
      >
        <View style={styles.orderTopRow}>
          <View style={styles.flexOne}>
            <Text style={styles.orderNumber}>
              Order #{String(orderNumber).slice(-12)}
            </Text>
            <Text style={styles.mutedText}>
              {formatDate(order.created_at)}
            </Text>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {getOrderStatus(order)}
            </Text>
          </View>
        </View>

        {orderItems.length > 0 ? (
          <Text style={styles.orderDescription} numberOfLines={2}>
            {orderItems
              .map(
                (item: any) =>
                  `${item.product_name || item.name || item.product?.name || "Product"} × ${item.quantity || 1}`
              )
              .join(", ")}
          </Text>
        ) : null}

        <View style={styles.orderBottomRow}>
          <Text style={styles.orderAmount}>
            {formatMoney(order.total_amount ?? order.total)}
          </Text>

          <View style={styles.trackLink}>
            <Text style={styles.trackLinkText}>Track Order</Text>
            <Ionicons
              name="chevron-forward"
              size={17}
              color={COLORS.blue}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.headerInner, { width: contentWidth }]}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={COLORS.dark}
              />
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>My Profile</Text>
              <Text style={styles.headerSubtitle}>
                Your Supplyhive account
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons
                name="person-circle-outline"
                size={35}
                color={COLORS.blue}
              />
            </View>
          </View>
        </View>

        <View style={[styles.content, { width: contentWidth }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.blue} />
              <Text style={styles.mutedText}>
                Loading your profile...
              </Text>
            </View>
          ) : (
            <>
              {profileError ? (
                <View style={styles.errorCard}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={25}
                    color={COLORS.red}
                  />
                  <View style={styles.flexOne}>
                    <Text style={styles.errorTitle}>
                      Profile unavailable
                    </Text>
                    <Text style={styles.errorMessage}>
                      {profileError}
                    </Text>
                    <Pressable
                      style={styles.retryButton}
                      onPress={() => void loadAll()}
                    >
                      <Text style={styles.retryText}>Try Again</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.profileCard}>
                  <View style={styles.avatar}>
                    <Ionicons
                      name="person"
                      size={34}
                      color={COLORS.blue}
                    />
                  </View>

                  <View style={styles.profileInfo}>
                    {!editingProfile ? (
                      <>
                        <Text style={styles.profileName}>
                          {getProfileName(profile)}
                        </Text>
                        <Text style={styles.profileEmail}>
                          {profile?.email || "Email not available"}
                        </Text>
                        <Text style={styles.profilePhone}>
                          {profile?.mobile_number ||
                            profile?.phone ||
                            profile?.mobile ||
                            "Phone number not added"}
                        </Text>

                        <Pressable
                          style={styles.editButton}
                          onPress={startEditingProfile}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={COLORS.white}
                          />
                          <Text style={styles.editButtonText}>
                            Edit Profile
                          </Text>
                        </Pressable>
                      </>
                    ) : (
                      <View style={styles.editForm}>
                        <Text style={styles.formTitle}>
                          Edit Personal Details
                        </Text>

                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                          style={styles.input}
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Enter your name"
                          placeholderTextColor={COLORS.muted}
                          autoCapitalize="words"
                          editable={!savingProfile}
                        />

                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                          style={styles.input}
                          value={editEmail}
                          onChangeText={setEditEmail}
                          placeholder="Enter your email"
                          placeholderTextColor={COLORS.muted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!savingProfile}
                        />

                        <Text style={styles.inputLabel}>Mobile Number</Text>
                        <TextInput
                          style={styles.input}
                          value={editMobile}
                          onChangeText={setEditMobile}
                          placeholder="Enter your mobile number"
                          placeholderTextColor={COLORS.muted}
                          keyboardType="phone-pad"
                          maxLength={15}
                          editable={!savingProfile}
                        />

                        <Pressable
                          style={[
                            styles.saveButton,
                            savingProfile && styles.disabledButton,
                          ]}
                          onPress={() => void saveProfile()}
                          disabled={savingProfile}
                        >
                          {savingProfile ? (
                            <ActivityIndicator color={COLORS.white} />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark-circle-outline"
                                size={19}
                                color={COLORS.white}
                              />
                              <Text style={styles.saveButtonText}>
                                Save Changes
                              </Text>
                            </>
                          )}
                        </Pressable>

                        <Pressable
                          style={styles.cancelButton}
                          onPress={cancelEditingProfile}
                          disabled={savingProfile}
                        >
                          <Text style={styles.cancelButtonText}>
                            Cancel
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name="location-outline"
                    size={23}
                    color={COLORS.blue}
                  />
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>

                {addressText ? (
                  <Text style={styles.addressText}>{addressText}</Text>
                ) : (
                  <Text style={styles.mutedText}>
                    No saved delivery address found.
                  </Text>
                )}

                <Pressable
                  style={styles.outlineButton}
                  onPress={() => router.push("/address" as any)}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={COLORS.blue}
                  />
                  <Text style={styles.outlineButtonText}>
                    Manage Address
                  </Text>
                </Pressable>
              </View>

              <View style={styles.sectionCard}>
                <Pressable
                  style={styles.sectionHeading}
                  onPress={() => setTrackingExpanded((value) => !value)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: trackingExpanded }}
                >
                  <View style={styles.sectionTitleRow}>
                    <Ionicons
                      name="navigate-circle-outline"
                      size={24}
                      color={COLORS.blue}
                    />
                    <Text style={styles.sectionTitle}>
                      Current Order Tracking
                    </Text>
                  </View>

                  <Ionicons
                    name={trackingExpanded ? "chevron-up" : "chevron-down"}
                    size={21}
                    color={COLORS.muted}
                  />
                </Pressable>

                {trackingExpanded ? (
                  <View style={styles.expandedContent}>
                    {ordersError ? (
                      <Text style={styles.errorMessage}>{ordersError}</Text>
                    ) : activeOrders.length > 0 ? (
                      activeOrders.map((order, index) =>
                        renderOrder(order, index)
                      )
                    ) : (
                      <View style={styles.emptyState}>
                        <Ionicons
                          name="cube-outline"
                          size={33}
                          color={COLORS.muted}
                        />
                        <Text style={styles.emptyTitle}>
                          No active orders
                        </Text>
                        <Text style={styles.mutedText}>
                          Your current order tracking will appear here.
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionCard}>
                <Pressable
                  style={styles.sectionHeading}
                  onPress={() => setOrdersExpanded((value) => !value)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: ordersExpanded }}
                >
                  <View style={styles.sectionTitleRow}>
                    <Ionicons
                      name="receipt-outline"
                      size={23}
                      color={COLORS.blue}
                    />
                    <Text style={styles.sectionTitle}>My Orders</Text>
                  </View>

                  <Ionicons
                    name={ordersExpanded ? "chevron-up" : "chevron-down"}
                    size={21}
                    color={COLORS.muted}
                  />
                </Pressable>

                {ordersExpanded ? (
                  <View style={styles.expandedContent}>
                    {ordersError ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.errorMessage}>
                          {ordersError}
                        </Text>
                        <Pressable
                          style={styles.retryButton}
                          onPress={() => void loadOrders()}
                        >
                          <Text style={styles.retryText}>Retry</Text>
                        </Pressable>
                      </View>
                    ) : orders.length > 0 ? (
                      orders.map((order, index) =>
                        renderOrder(order, index)
                      )
                    ) : (
                      <View style={styles.emptyState}>
                        <Ionicons
                          name="bag-handle-outline"
                          size={34}
                          color={COLORS.muted}
                        />
                        <Text style={styles.emptyTitle}>No orders yet</Text>
                        <Text style={styles.mutedText}>
                          Your placed orders will appear here.
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name="time-outline"
                    size={23}
                    color={COLORS.blue}
                  />
                  <Text style={styles.sectionTitle}>Recently Viewed</Text>
                </View>

                {recentProducts.length > 0 ? (
                  recentProducts.map((product, index) => (
                    <Pressable
                      key={String(product.id ?? index)}
                      style={styles.recentItem}
                      onPress={() => {
                        if (product.id != null) {
                          router.push({
                            pathname: "/product",
                            params: { id: String(product.id) },
                          } as any);
                        }
                      }}
                    >
                      <View style={styles.recentIcon}>
                        <Ionicons
                          name="document-text-outline"
                          size={23}
                          color={COLORS.blue}
                        />
                      </View>

                      <View style={styles.flexOne}>
                        <Text style={styles.recentName}>
                          {product.name || product.title || "Product"}
                        </Text>
                        {product.price != null ? (
                          <Text style={styles.recentPrice}>
                            {formatMoney(product.price)}
                          </Text>
                        ) : null}
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={19}
                        color={COLORS.muted}
                      />
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.mutedText}>
                    Products you view will appear here when they are saved
                    in your recently viewed list.
                  </Text>
                )}
              </View>

              <Pressable
                style={styles.logoutButton}
                onPress={() => void handleLogout()}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name="log-out-outline"
                      size={21}
                      color={COLORS.white}
                    />
                    <Text style={styles.logoutText}>Logout</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.footerText}>
                Supplyhive · Shop Smart · Stay Sharp
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 35,
  },
  header: {
    width: "100%",
    backgroundColor: COLORS.header,
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  headerInner: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.dark,
    fontSize: 25,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: 18,
    gap: 15,
    alignSelf: "center",
  },
  loadingContainer: {
    minHeight: 230,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  profileName: {
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.dark,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.muted,
  },
  profilePhone: {
    fontSize: 14,
    color: COLORS.dark,
  },
  editButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 5,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  editForm: {
    width: "100%",
    gap: 8,
  },
  formTitle: {
    fontSize: 17,
    color: COLORS.dark,
    fontWeight: "800",
    marginBottom: 5,
  },
  inputLabel: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
  },
  input: {
    width: "100%",
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FAFCFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.dark,
    fontSize: 14,
  },
  saveButton: {
    minHeight: 46,
    marginTop: 10,
    backgroundColor: COLORS.blue,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
  },
  cancelButtonText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.dark,
    flexShrink: 1,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 30,
  },
  expandedContent: {
    gap: 12,
  },
  addressText: {
    color: COLORS.dark,
    fontSize: 14,
    lineHeight: 22,
  },
  outlineButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  outlineButtonText: {
    color: COLORS.blue,
    fontWeight: "700",
    fontSize: 13,
  },
  orderCard: {
    backgroundColor: "#FAFCFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 12,
  },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  flexOne: {
    flex: 1,
  },
  orderNumber: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  statusPill: {
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 140,
  },
  statusText: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  orderDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  orderBottomRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  orderAmount: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "800",
  },
  trackLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  trackLinkText: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 18,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "800",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  recentName: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  recentPrice: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#F4CCCC",
    borderRadius: 16,
    padding: 16,
  },
  errorTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },
  errorMessage: {
    color: COLORS.red,
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.lightBlue,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 10,
  },
  retryText: {
    color: COLORS.blue,
    fontWeight: "800",
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 15,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    padding: 14,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 8,
  },
});
