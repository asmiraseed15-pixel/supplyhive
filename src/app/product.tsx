

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
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
import { useLocalSearchParams, useRouter } from "expo-router";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const CART_KEY = "supplyhive_cart";
const CHECKOUT_KEY = "supplyhive_checkout_items";
const RETURN_POLICY_KEY = "supplyhive_checkout_return_policy";
const RECENTLY_VIEWED_KEY = "supplyhive_recently_viewed";
const MAX_RECENT_PRODUCTS = 20;

const RETURN_FEES = {
  all_issues: 29,
  wrong_products: 10,
} as const;

type ReturnPolicy = keyof typeof RETURN_FEES | null;

const C = {
  bg: "#D4E1FA",
  blue: "#087CF0",
  white: "#FFFFFF",
  text: "#101827",
  muted: "#69778F",
  yellow: "#FFD900",
  green: "#16834A",
  border: "#C5D6F4",
  lightBlue: "#EEF5FF",
  red: "#D92D20",
};

type BackendProduct = {
  id: number;
  name: string;
  description: string;
  price: string | number;
  stock: number;
  category: string;
  image: string | null;
  is_active: boolean;
  created_at?: string;
};

type CartItem = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image?: string;
  imageKey?: string;
};

type RecentlyViewedProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string;
  imageKey?: string;
  viewedAt: string;
};

type Review = {
  id: string;
  name: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
};

const SAMPLE_REVIEWS: Review[] = [
  {
    id: "sample-1",
    name: "Priya S.",
    rating: 5,
    date: "12 Oct 2026",
    title: "Excellent quality!",
    comment: "Useful product for everyday stationery needs.",
    verified: false,
  },
  {
    id: "sample-2",
    name: "Arun K.",
    rating: 4,
    date: "8 Oct 2026",
    title: "Worth the price",
    comment: "Good value for school and office use.",
    verified: false,
  },
];

const PRODUCT_IMAGES: Record<string, any> = {
  files: require("../../assets/files.png"),
  clips: require("../../assets/note-clip.png"),
  note: require("../../assets/note.png"),
  note1: require("../../assets/note1.png"),
  note2: require("../../assets/note2.png"),
  note3: require("../../assets/note3.png"),
  pen: require("../../assets/pen.png"),
  notrpen: require("../../assets/notepen.png"),
  sketch: require("../../assets/sketch.png"),
  book: require("../../assets/book.png"),
  trending1: require("../../assets/trending1.png"),
  trending2: require("../../assets/trending2.png"),
  trending3: require("../../assets/trending3.png"),
  trending4: require("../../assets/trending4.png"),
  trending5: require("../../assets/trending5.png"),
  trending6: require("../../assets/trending6.png"),
  geometry: require("../../assets/geometry.png"),
  calculator: require("../../assets/calculator.png"),
  eraser: require("../../assets/eraser.png"),
  bag1: require("../../assets/bag1.png"),
  bag2: require("../../assets/bag2.png"),
  baggy: require("../../assets/baggy.png"),
  "note-clip": require("../../assets/note-clip.png"),
  "pen-notepad": require("../../assets/pen-notepad.png"),
  highlighters: require("../../assets/highlighters.png"),
};

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getImageKey(value: string): string {
  if (!value) return "";

  const filename =
    value.trim().toLowerCase().split("?")[0].split("#")[0].split("/").pop() ||
    "";

  const key = filename.replace(/\.(png|jpe?g|webp|gif)$/i, "");

  const aliases: Record<string, string> = {
    "note-clip": "clips",
    "pen-notepad": "notrpen",
    notepen: "notrpen",
    "note-book": "note",
    textbook: "book",
    "school-bag": "bag2",
  };

  return PRODUCT_IMAGES[key] ? key : aliases[key] || "";
}

async function getStoredAccessToken(): Promise<string | null> {
  const keys = [
    "supplyhive_access_token",
    "access_token",
    "access",
    "token",
    "authToken",
    "authData",
    "user",
    "userData",
    "supplyhive_user",
  ];

  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (!value) continue;

    try {
      const parsed = JSON.parse(value);
      const token =
        typeof parsed === "string"
          ? parsed
          : parsed?.tokens?.access ??
            parsed?.access_token ??
            parsed?.accessToken ??
            parsed?.access ??
            parsed?.token ??
            parsed?.user?.access_token;

      if (
        typeof token === "string" &&
        token.trim().split(".").length === 3
      ) {
        return token.trim();
      }
    } catch {
      if (
        key !== "user" &&
        key !== "userData" &&
        key !== "authData" &&
        value.trim().split(".").length === 3
      ) {
        return value.trim();
      }
    }
  }

  return null;
}

function Stars({
  rating,
  size = 17,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={rating >= star ? "star" : "star-outline"}
          size={size}
          color={C.yellow}
        />
      ))}
    </View>
  );
}

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 800;

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    price?: string;
    oldPrice?: string;
    originalPrice?: string;
    rating?: string;
    offer?: string;
    image?: string;
    imageKey?: string;
    category?: string;
    description?: string;
  }>();

  const id = getParam(params.id);
  const routeName = getParam(params.name) || "Stationery Product";
  const routeCategory = getParam(params.category) || "Stationery";
  const rawImage = getParam(params.image);
  const rawImageKey = getParam(params.imageKey);

  const imageKey = getImageKey(rawImageKey) || getImageKey(rawImage);

  const routeImageUrl = /^https?:\/\//i.test(rawImage)
    ? rawImage
    : /^https?:\/\//i.test(rawImageKey)
      ? rawImageKey
      : "";

  const routePriceValue = Number(getParam(params.price));
  const routePrice =
    getParam(params.price) !== "" &&
    Number.isFinite(routePriceValue) &&
    routePriceValue >= 0
      ? routePriceValue
      : 0;

  const oldPriceValue = Number(
    getParam(params.oldPrice) || getParam(params.originalPrice)
  );

  const routeOldPrice =
    Number.isFinite(oldPriceValue) && oldPriceValue >= routePrice
      ? oldPriceValue
      : routePrice;

  const routeDescription =
    getParam(params.description) ||
    `${routeName} is available in our stationery collection.`;

  const [backendProduct, setBackendProduct] =
    useState<BackendProduct | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");

  const isBackendProduct = /^\d+$/.test(id);

  const name = backendProduct?.name || routeName;
  const category = backendProduct?.category || routeCategory;
  const description = backendProduct?.description || routeDescription;
  const price = backendProduct ? Number(backendProduct.price) || 0 : routePrice;
  const oldPrice = routeOldPrice;
  const remoteImage = backendProduct?.image || routeImageUrl;
  const localImage = remoteImage ? undefined : PRODUCT_IMAGES[imageKey];

  const productId = id || name;
  const offer =
    getParam(params.offer) || "Special offers may be available.";

  const stock = backendProduct?.stock ?? null;
  const hasStockLimit = stock !== null;
  const outOfStock = hasStockLimit && stock <= 0;

  const discount =
    oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;

  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "description" | "specifications" | "reviews"
  >("description");

  const [returnOptionsVisible, setReturnOptionsVisible] = useState(false);
  const [returnDetailsVisible, setReturnDetailsVisible] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState<ReturnPolicy>(null);

  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const money = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const subtotal = price * quantity;
  const returnFee = returnPolicy ? RETURN_FEES[returnPolicy] : 0;
  const grandTotal = subtotal + returnFee;

  // Load a real backend product when its numeric ID is provided.
  useEffect(() => {
    if (!isBackendProduct) {
      setBackendProduct(null);
      setProductError("");
      setProductLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProduct() {
      setProductLoading(true);
      setProductError("");
      setBackendProduct(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products/${id}/`
        );

        if (!response.ok) {
          throw new Error(`Product API error: ${response.status}`);
        }

        const data: BackendProduct = await response.json();

        if (!data.is_active) {
          throw new Error("This product is unavailable.");
        }

        if (
          !Number.isFinite(Number(data.price)) ||
          Number(data.price) < 0 ||
          !Number.isFinite(Number(data.stock))
        ) {
          throw new Error("Invalid product information received.");
        }

        if (!cancelled) {
          setBackendProduct(data);
          setQuantity((current) =>
            Math.max(1, Math.min(current, Math.max(1, data.stock)))
          );
        }
      } catch (error) {
        if (!cancelled) {
          setProductError(
            error instanceof Error
              ? error.message
              : "Unable to load product."
          );
        }
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id, isBackendProduct]);

  // Save the latest viewed product without duplicates.
  useEffect(() => {
    if (isBackendProduct && !backendProduct) return;
    if (productLoading || productError || !productId || !name) return;

    let cancelled = false;

    async function saveRecentlyViewed() {
      try {
        const stored = await AsyncStorage.getItem(
          RECENTLY_VIEWED_KEY
        );

        let previous: RecentlyViewedProduct[] = [];

        try {
          const parsed = stored ? JSON.parse(stored) : [];
          previous = Array.isArray(parsed) ? parsed : [];
        } catch {
          previous = [];
        }

        const currentProduct: RecentlyViewedProduct = {
          id: String(productId),
          name,
          price,
          category,
          description,
          image: remoteImage || undefined,
          imageKey: imageKey || undefined,
          viewedAt: new Date().toISOString(),
        };

        const filtered = previous.filter(
          (item) => String(item.id) !== String(productId)
        );

        const updated = [
          currentProduct,
          ...filtered,
        ].slice(0, MAX_RECENT_PRODUCTS);

        if (!cancelled) {
          await AsyncStorage.setItem(
            RECENTLY_VIEWED_KEY,
            JSON.stringify(updated)
          );
        }
      } catch (error) {
        console.error("Recently viewed save failed:", error);
      }
    }

    void saveRecentlyViewed();

    return () => {
      cancelled = true;
    };
  }, [
    productId,
    name,
    price,
    category,
    description,
    remoteImage,
    imageKey,
    isBackendProduct,
    backendProduct,
    productLoading,
    productError,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      try {
        const value = await AsyncStorage.getItem(CART_KEY);
        const cart: CartItem[] = value ? JSON.parse(value) : [];

        if (!cancelled) {
          setCartCount(
            Array.isArray(cart)
              ? cart.reduce(
                  (sum, item) => sum + (Number(item.quantity) || 0),
                  0
                )
              : 0
          );
        }
      } catch {
        if (!cancelled) setCartCount(0);
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/reviews/?product_id=${encodeURIComponent(productId)}`
        );

        if (!response.ok) return;

        const data = await response.json();
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data.reviews)
            ? data.reviews
            : [];

        const parsed: Review[] = rows.map((item: any) => ({
          id: String(item.id),
          name: item.name || "Customer",
          rating: Number(item.rating) || 0,
          date: item.date || "",
          title: item.title || "",
          comment: item.comment || "",
          verified: item.verified === true,
        }));

        if (!cancelled && parsed.length) setReviews(parsed);
      } catch {
        // Keep sample reviews visible if the endpoint is unavailable.
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const reviewAverage = useMemo(() => {
    if (!reviews.length) return 0;

    return (
      reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviews.length
    );
  }, [reviews]);

  const canPurchase =
    !productLoading &&
    !(isBackendProduct && !backendProduct) &&
    !productError &&
    !outOfStock &&
    !(hasStockLimit && quantity > stock);

  const addToCart = async () => {
    if (!canPurchase) {
      setMessage(
        productLoading
          ? "Product loading. Please wait."
          : outOfStock
            ? "This product is out of stock."
            : "Product details load aagala. Please try again."
      );
      return;
    }

    try {
      const value = await AsyncStorage.getItem(CART_KEY);
      const cart: CartItem[] = value ? JSON.parse(value) : [];
      const items: CartItem[] = Array.isArray(cart) ? cart : [];

      const index = items.findIndex(
        (item) => String(item.id) === String(productId)
      );

      if (index >= 0) {
        const nextQuantity =
          (Number(items[index].quantity) || 0) + quantity;

        if (hasStockLimit && nextQuantity > stock) {
          setMessage(`Available stock: ${stock}.`);
          return;
        }

        items[index] = {
          ...items[index],
          name,
          category,
          description,
          price,
          oldPrice,
          quantity: nextQuantity,
          image: remoteImage || imageKey || items[index].image,
        };
      } else {
        items.push({
          id: String(productId),
          name,
          category,
          description,
          price,
          oldPrice,
          quantity,
          image: remoteImage || imageKey || undefined,
          imageKey: imageKey || undefined,
        });
      }

      await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));

      setCartCount(
        items.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        )
      );
      setMessage("Product added to your cart!");
    } catch (error) {
      console.error(error);
      setMessage("Unable to update your cart. Please try again.");
    }
  };

  const buyNow = () => {
    if (!canPurchase) {
      setMessage(
        outOfStock
          ? "This product is out of stock."
          : "Please wait until product details load."
      );
      return;
    }

    setReturnPolicy(null);
    setReturnDetailsVisible(false);
    setReturnOptionsVisible(true);
    setMessage("");
  };

  const continueToCheckout = async () => {
    if (!canPurchase || checkoutLoading) {
      setMessage("Please check product availability before checkout.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const checkoutItems: CartItem[] = [
        {
          id: String(productId),
          name,
          category,
          description,
          price,
          oldPrice,
          quantity,
          image: remoteImage || imageKey || undefined,
          imageKey: imageKey || undefined,
        },
      ];

      await AsyncStorage.setItem(
        CHECKOUT_KEY,
        JSON.stringify(checkoutItems)
      );

      await AsyncStorage.setItem(
        RETURN_POLICY_KEY,
        JSON.stringify({
          policy: returnPolicy,
          fee: returnFee,
        })
      );

      const token = await getStoredAccessToken();

      if (!token) {
        router.replace({
          pathname: "/login",
          params: { next: "/checkout" },
        });
        return;
      }

      router.push("/checkout");
    } catch (error) {
      console.error(error);
      setMessage("Unable to continue to checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const submitReview = async () => {
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      setMessage("Please enter both a review title and comment.");
      return;
    }

    setReviewSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          name: "Supplyhive Customer",
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Review submission failed.");
      }

      const item = data.review || data;

      setReviews((current) => [
        {
          id: String(item.id || Date.now()),
          name: item.name || "Supplyhive Customer",
          rating: Number(item.rating) || reviewRating,
          date: item.date || new Date().toLocaleDateString("en-IN"),
          title: item.title || reviewTitle.trim(),
          comment: item.comment || reviewComment.trim(),
          verified: item.verified === true,
        },
        ...current,
      ]);

      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
      setActiveTab("reviews");
      setMessage("Review submitted successfully!");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={23} color={C.text} />
          </Pressable>

          <Text style={styles.brand}>Supplyhive</Text>

          <Pressable
            style={styles.iconButton}
            onPress={() => router.push("/cart")}
          >
            <Ionicons name="cart-outline" size={25} color={C.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? "99+" : cartCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={[styles.content, isDesktop && styles.desktopContent]}>
          <View
            style={[
              styles.productLayout,
              isDesktop && styles.desktopLayout,
            ]}
          >
            <View
              style={[
                styles.imagePanel,
                isDesktop && styles.desktopImagePanel,
              ]}
            >
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {discount}% OFF
                  </Text>
                </View>
              )}

              {productLoading ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="large" color={C.blue} />
                  <Text style={styles.mutedText}>Loading product...</Text>
                </View>
              ) : localImage ? (
                <Image
                  source={localImage}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : remoteImage ? (
                <Image
                  source={{ uri: remoteImage }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={72}
                    color={C.blue}
                  />
                  <Text style={styles.mutedText}>
                    Product image unavailable
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.detailsPanel,
                isDesktop && styles.desktopDetailsPanel,
              ]}
            >
              <Text style={styles.category}>{category}</Text>
              <Text style={styles.productName}>{name}</Text>

              <View style={styles.ratingLine}>
                <Stars rating={reviewAverage || 5} />
                <Text style={styles.ratingText}>
                  {reviewAverage
                    ? reviewAverage.toFixed(1)
                    : "5.0"}{" "}
                  ({reviews.length} reviews)
                </Text>
              </View>

              <View style={styles.priceLine}>
                <Text style={styles.price}>{money(price)}</Text>
                {oldPrice > price && (
                  <Text style={styles.oldPrice}>{money(oldPrice)}</Text>
                )}
                {discount > 0 && (
                  <Text style={styles.savings}>{discount}% OFF</Text>
                )}
              </View>

              <Text style={styles.offerText}>
                <Ionicons name="pricetag" size={15} color={C.green} />{" "}
                {offer}
              </Text>

              {productLoading ? (
                <Text style={styles.stockText}>
                  Checking availability...
                </Text>
              ) : productError ? (
                <Text style={styles.errorText}>
                  Product unavailable: {productError}
                </Text>
              ) : outOfStock ? (
                <Text style={styles.errorText}>Out of stock</Text>
              ) : hasStockLimit ? (
                <Text style={styles.stockText}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={C.green}
                  />{" "}
                  {stock} units available
                </Text>
              ) : (
                <Text style={styles.stockText}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={C.green}
                  />{" "}
                  Availability to be confirmed by the seller
                </Text>
              )}

              <Text style={styles.description}>{description}</Text>

              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityRow}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Ionicons name="remove" size={21} color={C.text} />
                </Pressable>

                <Text style={styles.quantityValue}>{quantity}</Text>

                <Pressable
                  style={[
                    styles.quantityButton,
                    hasStockLimit &&
                      quantity >= stock &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    quantity >= 99 ||
                    (hasStockLimit && quantity >= stock)
                  }
                  onPress={() => setQuantity((q) => Math.min(99, q + 1))}
                >
                  <Ionicons name="add" size={21} color={C.text} />
                </Pressable>
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  style={[
                    styles.secondaryButton,
                    !canPurchase && styles.disabledButton,
                  ]}
                  disabled={!canPurchase}
                  onPress={addToCart}
                >
                  <Ionicons
                    name="cart-outline"
                    size={19}
                    color={C.blue}
                  />
                  <Text style={styles.secondaryButtonText}>
                    Add to Cart
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.primaryButton,
                    styles.buyButton,
                    !canPurchase && styles.disabledButton,
                  ]}
                  disabled={!canPurchase}
                  onPress={buyNow}
                >
                  <Text style={styles.primaryButtonText}>Buy Now</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={C.white}
                  />
                </Pressable>
              </View>

              {!!message && (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{message}</Text>
                </View>
              )}

              <Pressable
                style={styles.returnsLink}
                onPress={() =>
                  setReturnDetailsVisible((visible) => !visible)
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color={C.blue}
                />
                <View style={styles.returnLinkContent}>
                  <Text style={styles.returnLinkTitle}>Easy Returns</Text>
                  <Text style={styles.mutedText}>
                    Review available return options
                  </Text>
                </View>
                <Ionicons
                  name={
                    returnDetailsVisible ? "chevron-up" : "chevron-down"
                  }
                  size={19}
                  color={C.text}
                />
              </Pressable>

              {returnDetailsVisible && (
                <View style={styles.returnInfo}>
                  <Text style={styles.returnInfoTitle}>
                    Return options
                  </Text>
                  <Text style={styles.returnInfoText}>
                    • All eligible issues: ₹29 service fee
                  </Text>
                  <Text style={styles.returnInfoText}>
                    • Wrong product only: ₹10 service fee
                  </Text>
                  <Text style={styles.mutedText}>
                    Final eligibility depends on the store's return policy.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.tabBar}>
            {(
              [
                ["description", "Description"],
                ["specifications", "Details"],
                ["reviews", "Reviews"],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                style={[
                  styles.tab,
                  activeTab === key && styles.activeTab,
                ]}
                onPress={() => setActiveTab(key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === key && styles.activeTabText,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === "description" && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                Product Description
              </Text>
              <Text style={styles.bodyText}>{description}</Text>
              <Text style={styles.bodyText}>Category: {category}</Text>
              <Text style={styles.bodyText}>
                Suitable for everyday school, office and stationery needs.
              </Text>
            </View>
          )}

          {activeTab === "specifications" && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Product Details</Text>
              {[
                ["Product", name],
                ["Category", category],
                ["Price", money(price)],
                [
                  "Availability",
                  productLoading
                    ? "Loading"
                    : outOfStock
                      ? "Out of stock"
                      : hasStockLimit
                        ? `${stock} units`
                        : "Contact seller",
                ],
                ["Product ID", productId],
              ].map(([label, value]) => (
                <View style={styles.specRow} key={label}>
                  <Text style={styles.specLabel}>{label}</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === "reviews" && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>

              <View style={styles.reviewSummary}>
                <Text style={styles.reviewAverage}>
                  {reviewAverage.toFixed(1)}
                </Text>
                <Stars rating={reviewAverage} size={20} />
                <Text style={styles.mutedText}>
                  Based on {reviews.length} reviews
                </Text>
              </View>

              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {review.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.reviewUser}>
                      <Text style={styles.reviewName}>{review.name}</Text>
                      <Text style={styles.mutedText}>{review.date}</Text>
                    </View>
                    {review.verified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={C.green}
                      />
                    )}
                  </View>

                  <Stars rating={review.rating} size={15} />
                  <Text style={styles.reviewTitle}>{review.title}</Text>
                  <Text style={styles.bodyText}>{review.comment}</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Write a Review</Text>
              <Text style={styles.inputLabel}>Your rating</Text>

              <View style={styles.ratingPicker}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setReviewRating(star)}
                  >
                    <Ionicons
                      name={
                        reviewRating >= star ? "star" : "star-outline"
                      }
                      size={29}
                      color={C.yellow}
                    />
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                value={reviewTitle}
                onChangeText={setReviewTitle}
                placeholder="Review title"
                placeholderTextColor={C.muted}
                maxLength={120}
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Share your experience..."
                placeholderTextColor={C.muted}
                multiline
                maxLength={2000}
                textAlignVertical="top"
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  styles.submitReviewButton,
                  reviewSubmitting && styles.disabledButton,
                ]}
                disabled={reviewSubmitting}
                onPress={submitReview}
              >
                {reviewSubmitting ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Submit Review
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Supplyhive</Text>
          <Text style={styles.footerText}>
            Smarter supply for everyday needs.
          </Text>
          <Text style={styles.footerText}>© 2026 Supplyhive</Text>
        </View>
      </ScrollView>

      {returnOptionsVisible && (
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Choose Return Protection
                </Text>
                <Pressable
                  onPress={() => setReturnOptionsVisible(false)}
                >
                  <Ionicons name="close" size={25} color={C.text} />
                </Pressable>
              </View>

              <Text style={styles.mutedText}>
                Select a return option or continue without optional
                protection.
              </Text>

              <Pressable
                style={[
                  styles.returnOption,
                  returnPolicy === "all_issues" && styles.selectedOption,
                ]}
                onPress={() =>
                  setReturnPolicy((current) =>
                    current === "all_issues" ? null : "all_issues"
                  )
                }
              >
                <Ionicons
                  name={
                    returnPolicy === "all_issues"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color={C.blue}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    All eligible issues
                  </Text>
                  <Text style={styles.mutedText}>
                    Optional return service fee
                  </Text>
                </View>
                <Text style={styles.optionPrice}>₹29</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.returnOption,
                  returnPolicy === "wrong_products" &&
                    styles.selectedOption,
                ]}
                onPress={() =>
                  setReturnPolicy((current) =>
                    current === "wrong_products"
                      ? null
                      : "wrong_products"
                  )
                }
              >
                <Ionicons
                  name={
                    returnPolicy === "wrong_products"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color={C.blue}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    Wrong product only
                  </Text>
                  <Text style={styles.mutedText}>
                    Optional return service fee
                  </Text>
                </View>
                <Text style={styles.optionPrice}>₹10</Text>
              </Pressable>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Product subtotal</Text>
                <Text style={styles.totalValue}>{money(subtotal)}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Return service fee</Text>
                <Text style={styles.totalValue}>
                  {returnFee ? money(returnFee) : "₹0"}
                </Text>
              </View>

              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Estimated total</Text>
                <Text style={styles.grandTotalValue}>
                  {money(grandTotal)}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  styles.checkoutButton,
                  checkoutLoading && styles.disabledButton,
                ]}
                disabled={checkoutLoading}
                onPress={continueToCheckout}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      Continue to Checkout
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={19}
                      color={C.white}
                    />
                  </>
                )}
              </Pressable>

              <Text style={styles.modalFootnote}>
                Payment and final stock availability must be confirmed at
                checkout.
              </Text>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  screen: {
    flex: 1,
    minWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
  },
  topBar: {
    minHeight: 66,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: C.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  brand: {
    fontSize: 23,
    fontWeight: "900",
    color: C.blue,
    letterSpacing: -0.6,
  },
  cartBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
  },
  content: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 35,
    minWidth: 0,
  },
  desktopContent: {
    paddingHorizontal: 26,
    paddingTop: 28,
  },
  productLayout: {
    width: "100%",
    gap: 18,
    minWidth: 0,
  },
  desktopLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
    width: "100%",
  },
  imagePanel: {
    width: "100%",
    height: 310,
    backgroundColor: C.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    overflow: "hidden",
    position: "relative",
  },
  desktopImagePanel: {
    flex: 1,
    width: undefined,
    minWidth: 0,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  discountBadge: {
    position: "absolute",
    left: 14,
    top: 14,
    zIndex: 1,
    backgroundColor: C.yellow,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  discountText: {
    color: C.text,
    fontSize: 12,
    fontWeight: "900",
  },
  detailsPanel: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    minWidth: 0,
  },
  desktopDetailsPanel: {
    flex: 1,
    width: undefined,
    minWidth: 0,
  },
  category: {
    color: C.blue,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  productName: {
    color: C.text,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    marginBottom: 12,
  },
  ratingLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 16,
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  priceLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 13,
  },
  price: {
    color: C.text,
    fontSize: 29,
    fontWeight: "900",
  },
  oldPrice: {
    color: C.muted,
    fontSize: 16,
    textDecorationLine: "line-through",
  },
  savings: {
    color: C.green,
    fontSize: 12,
    fontWeight: "800",
  },
  offerText: {
    color: C.green,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 15,
  },
  stockText: {
    color: C.green,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
  },
  errorText: {
    color: C.red,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
    lineHeight: 20,
  },
  description: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 20,
  },
  quantityLabel: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 9,
  },
  quantityRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.lightBlue,
    padding: 4,
    gap: 15,
    marginBottom: 20,
  },
  quantityButton: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
    minWidth: 20,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
  },
  primaryButton: {
    minHeight: 49,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: C.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buyButton: {
    flex: 1,
    minWidth: 110,
  },
  primaryButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 49,
    flex: 1,
    minWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: C.blue,
    backgroundColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  secondaryButtonText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.45,
  },
  messageBox: {
    backgroundColor: C.lightBlue,
    borderRadius: 12,
    padding: 12,
    marginTop: 13,
  },
  messageText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  returnsLink: {
    marginTop: 18,
    padding: 13,
    borderRadius: 14,
    backgroundColor: C.lightBlue,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  returnLinkContent: {
    flex: 1,
    minWidth: 0,
  },
  returnLinkTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  mutedText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  returnInfo: {
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    marginTop: 10,
    gap: 8,
  },
  returnInfoTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  returnInfoText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 22,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  activeTab: {
    backgroundColor: C.blue,
  },
  tabText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  activeTabText: {
    color: C.white,
  },
  sectionCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    minWidth: 0,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 15,
  },
  bodyText: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 8,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  specLabel: {
    color: C.muted,
    fontSize: 13,
    flex: 1,
  },
  specValue: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    flex: 1.2,
    textAlign: "right",
  },
  reviewSummary: {
    alignItems: "center",
    gap: 7,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: C.lightBlue,
    borderRadius: 14,
  },
  reviewAverage: {
    color: C.text,
    fontSize: 36,
    fontWeight: "900",
  },
  reviewCard: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: C.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: C.blue,
    fontSize: 16,
    fontWeight: "900",
  },
  reviewUser: {
    flex: 1,
    minWidth: 0,
  },
  reviewName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  reviewTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  inputLabel: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 9,
  },
  ratingPicker: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 15,
  },
  input: {
    minHeight: 48,
    backgroundColor: C.lightBlue,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
    marginBottom: 12,
    width: "100%",
  },
  multilineInput: {
    minHeight: 115,
  },
  submitReviewButton: {
    alignSelf: "flex-start",
    minWidth: 155,
    marginTop: 2,
  },
  footer: {
    padding: 25,
    backgroundColor: C.white,
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerBrand: {
    color: C.blue,
    fontSize: 21,
    fontWeight: "900",
  },
  footerText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(16,24,39,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  modalScroll: {
    width: "100%",
    maxWidth: 520,
    flexGrow: 0,
    maxHeight: "100%",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  modalCard: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 19,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 9,
  },
  modalTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: "900",
    flex: 1,
  },
  returnOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 12,
  },
  selectedOption: {
    borderColor: C.blue,
    backgroundColor: C.lightBlue,
  },
  optionContent: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },
  optionPrice: {
    color: C.text,
    fontSize: 15,
    fontWeight: "900",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
  },
  totalLabel: {
    color: C.muted,
    fontSize: 13,
  },
  totalValue: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 5,
    paddingTop: 14,
  },
  grandTotalLabel: {
    color: C.text,
    fontSize: 15,
    fontWeight: "900",
  },
  grandTotalValue: {
    color: C.blue,
    fontSize: 19,
    fontWeight: "900",
  },
  checkoutButton: {
    marginTop: 13,
    width: "100%",
  },
  modalFootnote: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 12,
  },
});
