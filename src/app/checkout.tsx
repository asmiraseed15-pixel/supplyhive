
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { useRouter } from "expo-router";

const CART_KEY = "supplyhive_cart";
const CHECKOUT_ITEMS_KEY = "supplyhive_checkout_items";
const ADDRESS_KEY = "supplyhive_delivery_address";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

type CartItem = {
  id?: number | string;
  product_id?: number | string;
  product?: any;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number | string;
  quantity?: number | string;
  image?: any;
  imageUrl?: string;
  image_url?: string;
  product_image?: string;
};

type DeliveryAddress = {
  name: string;
  phone: string;
  email: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

const EMPTY_ADDRESS: DeliveryAddress = {
  name: "",
  phone: "",
  email: "",
  address: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

function getProduct(item: CartItem): any {
  return item.product && typeof item.product === "object"
    ? item.product
    : {};
}

function getItemName(item: CartItem): string {
  const product = getProduct(item);

  return (
    item.name ||
    item.title ||
    product.name ||
    product.title ||
    "Product"
  );
}

function getItemPrice(item: CartItem): number {
  const product = getProduct(item);
  const price = Number(item.price ?? product.price ?? 0);

  return Number.isFinite(price) ? price : 0;
}

function getItemQuantity(item: CartItem): number {
  const quantity = Number(item.quantity ?? 1);

  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function formatPrice(value: number): string {
  return `₹${value.toFixed(2)}`;
}

/**
 * Supports:
 * 1. Full backend image URLs
 * 2. Relative Django media paths
 * 3. Local React Native image sources saved in the cart
 */
function getItemImageSource(item: CartItem): any | null {
  const product = getProduct(item);

  const imageCandidates = [
    item.image_url,
    item.imageUrl,
    item.product_image,
    product.image_url,
    product.imageUrl,
    product.product_image,
    item.image,
    product.image,
  ];

  for (const image of imageCandidates) {
    if (typeof image === "number") {
      return image;
    }

    if (
      image &&
      typeof image === "object" &&
      (typeof image.uri === "string" || typeof image === "number")
    ) {
      return image;
    }

    if (typeof image !== "string" || !image.trim()) {
      continue;
    }

    const value = image.trim();

    if (/^https?:\/\//i.test(value)) {
      return { uri: value };
    }

    if (value.startsWith("/")) {
      return { uri: `${API_BASE_URL}${value}` };
    }

    if (
      value.startsWith("media/") ||
      value.startsWith("static/")
    ) {
      return { uri: `${API_BASE_URL}/${value}` };
    }

    if (value.startsWith("products/")) {
      return { uri: `${API_BASE_URL}/media/${value}` };
    }
  }

  return null;
}

function CheckoutProductImage({ item }: { item: CartItem }) {
  const source = getItemImageSource(item);
  const sourceKey =
    source && typeof source === "object" && "uri" in source
      ? String(source.uri)
      : String(source ?? "");

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [sourceKey]);

  if (source && !imageFailed) {
    return (
      <Image
        source={source}
        style={styles.checkoutProductImage}
        resizeMode="contain"
        onError={() => {
          console.log("Checkout product image failed:", sourceKey);
          setImageFailed(true);
        }}
      />
    );
  }

  return (
    <Ionicons
      name="cube-outline"
      size={25}
      color="#1769FF"
    />
  );
}

export default function CheckoutScreen() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] =
    useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const totalAmount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + getItemPrice(item) * getItemQuantity(item),
        0
      ),
    [items]
  );

  async function loadCheckoutData() {
    try {
      setLoading(true);

      const [checkoutRaw, cartRaw, addressRaw] = await Promise.all([
        AsyncStorage.getItem(CHECKOUT_ITEMS_KEY),
        AsyncStorage.getItem(CART_KEY),
        AsyncStorage.getItem(ADDRESS_KEY),
      ]);

      let loadedItems: CartItem[] = [];

      if (checkoutRaw) {
        const parsed = JSON.parse(checkoutRaw);

        if (Array.isArray(parsed)) {
          loadedItems = parsed;
        }
      }

      if (loadedItems.length === 0 && cartRaw) {
        const parsedCart = JSON.parse(cartRaw);

        if (Array.isArray(parsedCart)) {
          loadedItems = parsedCart;
        } else if (Array.isArray(parsedCart?.items)) {
          loadedItems = parsedCart.items;
        }
      }

      setItems(loadedItems);

      if (addressRaw) {
        const savedAddress = JSON.parse(addressRaw);
        setAddress({ ...EMPTY_ADDRESS, ...savedAddress });
      }
    } catch (error) {
      console.error("Checkout loading error:", error);
      setMessage("Unable to load checkout information.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function updateAddress(
    field: keyof DeliveryAddress,
    value: string
  ) {
    setAddress((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (detailsConfirmed) {
      setDetailsConfirmed(false);
      setMessage("");
      setMessageType("");
    }
  }

  function validateAddress(): string | null {
    if (!address.name.trim()) {
      return "Please enter your full name.";
    }

    if (!address.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(address.phone.trim())) {
      return "Please enter a valid phone number.";
    }

    if (
      address.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())
    ) {
      return "Please enter a valid email address.";
    }

    if (!address.address.trim()) {
      return "Please enter your delivery address.";
    }

    if (!address.city.trim()) {
      return "Please enter your city.";
    }

    if (!address.state.trim()) {
      return "Please enter your state.";
    }

    if (!address.pincode.trim()) {
      return "Please enter your PIN code.";
    }

    if (!/^[a-zA-Z0-9\s-]{4,12}$/.test(address.pincode.trim())) {
      return "Please enter a valid PIN code.";
    }

    if (!address.country.trim()) {
      return "Please enter your country.";
    }

    return null;
  }

  async function saveAddress() {
    const validationError = validateAddress();

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    if (items.length === 0) {
      setMessage("Your cart is empty. Please add a product first.");
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);

      await AsyncStorage.setItem(
        ADDRESS_KEY,
        JSON.stringify(address)
      );

      await AsyncStorage.setItem(
        CHECKOUT_ITEMS_KEY,
        JSON.stringify(items)
      );

      setDetailsConfirmed(true);
      setShowProductDetails(false);
      setMessage(
        "Successfully Entered! Your delivery details are saved."
      );
      setMessageType("success");
    } catch (error) {
      console.error("Save address error:", error);
      setMessage("Unable to save your details. Please try again.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function continueToPayment() {
    if (!detailsConfirmed) {
      setMessage("Please save your delivery details first.");
      setMessageType("error");
      return;
    }

    if (items.length === 0) {
      setMessage("Your cart is empty. Please add a product first.");
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);

      await AsyncStorage.setItem(
        ADDRESS_KEY,
        JSON.stringify(address)
      );

      await AsyncStorage.setItem(
        CHECKOUT_ITEMS_KEY,
        JSON.stringify(items)
      );

      router.push("/payment" as any);
    } catch (error) {
      console.error("Payment navigation error:", error);
      setMessage("Unable to open payment. Please try again.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#1769FF" />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={23} color="#142033" />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.headerSubtitle}>
            Delivery details and secure payment
          </Text>
        </View>

        <View style={styles.secureIcon}>
          <Ionicons name="shield-checkmark" size={22} color="#16845B" />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressRow}>
          <View style={styles.progressStep}>
            <View
              style={[styles.progressCircle, styles.progressCircleActive]}
            >
              <Ionicons name="location" size={17} color="#FFFFFF" />
            </View>
            <Text style={styles.progressActiveText}>Delivery</Text>
          </View>

          <View style={styles.progressLine} />

          <View style={styles.progressStep}>
            <View
              style={[
                styles.progressCircle,
                detailsConfirmed && styles.progressCircleActive,
              ]}
            >
              <Ionicons
                name="card-outline"
                size={17}
                color={detailsConfirmed ? "#FFFFFF" : "#8792A3"}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                detailsConfirmed && styles.progressActiveText,
              ]}
            >
              Payment
            </Text>
          </View>
        </View>

        {!!message && (
          <View
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
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={22}
              color={messageType === "success" ? "#137A4A" : "#C62828"}
            />
            <Text
              style={[
                styles.messageText,
                messageType === "success"
                  ? styles.successMessageText
                  : styles.errorMessageText,
              ]}
            >
              {message}
            </Text>
          </View>
        )}

        {detailsConfirmed && (
          <View style={styles.productCard}>
            <View style={styles.successBadge}>
              <Ionicons
                name="checkmark-circle"
                size={17}
                color="#16845B"
              />
              <Text style={styles.successBadgeText}>Details saved</Text>
            </View>

            <Text style={styles.productCardTitle}>Your product</Text>

            {items.map((item, index) => {
              const product = getProduct(item);
              const productName = getItemName(item);
              const price = getItemPrice(item);
              const quantity = getItemQuantity(item);
              const key = String(
                item.id ?? item.product_id ?? product.id ?? index
              );

              return (
                <View
                  key={`${key}-${index}`}
                  style={styles.textProductCard}
                >
                  <View style={styles.textProductHeader}>
                    <View style={styles.productIcon}>
                      <CheckoutProductImage item={item} />
                    </View>

                    <View style={styles.productHeadingInfo}>
                      <Text style={styles.textProductName}>
                        {productName}
                      </Text>
                      <Text style={styles.textProductSubtitle}>
                        Product details
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productDetailRow}>
                    <Text style={styles.productDetailLabel}>Product</Text>
                    <Text style={styles.productDetailValue}>
                      {productName}
                    </Text>
                  </View>

                  {!!(item.category || product.category) && (
                    <View style={styles.productDetailRow}>
                      <Text style={styles.productDetailLabel}>
                        Category
                      </Text>
                      <Text style={styles.productDetailValue}>
                        {item.category || product.category}
                      </Text>
                    </View>
                  )}

                  <View style={styles.productDetailRow}>
                    <Text style={styles.productDetailLabel}>Quantity</Text>
                    <Text style={styles.productDetailValue}>
                      {quantity} {quantity === 1 ? "item" : "items"}
                    </Text>
                  </View>

                  <View style={styles.productDetailRow}>
                    <Text style={styles.productDetailLabel}>Unit price</Text>
                    <Text style={styles.productDetailValue}>
                      {formatPrice(price)}
                    </Text>
                  </View>

                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPriceLabel}>Item total</Text>
                    <Text style={styles.productPriceAmount}>
                      {formatPrice(price * quantity)}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.viewDetailsButton}
                    onPress={() =>
                      setShowProductDetails((previous) => !previous)
                    }
                  >
                    <Text style={styles.viewDetailsText}>
                      {showProductDetails ? "Hide Details" : "View Details"}
                    </Text>
                    <Ionicons
                      name={
                        showProductDetails ? "chevron-up" : "chevron-down"
                      }
                      size={17}
                      color="#1769FF"
                    />
                  </Pressable>

                  {showProductDetails && (
                    <View style={styles.detailsPanel}>
                      {!!(item.description || product.description) && (
                        <Text style={styles.detailsText}>
                          {item.description || product.description}
                        </Text>
                      )}
                      <Text style={styles.detailsText}>
                        Product ID:{" "}
                        {String(
                          item.product_id ??
                            product.id ??
                            item.id ??
                            "N/A"
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={styles.productTotalRow}>
              <Text style={styles.productTotalLabel}>Total amount</Text>
              <Text style={styles.productTotalAmount}>
                {formatPrice(totalAmount)}
              </Text>
            </View>

            <Pressable
              style={[styles.payButton, saving && styles.disabledButton]}
              onPress={continueToPayment}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.payButtonText}>Pay Securely</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>

            <View style={styles.paymentNote}>
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color="#16845B"
              />
              <Text style={styles.paymentNoteText}>
                Continue to choose your available payment method.
              </Text>
            </View>
          </View>
        )}

        {!detailsConfirmed && (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="location-outline"
                    size={22}
                    color="#1769FF"
                  />
                </View>

                <View style={styles.sectionHeadingText}>
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                  <Text style={styles.sectionSubtitle}>
                    Enter where you want your order delivered.
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Full name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={address.name}
                  onChangeText={(value) => updateAddress("name", value)}
                  placeholder="Enter your full name"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Phone number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={address.phone}
                  onChangeText={(value) => updateAddress("phone", value)}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email address</Text>
                <TextInput
                  value={address.email}
                  onChangeText={(value) => updateAddress("email", value)}
                  placeholder="Enter your email (optional)"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  House / Street address{" "}
                  <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={address.address}
                  onChangeText={(value) => updateAddress("address", value)}
                  placeholder="House number, street, area"
                  placeholderTextColor="#98A2B3"
                  style={[styles.input, styles.multilineInput]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Landmark</Text>
                <TextInput
                  value={address.landmark}
                  onChangeText={(value) => updateAddress("landmark", value)}
                  placeholder="Nearby landmark (optional)"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                />
              </View>

              <View style={styles.twoColumnRow}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>
                    City <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={address.city}
                    onChangeText={(value) => updateAddress("city", value)}
                    placeholder="City"
                    placeholderTextColor="#98A2B3"
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>
                    State <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={address.state}
                    onChangeText={(value) => updateAddress("state", value)}
                    placeholder="State"
                    placeholderTextColor="#98A2B3"
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>
                    PIN code <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={address.pincode}
                    onChangeText={(value) =>
                      updateAddress("pincode", value)
                    }
                    placeholder="PIN code"
                    placeholderTextColor="#98A2B3"
                    style={styles.input}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>
                    Country <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={address.country}
                    onChangeText={(value) =>
                      updateAddress("country", value)
                    }
                    placeholder="Country"
                    placeholderTextColor="#98A2B3"
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={saveAddress}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.saveButtonText}>
                      Save Delivery Details
                    </Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.requiredNote}>* Required fields</Text>
            </View>

            <View style={styles.orderSummaryCard}>
              <Text style={styles.sectionTitle}>Order Summary</Text>

              {items.length === 0 ? (
                <Text style={styles.emptyCartText}>
                  Your cart is empty.
                </Text>
              ) : (
                items.map((item, index) => (
                  <View
                    key={String(item.id ?? item.product_id ?? index)}
                    style={styles.summaryRow}
                  >
                    <Text style={styles.summaryName}>
                      {getItemName(item)} × {getItemQuantity(item)}
                    </Text>
                    <Text style={styles.summaryPrice}>
                      {formatPrice(
                        getItemPrice(item) * getItemQuantity(item)
                      )}
                    </Text>
                  </View>
                ))
              )}

              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total amount</Text>
                <Text style={styles.summaryTotalAmount}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>
            </View>
          </>
        )}

        {detailsConfirmed && (
          <View style={styles.savedAddressCard}>
            <View style={styles.savedAddressHeading}>
              <Ionicons
                name="checkmark-circle"
                size={21}
                color="#16845B"
              />
              <Text style={styles.savedAddressTitle}>
                Delivery address saved
              </Text>

              <Pressable
                style={styles.editButton}
                onPress={() => {
                  setDetailsConfirmed(false);
                  setMessage("");
                  setMessageType("");
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={17}
                  color="#1769FF"
                />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            </View>

            <Text style={styles.savedName}>{address.name}</Text>
            <Text style={styles.savedAddressText}>
              {address.address}
              {address.landmark ? `, ${address.landmark}` : ""}
            </Text>
            <Text style={styles.savedAddressText}>
              {address.city}, {address.state} - {address.pincode}
            </Text>
            <Text style={styles.savedAddressText}>{address.country}</Text>
            <Text style={styles.savedAddressText}>
              Phone: {address.phone}
            </Text>
            {!!address.email && (
              <Text style={styles.savedAddressText}>
                Email: {address.email}
              </Text>
            )}
          </View>
        )}

        <View style={styles.bottomNote}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color="#7C8798"
          />
          <Text style={styles.bottomNoteText}>
            Keep your delivery details accurate to avoid delays.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 14 : 12,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF5",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F1F5FA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: "#142033",
    fontSize: 21,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#778397",
    fontSize: 12,
    marginTop: 3,
  },
  secureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E8F7EF",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    paddingVertical: 5,
  },
  progressStep: {
    alignItems: "center",
    gap: 6,
  },
  progressCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#E6EAF1",
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircleActive: {
    backgroundColor: "#1769FF",
  },
  progressText: {
    color: "#8993A4",
    fontSize: 12,
    fontWeight: "600",
  },
  progressActiveText: {
    color: "#1769FF",
    fontSize: 12,
    fontWeight: "700",
  },
  progressLine: {
    width: 75,
    height: 2,
    backgroundColor: "#DCE3EF",
    marginHorizontal: 14,
    marginBottom: 20,
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 13,
    marginBottom: 16,
    gap: 10,
  },
  successMessage: {
    backgroundColor: "#E8F8EF",
    borderWidth: 1,
    borderColor: "#B9E8CC",
  },
  errorMessage: {
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#F4C6C6",
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  successMessageText: {
    color: "#137A4A",
  },
  errorMessageText: {
    color: "#B42318",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    marginBottom: 16,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  sectionIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeadingText: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 17,
    color: "#142033",
    fontWeight: "800",
  },
  sectionSubtitle: {
    marginTop: 4,
    color: "#7B8798",
    fontSize: 12,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#263449",
    marginBottom: 8,
  },
  required: {
    color: "#D92D20",
  },
  input: {
    width: "100%",
    minHeight: 49,
    backgroundColor: "#FBFCFE",
    borderWidth: 1,
    borderColor: "#DCE3ED",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: "#172338",
  },
  multilineInput: {
    minHeight: 88,
    paddingTop: 13,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
    minWidth: 0,
  },
  saveButton: {
    minHeight: 53,
    backgroundColor: "#1769FF",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.65,
  },
  requiredNote: {
    color: "#8993A4",
    fontSize: 11,
    marginTop: 12,
    textAlign: "center",
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DDE7F4",
    marginBottom: 16,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E8F8EF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    marginBottom: 11,
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#137A4A",
  },
  productCardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#142033",
    marginBottom: 5,
  },
  textProductCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8F2",
    borderRadius: 15,
    padding: 16,
    marginTop: 14,
  },
  textProductHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  productIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutProductImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  productHeadingInfo: {
    flex: 1,
  },
  textProductName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#142033",
  },
  textProductSubtitle: {
    fontSize: 12,
    color: "#8290A3",
    marginTop: 4,
  },
  productDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#EDF0F5",
  },
  productDetailLabel: {
    fontSize: 13,
    color: "#748197",
    flexShrink: 0,
  },
  productDetailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#263449",
    flex: 1,
    textAlign: "right",
  },
  productPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E1E8F2",
    marginTop: 5,
    paddingTop: 15,
  },
  productPriceLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#263449",
  },
  productPriceAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1769FF",
  },
  viewDetailsButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 14,
  },
  viewDetailsText: {
    color: "#1769FF",
    fontSize: 13,
    fontWeight: "700",
  },
  detailsPanel: {
    backgroundColor: "#F5F8FD",
    padding: 12,
    borderRadius: 11,
    marginTop: 10,
    gap: 7,
  },
  detailsText: {
    color: "#536176",
    fontSize: 12,
    lineHeight: 18,
  },
  productTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 17,
    paddingBottom: 17,
    borderTopWidth: 1,
    borderTopColor: "#E8EDF5",
    marginTop: 16,
  },
  productTotalLabel: {
    color: "#4D5A6D",
    fontSize: 14,
    fontWeight: "700",
  },
  productTotalAmount: {
    color: "#142033",
    fontSize: 22,
    fontWeight: "900",
  },
  payButton: {
    minHeight: 55,
    backgroundColor: "#1769FF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 15,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },
  paymentNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 13,
  },
  paymentNoteText: {
    color: "#758196",
    fontSize: 11,
    flexShrink: 1,
    textAlign: "center",
  },
  orderSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F6",
  },
  summaryName: {
    flex: 1,
    color: "#536176",
    fontSize: 13,
    lineHeight: 19,
  },
  summaryPrice: {
    color: "#263449",
    fontSize: 13,
    fontWeight: "700",
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
  },
  summaryTotalLabel: {
    color: "#142033",
    fontSize: 14,
    fontWeight: "800",
  },
  summaryTotalAmount: {
    color: "#142033",
    fontSize: 21,
    fontWeight: "900",
  },
  savedAddressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DCE8E2",
    marginBottom: 16,
  },
  savedAddressHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },
  savedAddressTitle: {
    color: "#137A4A",
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    marginLeft: 7,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },
  editButtonText: {
    color: "#1769FF",
    fontSize: 12,
    fontWeight: "700",
  },
  savedName: {
    color: "#142033",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  savedAddressText: {
    color: "#657287",
    fontSize: 13,
    lineHeight: 20,
  },
  emptyCartText: {
    color: "#7B8798",
    fontSize: 13,
    paddingVertical: 12,
  },
  bottomNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    marginTop: 3,
  },
  bottomNoteText: {
    color: "#7C8798",
    fontSize: 11,
    textAlign: "center",
    flexShrink: 1,
  },
});
