

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import CommonFooter from "../components/CommonFooter";

const CART_KEY = "supplyhive_cart";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";

const COLORS = {
  background: "#F7F8FC",
  white: "#FFFFFF",
  blue: "#097AFA",
  dark: "#172033",
  muted: "#68748A",
  border: "#E1E6EF",
  lightBlue: "#EFF5FF",
  red: "#E53935",
  green: "#159957",
};

type CartImage = string | number | undefined;

type CartItem = {
  id: string | number;
  name: string;
  category?: string;
  description?: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image?: CartImage;
  imageKey?: string;
};

const PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  "note-clip": require("../../assets/note-clip.png"),
  book: require("../../assets/book.png"),
  note1: require("../../assets/note1.png"),
  note2: require("../../assets/note2.png"),
  note3: require("../../assets/note3.png"),
  "pen-notepad": require("../../assets/pen-notepad.png"),
  highlighters: require("../../assets/highlighters.png"),
  geometry: require("../../assets/geometry.png"),
  calculator: require("../../assets/calculator.png"),
  sketch: require("../../assets/sketch.png"),
};

const getFallbackImageKey = (
  category = "",
  name = ""
): string => {
  const value = `${category} ${name}`.toLowerCase();

  if (value.includes("file") || value.includes("folder")) {
    return "note-clip";
  }

  if (value.includes("highlighter")) return "highlighters";
  if (value.includes("calculator")) return "calculator";

  if (value.includes("geometry") || value.includes("school")) {
    return "geometry";
  }

  if (value.includes("sketch") || value.includes("art")) {
    return "sketch";
  }

  if (value.includes("pen") || value.includes("pencil")) {
    return "pen-notepad";
  }

  if (value.includes("book")) return "book";

  if (value.includes("paper") || value.includes("notebook")) {
    return "note1";
  }

  return "note1";
};

const getAbsoluteImageUrl = (value: string): string => {
  const image = value.trim();

  if (!image) return "";
  if (/^(https?:\/\/|file:\/\/|data:image\/)/i.test(image)) {
    return image;
  }

  const base = API_BASE_URL.replace(/\/+$/, "");

  return `${base}${image.startsWith("/") ? "" : "/"}${image}`;
};

const getProductImage = (
  item: CartItem
): ImageSourcePropType => {
  const image = item.image;

  if (typeof image === "string" && image.trim()) {
    const value = image.trim();

    if (/^(https?:\/\/|file:\/\/|data:image\/)/i.test(value)) {
      return { uri: getAbsoluteImageUrl(value) };
    }

    const key = value
      .split("/")
      .pop()
      ?.replace(/\.(png|jpg|jpeg|webp)$/i, "")
      .toLowerCase();

    if (key && PRODUCT_IMAGES[key]) {
      return PRODUCT_IMAGES[key];
    }
  }

  if (typeof image === "number") {
    return image;
  }

  const imageKey =
    item.imageKey || getFallbackImageKey(item.category, item.name);

  return PRODUCT_IMAGES[imageKey] || PRODUCT_IMAGES.note1;
};

const formatPrice = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`;

const normalizeCart = (data: unknown): CartItem[] => {
  if (!Array.isArray(data)) return [];

  return data
    .filter(
      (item: any) =>
        item &&
        item.id !== undefined &&
        item.id !== null
    )
    .map((item: any) => ({
      id: String(item.id),
      name: String(item.name || "Stationery Product"),
      category: String(item.category || "Stationery"),
      description: String(item.description || ""),
      price: Math.max(0, Number(item.price) || 0),
      oldPrice: Math.max(
        0,
        Number(item.oldPrice ?? item.price) || 0
      ),
      quantity: Math.min(
        99,
        Math.max(1, Math.floor(Number(item.quantity) || 1))
      ),
      image: item.image,
      imageKey:
        item.imageKey ||
        getFallbackImageKey(item.category, item.name),
    }));
};

export default function CartScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width < 760;
  const isSmallMobile = width < 400;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // LOAD CART
  const loadCart = useCallback(async () => {
    setLoading(true);

    try {
      const stored = await AsyncStorage.getItem(CART_KEY);
      const items = normalizeCart(
        stored ? JSON.parse(stored) : []
      );

      setCartItems(items);

      await AsyncStorage.setItem(
        CART_KEY,
        JSON.stringify(items)
      );

      setSaveError("");
    } catch (error) {
      console.error("Unable to load cart:", error);
      setSaveError("Unable to load your saved cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  // SAVE CART
  const saveCart = async (items: CartItem[]) => {
    setSaving(true);
    setSaveError("");

    try {
      await AsyncStorage.setItem(
        CART_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error("Unable to save cart:", error);
      setSaveError(
        "Cart changes could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // UPDATE QUANTITY
  const updateQuantity = async (
    id: CartItem["id"],
    change: number
  ) => {
    const updated = cartItems.map((item) => {
      if (String(item.id) !== String(id)) return item;

      return {
        ...item,
        quantity: Math.min(
          99,
          Math.max(1, item.quantity + change)
        ),
      };
    });

    setCartItems(updated);
    await saveCart(updated);
  };

  // REMOVE ITEM
  const removeItem = async (id: CartItem["id"]) => {
    const updated = cartItems.filter(
      (item) => String(item.id) !== String(id)
    );

    setCartItems(updated);
    await saveCart(updated);
  };

  // CLEAR CART
  const clearCart = () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all products from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            setCartItems([]);
            void saveCart([]);
          },
        },
      ]
    );
  };

  // OPEN PRODUCT DETAILS
  const openProduct = (item: CartItem) => {
    const imageValue =
      typeof item.image === "string" ? item.image : "";

    router.push({
      pathname: "/product",
      params: {
        id: String(item.id),
        name: item.name,
        category: item.category || "",
        price: String(item.price),
        oldPrice: String(item.oldPrice ?? item.price),
        description: item.description || "",
        image: imageValue,
        imageKey:
          item.imageKey ||
          getFallbackImageKey(item.category, item.name),
      },
    });
  };

  // TOTALS
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalSavings = cartItems.reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        (item.oldPrice ?? item.price) - item.price
      ) *
        item.quantity,
    0
  );

  const deliveryCharge =
    subtotal === 0 || subtotal >= 499 ? 0 : 40;

  const grandTotal = subtotal + deliveryCharge;

  // CHECKOUT
  const proceedToCheckout = () => {
    if (loading || saving) return;

    if (cartItems.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Please add products to your cart first."
      );
      return;
    }

    router.push("/checkout");
  };

  // CART ITEM CARD
  const renderCartItem = (item: CartItem) => {
    const imageSource = getProductImage(item);
    const lineTotal = item.price * item.quantity;

    return (
      <View key={String(item.id)} style={styles.cartItem}>
        <Pressable
          style={[
            styles.imagePressable,
            isSmallMobile && styles.imagePressableSmall,
          ]}
          onPress={() => openProduct(item)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
        >
          <Image
            source={imageSource}
            style={styles.productImage}
            resizeMode="contain"
            onError={() => {
              console.warn(
                "Unable to display image for:",
                item.name
              );
            }}
          />
        </Pressable>

        <View style={styles.itemDetails}>
          <Text style={styles.itemCategory} numberOfLines={1}>
            {item.category || "Stationery"}
          </Text>

          <Pressable
            onPress={() => openProduct(item)}
            accessibilityRole="button"
          >
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>

          {item.description ? (
            <Text
              style={styles.itemDescription}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}

          <Text style={styles.itemUnitPrice}>
            {formatPrice(item.price)} each
          </Text>

          <View style={styles.itemActions}>
            <View style={styles.quantitySelector}>
              <Pressable
                style={styles.quantityButton}
                onPress={() => {
                  if (item.quantity > 1) {
                    void updateQuantity(item.id, -1);
                  } else {
                    void removeItem(item.id);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={COLORS.dark}
                />
              </Pressable>

              <Text style={styles.quantityText}>
                {item.quantity}
              </Text>

              <Pressable
                style={styles.quantityButton}
                onPress={() =>
                  void updateQuantity(item.id, 1)
                }
                disabled={item.quantity >= 99}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={COLORS.dark}
                />
              </Pressable>
            </View>

            <Pressable
              style={styles.removeButton}
              onPress={() => void removeItem(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
            >
              <Ionicons
                name="trash-outline"
                size={15}
                color={COLORS.red}
              />
              <Text style={styles.removeButtonText}>
                Remove
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.itemPriceColumn}>
          <Text style={styles.lineTotal}>
            {formatPrice(lineTotal)}
          </Text>

          {(item.oldPrice ?? item.price) > item.price ? (
            <Text style={styles.itemOldPrice}>
              {formatPrice(
                (item.oldPrice ?? item.price) * item.quantity
              )}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  // UI
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={COLORS.dark}
            />
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Cart</Text>
            <Text style={styles.headerSubtitle}>
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </Text>
          </View>

          <Pressable
            style={styles.shopButton}
            onPress={() => router.push("/shop")}
            accessibilityRole="button"
          >
            <Ionicons
              name="storefront-outline"
              size={19}
              color={COLORS.blue}
            />
          </Pressable>
        </View>

        {/* FREE DELIVERY MESSAGE */}
        {!loading && cartItems.length > 0 && (
          <View style={styles.deliveryBanner}>
            <Ionicons
              name="car-outline"
              size={21}
              color={COLORS.green}
            />

            <View style={styles.deliveryTextContainer}>
              <Text style={styles.deliveryTitle}>
                {subtotal >= 499
                  ? "You've unlocked free delivery!"
                  : `Add ${formatPrice(499 - subtotal)} more for free delivery`}
              </Text>
              <Text style={styles.deliverySubtitle}>
                Free delivery on orders of ₹499 or more.
              </Text>
            </View>
          </View>
        )}

        {/* CART HEADING */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Shopping Cart
            </Text>
            <Text style={styles.sectionSubtitle}>
              Review your stationery items before checkout.
            </Text>
          </View>

          {cartItems.length > 0 && (
            <Pressable
              style={styles.clearCartButton}
              onPress={clearCart}
              accessibilityRole="button"
            >
              <Ionicons
                name="trash-outline"
                size={15}
                color={COLORS.red}
              />
              <Text style={styles.clearCartText}>
                Clear Cart
              </Text>
            </Pressable>
          )}
        </View>

        {/* LOADING */}
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator
              size="large"
              color={COLORS.blue}
            />
            <Text style={styles.stateTitle}>
              Loading your cart...
            </Text>
          </View>
        ) : null}

        {/* LOAD/SAVE ERROR */}
        {!loading && saveError.length > 0 ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={19}
              color={COLORS.red}
            />
            <Text style={styles.errorText}>
              {saveError}
            </Text>
          </View>
        ) : null}

        {/* EMPTY CART */}
        {!loading && cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="cart-outline"
                size={48}
                color={COLORS.blue}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Your cart is empty
            </Text>
            <Text style={styles.emptyDescription}>
              Looks like you haven't added any stationery products yet.
              Explore our shop and find what you need.
            </Text>

            <Pressable
              style={styles.continueShoppingButton}
              onPress={() => router.push("/shop")}
              accessibilityRole="button"
            >
              <Ionicons
                name="storefront-outline"
                size={19}
                color={COLORS.white}
              />
              <Text style={styles.continueShoppingText}>
                Explore Products
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* CART ITEMS */}
        {!loading && cartItems.length > 0 ? (
          <View
            style={[
              styles.mainLayout,
              !isMobile && styles.mainLayoutDesktop,
            ]}
          >
            <View style={styles.itemsPanel}>
              {cartItems.map(renderCartItem)}

              <Pressable
                style={styles.continueLink}
                onPress={() => router.push("/shop")}
                accessibilityRole="button"
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={COLORS.blue}
                />
                <Text style={styles.continueLinkText}>
                  Continue Shopping
                </Text>
              </Pressable>
            </View>

            {/* ORDER SUMMARY */}
            <View
              style={[
                styles.summaryCard,
                !isMobile && styles.summaryCardDesktop,
              ]}
            >
              <Text style={styles.summaryTitle}>
                Order Summary
              </Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Subtotal ({totalItems} items)
                </Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(subtotal)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Delivery
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    deliveryCharge === 0 &&
                      styles.freeDeliveryText,
                  ]}
                >
                  {deliveryCharge === 0
                    ? "FREE"
                    : formatPrice(deliveryCharge)}
                </Text>
              </View>

              {totalSavings > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    You save
                  </Text>
                  <Text style={styles.savingsValue}>
                    −{formatPrice(totalSavings)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(grandTotal)}
                </Text>
              </View>

              <Text style={styles.taxNote}>
                Final charges and taxes will be confirmed during checkout.
              </Text>

              <Pressable
                style={[
                  styles.checkoutButton,
                  saving && styles.checkoutButtonSaving,
                ]}
                onPress={proceedToCheckout}
                disabled={saving || loading}
                accessibilityRole="button"
              >
                <Text style={styles.checkoutButtonText}>
                  {saving
                    ? "Saving Cart..."
                    : "Proceed to Checkout"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={COLORS.white}
                />
              </Pressable>

              <View style={styles.secureNote}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={COLORS.green}
                />
                <Text style={styles.secureNoteText}>
                  Your cart is saved on this device.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* FOOTER */}
        <View style={styles.footerContainer}>
          <CommonFooter />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 35,
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  backButton: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  shopButton: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
  },
  deliveryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EAF8F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 25,
  },
  deliveryTextContainer: {
    flex: 1,
  },
  deliveryTitle: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800",
  },
  deliverySubtitle: {
    color: "#477A5F",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: COLORS.dark,
    fontWeight: "900",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 18,
  },
  clearCartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: "#FFF0F0",
  },
  clearCartText: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: "800",
  },
  stateCard: {
    minHeight: 180,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateTitle: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0F0",
    padding: 13,
    borderRadius: 11,
    marginBottom: 15,
  },
  errorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyCart: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 23,
    paddingVertical: 38,
    alignItems: "center",
    marginTop: 5,
  },
  emptyIconCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 19,
    textAlign: "center",
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    maxWidth: 400,
  },
  continueShoppingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 21,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 23,
  },
  continueShoppingText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  mainLayout: {
    width: "100%",
    flexDirection: "column",
    gap: 20,
    alignItems: "stretch",
  },
  mainLayoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemsPanel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  imagePressable: {
    width: 92,
    height: 102,
    flexShrink: 0,
    borderRadius: 12,
    backgroundColor: "#F0F5FE",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePressableSmall: {
    width: 72,
    height: 84,
    padding: 6,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  itemDetails: {
    flex: 1,
    minWidth: 125,
  },
  itemCategory: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 5,
  },
  itemName: {
    color: COLORS.dark,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  itemDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  itemUnitPrice: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  itemActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    overflow: "hidden",
  },
  quantityButton: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F9FC",
  },
  quantityText: {
    minWidth: 28,
    textAlign: "center",
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: "800",
  },
  removeButton: {
    minHeight: 31,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 3,
  },
  removeButtonText: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: "700",
  },
  itemPriceColumn: {
    minWidth: 70,
    alignItems: "flex-end",
    marginLeft: "auto",
  },
  lineTotal: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "900",
  },
  itemOldPrice: {
    color: COLORS.muted,
    fontSize: 10,
    textDecorationLine: "line-through",
    marginTop: 5,
  },
  continueLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingVertical: 17,
  },
  continueLinkText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "800",
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 19,
  },
  summaryCardDesktop: {
    width: 320,
    flexShrink: 0,
  },
  summaryTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 15,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
    flex: 1,
  },
  summaryValue: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  freeDeliveryText: {
    color: COLORS.green,
  },
  savingsValue: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 7,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 9,
  },
  totalLabel: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "900",
  },
  totalValue: {
    color: COLORS.blue,
    fontSize: 22,
    fontWeight: "900",
  },
  taxNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 12,
  },
  checkoutButton: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  checkoutButtonSaving: {
    opacity: 0.65,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 15,
  },
  secureNoteText: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "center",
  },
  footerContainer: {
    marginTop: 30,
  },
});
