


import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import CommonFooter from "../components/CommonFooter";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const CART_KEY = "supplyhive_cart";

const CATEGORIES = [
  "All Products",
  "Files & Folders",
  "Pens & Writings",
  "Paper & Notebooks",
  "School Supplies",
];

const CATEGORY_BANNERS: Record<string, any> = {
  "Files & Folders": require("../../assets/files.png"),
  "Pens & Writings": require("../../assets/eraser.png"),
  "Paper & Notebooks": require("../../assets/pen-notebook.png"),
  "School Supplies": require("../../assets/school.png"),
};

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
};

type Product = {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image?: any;
  imageUrl?: string;
  description?: string;
  offer?: string;
  rating?: number;
  quantity?: number;
  [key: string]: any;
};

const LOCAL_PRODUCTS: Product[] = [
  {
    id: "local-1",
    name: "Premium File Folder",
    price: 99,
    originalPrice: 129,
    category: "Files & Folders",
    image: "files",
    offer: "23% OFF",
    rating: 5,
    description: "A premium folder for organizing your important documents.",
  },
  {
    id: "local-2",
    name: "Document Clip Set",
    price: 49,
    originalPrice: 69,
    category: "Files & Folders",
    image: "clips",
    offer: "29% OFF",
    rating: 5,
    description: "Useful clips for keeping documents together.",
  },
  {
    id: "local-3",
    name: "Classic Ball Pen",
    price: 20,
    originalPrice: 25,
    category: "Pens & Writings",
    image: "pen",
    offer: "20% OFF",
    rating: 5,
    description: "A classic everyday writing pen.",
  },
  {
    id: "local-4",
    name: "Pen and Writing Set",
    price: 149,
    originalPrice: 199,
    category: "Pens & Writings",
    image: "notrpen",
    offer: "25% OFF",
    rating: 5,
    description: "A handy writing set for school and office.",
  },
  {
    id: "local-5",
    name: "Premium Notebook",
    price: 89,
    originalPrice: 119,
    category: "Paper & Notebooks",
    image: "note",
    offer: "25% OFF",
    rating: 5,
    description: "A notebook for notes, ideas, and daily writing.",
  },
  {
    id: "local-6",
    name: "Spiral Notebook",
    price: 79,
    originalPrice: 99,
    category: "Paper & Notebooks",
    image: "note1",
    offer: "20% OFF",
    rating: 5,
    description: "A practical spiral notebook for everyday use.",
  },
  {
    id: "local-7",
    name: "Study Notes Book",
    price: 69,
    originalPrice: 89,
    category: "Paper & Notebooks",
    image: "note2",
    offer: "22% OFF",
    rating: 5,
    description: "A useful book for class notes and revision.",
  },
  {
    id: "local-8",
    name: "Sketch Notebook",
    price: 119,
    originalPrice: 149,
    category: "Paper & Notebooks",
    image: "sketch",
    offer: "20% OFF",
    rating: 5,
    description: "A notebook for sketches and creative ideas.",
  },
  {
    id: "local-9",
    name: "School Text Book",
    price: 199,
    originalPrice: 249,
    category: "School Supplies",
    image: "book",
    offer: "20% OFF",
    rating: 5,
    description: "A school book for everyday learning.",
  },
  {
    id: "local-10",
    name: "Geometry Box",
    price: 129,
    originalPrice: 159,
    category: "School Supplies",
    image: "geometry",
    offer: "19% OFF",
    rating: 5,
    description: "Geometry essentials for school mathematics.",
  },
  {
    id: "local-11",
    name: "Student Calculator",
    price: 249,
    originalPrice: 299,
    category: "School Supplies",
    image: "calculator",
    offer: "17% OFF",
    rating: 5,
    description: "A calculator for everyday study tasks.",
  },
  {
    id: "local-12",
    name: "Eraser Set",
    price: 39,
    originalPrice: 49,
    category: "School Supplies",
    image: "eraser",
    offer: "20% OFF",
    rating: 5,
    description: "An eraser set for school and office stationery.",
  },
  {
    id: "local-13",
    name: "School Backpack",
    price: 499,
    originalPrice: 599,
    category: "School Supplies",
    image: "bag1",
    offer: "17% OFF",
    rating: 5,
    description: "A backpack for carrying school essentials.",
  },
  {
    id: "local-14",
    name: "Daily Use School Bag",
    price: 449,
    originalPrice: 549,
    category: "School Supplies",
    image: "bag2",
    offer: "18% OFF",
    rating: 5,
    description: "A practical bag for everyday school use.",
  },
  {
    id: "local-15",
    name: "Trending Stationery Kit",
    price: 179,
    originalPrice: 229,
    category: "School Supplies",
    image: "trending1",
    offer: "22% OFF",
    rating: 5,
    description: "A stationery kit for everyday study needs.",
  },
  {
    id: "local-16",
    name: "Student Essentials Kit",
    price: 199,
    originalPrice: 249,
    category: "School Supplies",
    image: "trending2",
    offer: "20% OFF",
    rating: 5,
    description: "A collection of student essentials.",
  },
];

function normaliseCategory(category: any = ""): string {
  const raw =
    typeof category === "object" && category !== null
      ? category.name ??
        category.category_name ??
        category.title ??
        ""
      : category;

  const value = String(raw).toLowerCase().trim();

  if (
    value.includes("file") ||
    value.includes("folder") ||
    value.includes("document")
  ) {
    return "Files & Folders";
  }

  if (
    value.includes("pen") ||
    value.includes("writing") ||
    value.includes("stationery") ||
    value.includes("statinoary") ||
    value.includes("stationary") ||
    value.includes("clip")
  ) {
    return "Pens & Writings";
  }

  if (
    value.includes("paper") ||
    value.includes("notebook") ||
    value.includes("note") ||
    value.includes("book")
  ) {
    return "Paper & Notebooks";
  }

  if (
    value.includes("school") ||
    value.includes("bag") ||
    value.includes("eraser") ||
    value.includes("geometry") ||
    value.includes("calculator") ||
    value.includes("student") ||
    value.includes("essential") ||
    value.includes("trending")
  ) {
    return "School Supplies";
  }

  return String(raw || "School Supplies");
}

function getImageKey(image: any): string {
  if (!image || typeof image !== "string") return "";

  const filename =
    image.trim().toLowerCase().split("/").pop()?.split("?")[0] || "";

  return filename.replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");
}

function resolveImageUrl(image: any): string | undefined {
  if (image && typeof image === "object") {
    image =
      image.url ??
      image.image_url ??
      image.image ??
      image.src ??
      "";
  }

  if (typeof image !== "string" || !image.trim()) {
    return undefined;
  }

  const value = image.trim();

  // Use the backend image URL first.
  if (/^https?:\/\//i.test(value)) {
    return value.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      API_BASE_URL
    );
  }

  // Local asset keys should use bundled images.
  if (PRODUCT_IMAGES[getImageKey(value)]) {
    return undefined;
  }

  if (
    value.startsWith("/") ||
    value.startsWith("media/") ||
    value.startsWith("static/") ||
    /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(value)
  ) {
    return `${API_BASE_URL}${
      value.startsWith("/") ? value : `/${value}`
    }`;
  }

  return undefined;
}

function getProductLocalImageKey(product: Product): string {
  const imageKey = getImageKey(product.image);

  if (PRODUCT_IMAGES[imageKey]) {
    return imageKey;
  }

  const text = [
    String(product.name ?? ""),
    String(product.category ?? ""),
    typeof product.image === "string" ? product.image : "",
  ]
    .join(" ")
    .toLowerCase();

  if (/clip/.test(text)) return "clips";
  if (/file|folder|document/.test(text)) return "files";
  if (/spiral/.test(text)) return "note1";
  if (/study notes|study note/.test(text)) return "note2";
  if (/sketch/.test(text)) return "sketch";
  if (/notebook/.test(text)) return "note";
  if (/text[\s_-]*book|textbook/.test(text)) return "book";
  if (/geometry/.test(text)) return "geometry";
  if (/calculator/.test(text)) return "calculator";
  if (/eraser/.test(text)) return "eraser";
  if (/backpack/.test(text)) return "bag1";
  if (/school bag/.test(text)) return "bag2";
  if (/bag/.test(text)) return "baggy";
  if (/essentials/.test(text)) return "trending2";
  if (/trending|stationery kit/.test(text)) return "trending1";
  if (/pen|writing/.test(text)) {
    return /writing set|pen set/.test(text) ? "notrpen" : "pen";
  }

  return "";
}

function normaliseBackendProduct(item: any, index: number): Product {
  const imageValue =
    item.image ??
    item.image_url ??
    item.product_image ??
    item.photo ??
    item.picture ??
    "";

  const price = Number(item.price ?? item.selling_price ?? 0);

  const originalPrice = Number(
    item.original_price ?? item.mrp ?? item.old_price ?? price
  );

  const rawCategory =
    item.category_name ??
    item.category?.name ??
    item.category?.category_name ??
    item.category?.title ??
    item.category ??
    "";

  const productName = String(
    item.name ?? item.title ?? item.product_name ?? "Product"
  );

  const categoryFromName = normaliseCategory(productName);
  const categoryFromBackend = normaliseCategory(rawCategory);

  const category = rawCategory
    ? categoryFromBackend
    : categoryFromName;

  return {
    ...item,
    id: item.id ?? `backend-${index}`,
    name: productName,
    price: Number.isFinite(price) ? price : 0,
    originalPrice:
      Number.isFinite(originalPrice) && originalPrice > price
        ? originalPrice
        : undefined,
    category,
    image: imageValue,
    imageUrl: resolveImageUrl(imageValue),
    description: item.description ?? "",
    offer: item.offer ?? item.discount_label ?? "",
    rating: Number(item.rating ?? 5),
  };
}

function ProductImage({ product }: { product: Product }) {
  const remoteUrl =
    product.imageUrl || resolveImageUrl(product.image);

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [remoteUrl]);

  // Backend image first; existing local image as fallback.
  if (remoteUrl && !imageFailed) {
    return (
      <Image
        source={{ uri: remoteUrl }}
        style={styles.productImage}
        resizeMode="contain"
        onError={() => {
          console.log("Unable to load backend image:", remoteUrl);
          setImageFailed(true);
        }}
      />
    );
  }

  const localKey = getProductLocalImageKey(product);
  const localSource = localKey
    ? PRODUCT_IMAGES[localKey]
    : undefined;

  if (localSource) {
    return (
      <Image
        source={localSource}
        style={styles.productImage}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={styles.imagePlaceholder}>
      <Ionicons name="image-outline" size={38} color="#FFFFFF" />
      <Text style={styles.imagePlaceholderText}>
        Image unavailable
      </Text>
    </View>
  );
}

export default function Shop() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [selectedCategory, setSelectedCategory] =
    useState("All Products");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [products, setProducts] = useState<Product[]>(LOCAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = useCallback(async () => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_KEY);
      const cart = savedCart ? JSON.parse(savedCart) : [];

      const count = Array.isArray(cart)
        ? cart.reduce(
            (total: number, item: any) =>
              total + Number(item.quantity ?? 1),
            0
          )
        : 0;

      setCartCount(count);
    } catch (error) {
      console.log("Unable to load cart:", error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/`);

      if (!response.ok) {
        throw new Error(`Products API failed: ${response.status}`);
      }

      const data = await response.json();

      const backendItems = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.products)
            ? data.products
            : [];

      const normalised: Product[] = backendItems.map(
        (item: any, index: number) =>
          normaliseBackendProduct(item, index)
      );

      // Display the database products directly.
      // Do not merge with local products by name.
      setProducts(
        normalised.length > 0 ? normalised : LOCAL_PRODUCTS
      );

      // Sync cart items with real backend database IDs.
      try {
        const savedCart = await AsyncStorage.getItem(CART_KEY);

        if (savedCart) {
          const cart = JSON.parse(savedCart);

          if (Array.isArray(cart)) {
            const backendProductsByName = new Map(
              normalised
                .filter((product) =>
                  /^\d+$/.test(String(product.id))
                )
                .map((product) => [
                  product.name.trim().toLowerCase(),
                  product,
                ])
            );

            const updatedCart = cart.map((cartItem: any) => {
              const backendProduct = backendProductsByName.get(
                String(cartItem.name ?? cartItem.title ?? "")
                  .trim()
                  .toLowerCase()
              );

              if (!backendProduct) return cartItem;

              return {
                ...cartItem,
                id: backendProduct.id,
                productId: backendProduct.id,
                name: backendProduct.name,
                price: backendProduct.price,
                image: backendProduct.image,
                imageUrl:
                  backendProduct.imageUrl ||
                  resolveImageUrl(backendProduct.image) ||
                  "",
              };
            });

            await AsyncStorage.setItem(
              CART_KEY,
              JSON.stringify(updatedCart)
            );
          }
        }
      } catch (cartError) {
        console.log("Unable to sync saved cart IDs:", cartError);
      }
    } catch (error) {
      console.error("Unable to load backend products:", error);
      setProducts(LOCAL_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
    }, [loadCartCount])
  );

  const filteredProducts = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return products.filter((product) => {
      const productCategory = normaliseCategory(product.category);

      const matchesCategory =
        selectedCategory === "All Products" ||
        productCategory === selectedCategory;

      const matchesSearch =
        !searchText ||
        String(product.name ?? "").toLowerCase().includes(searchText) ||
        String(product.category ?? "").toLowerCase().includes(searchText) ||
        String(product.description ?? "").toLowerCase().includes(searchText);

      const price = Number(product.price ?? 0);

      const matchesMin =
        minPrice.trim() === "" || price >= Number(minPrice);

      const matchesMax =
        maxPrice.trim() === "" || price <= Number(maxPrice);

      return (
        matchesCategory &&
        matchesSearch &&
        matchesMin &&
        matchesMax
      );
    });
  }, [products, selectedCategory, search, minPrice, maxPrice]);

  const bannerSource =
    selectedCategory === "All Products"
      ? require("../../assets/girl.png")
      : CATEGORY_BANNERS[selectedCategory] ??
        require("../../assets/girl.png");

  const addToCart = async (product: Product) => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_KEY);
      const cart: Product[] = savedCart ? JSON.parse(savedCart) : [];

      const existingIndex = cart.findIndex(
        (item: any) =>
          String(item.id) === String(product.id) ||
          String(item.name ?? "").trim().toLowerCase() ===
            product.name.trim().toLowerCase()
      );

      let updatedCart: Product[];

      if (existingIndex >= 0) {
        updatedCart = cart.map((item: any, index: number) =>
          index === existingIndex
            ? {
                ...item,
                ...product,
                id: product.id,
                quantity: Number(item.quantity ?? 1) + 1,
              }
            : item
        );
      } else {
        updatedCart = [...cart, { ...product, quantity: 1 }];
      }

      await AsyncStorage.setItem(
        CART_KEY,
        JSON.stringify(updatedCart)
      );

      await loadCartCount();
    } catch (error) {
      console.log("Unable to add product to cart:", error);
    }
  };

  const openProduct = (product: Product) => {
    const localKey = getProductLocalImageKey(product);

    router.push({
      pathname: "/product",
      params: {
        id: String(product.id),
        name: product.name,
        price: String(product.price),
        image: localKey || "",
        imageUrl:
          product.imageUrl ||
          resolveImageUrl(product.image) ||
          "",
        category: product.category,
        description: product.description || "",
      },
    } as any);
  };

  const openCart = () => {
    router.push("/cart" as any);
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
    setSelectedCategory("All Products");
  };

  const renderCategoryButton = (category: string) => {
    const selected = selectedCategory === category;

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryButton,
          selected && styles.categoryButtonSelected,
        ]}
        onPress={() => setSelectedCategory(category)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.categoryText,
            selected && styles.categoryTextSelected,
          ]}
        >
          {category}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#000000" />
      </TouchableOpacity>
    );
  };

  const renderPriceFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Filter by Price</Text>

      {!isMobile && (
        <>
          <Text style={styles.filterLabel}>Minimum Price</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="₹ Min"
            placeholderTextColor="#667085"
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
          />

          <Text style={styles.filterLabel}>Maximum Price</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="₹ Max"
            placeholderTextColor="#667085"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </>
      )}

      {isMobile && (
        <View style={styles.priceRow}>
          <TextInput
            style={styles.priceInput}
            placeholder="Min ₹"
            placeholderTextColor="#667085"
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
          />
          <Text style={styles.priceSeparator}>to</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="Max ₹"
            placeholderTextColor="#667085"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.clearFilterButton}
        onPress={clearFilters}
      >
        <Text style={styles.clearFilterText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#172033" />
        </TouchableOpacity>

        <Text style={styles.logoText}>Supplyhive</Text>

        <TouchableOpacity onPress={openCart} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={25} color="#172033" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? "99+" : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            selectedCategory !== "All Products" &&
              styles.categoryBannerContainer,
          ]}
        >
          <Image
            source={bannerSource}
            style={
              selectedCategory === "All Products"
                ? styles.heroImage
                : styles.categoryBannerImage
            }
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.tagline}>
            Where Ideas Begin - Shop Smart - Stay Sharp
          </Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#667085" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#98A2B3"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#667085"
                />
              </TouchableOpacity>
            )}
          </View>

          {isMobile && (
            <View style={styles.mobileCategoriesSection}>
              <Text style={styles.sectionTitle}>Categories</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileCategories}
              >
                {CATEGORIES.map((category) => {
                  const selected = selectedCategory === category;

                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.mobileCategory,
                        selected && styles.mobileCategorySelected,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.mobileCategoryText,
                          selected && styles.mobileCategoryTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {renderPriceFilter()}
            </View>
          )}

          <View style={styles.mainLayout}>
            {!isMobile && (
              <View style={styles.sidebar}>
                <Text style={styles.sidebarTitle}>Categories</Text>
                {CATEGORIES.map(renderCategoryButton)}
                {renderPriceFilter()}
              </View>
            )}

            <View style={styles.productsArea}>
              <View style={styles.productsHeader}>
                <View>
                  <Text style={styles.productsTitle}>
                    {selectedCategory}
                  </Text>
                  <Text style={styles.productsCount}>
                    {filteredProducts.length} products found
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchProducts}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={19}
                    color="#097AFA"
                  />
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#097AFA" />
                  <Text style={styles.loadingText}>
                    Loading products...
                  </Text>
                </View>
              ) : filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="search-outline"
                    size={45}
                    color="#98A2B3"
                  />
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptyText}>
                    Try changing your search or price filter.
                  </Text>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={clearFilters}
                  >
                    <Text style={styles.resetButtonText}>
                      Reset Filters
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.productsGrid}>
                  {filteredProducts.map((product) => (
                    <View
                      key={String(product.id)}
                      style={[
                        styles.productCard,
                        isMobile && styles.mobileProductCard,
                      ]}
                    >
                      <View style={styles.productImageContainer}>
                        <ProductImage product={product} />

                        {!!product.offer && (
                          <View style={styles.offerBadge}>
                            <Text style={styles.offerBadgeText}>
                              {product.offer}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.productInfo}>
                        <Text
                          style={styles.productName}
                          numberOfLines={2}
                        >
                          {product.name}
                        </Text>

                        <Text style={styles.productCategory}>
                          {normaliseCategory(product.category)}
                        </Text>

                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name="star"
                              size={14}
                              color="#FFC107"
                            />
                          ))}
                        </View>

                        <View style={styles.priceDisplay}>
                          <Text style={styles.productPrice}>
                            ₹{Number(product.price).toFixed(2)}
                          </Text>

                          {product.originalPrice &&
                            product.originalPrice > product.price && (
                              <Text style={styles.originalPrice}>
                                ₹{Number(product.originalPrice).toFixed(2)}
                              </Text>
                            )}
                        </View>

                        <Text style={styles.offerText}>
                          {product.offer || "SPECIAL OFFERS"}
                        </Text>

                        <TouchableOpacity
                          style={styles.viewDetailsButton}
                          onPress={() => openProduct(product)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.viewDetailsText}>
                            View Details
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.addToCartButton}
                          onPress={() => addToCart(product)}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="cart-outline"
                            size={17}
                            color="#FFFFFF"
                          />
                          <Text style={styles.addToCartText}>
                            Add to Cart
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <CommonFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    height: 64,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9EDF4",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 23,
    fontWeight: "800",
    color: "#097AFA",
  },
  cartButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF4545",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  hero: {
    width: "100%",
    height: 240,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  categoryBannerContainer: {
    height: 220,
  },
  categoryBannerImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 40,
    paddingBottom: 30,
  },
  tagline: {
    fontSize: 18,
    color: "#172033",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  searchContainer: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E0E6EF",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#172033",
    fontSize: 14,
    paddingVertical: 10,
    outlineStyle: "none" as any,
  },
  mobileCategoriesSection: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 12,
  },
  mobileCategories: {
    gap: 9,
    paddingBottom: 4,
  },
  mobileCategory: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#097AFA",
    backgroundColor: "#FFFFFF",
  },
  mobileCategorySelected: {
    backgroundColor: "#097AFA",
    borderColor: "#097AFA",
  },
  mobileCategoryText: {
    color: "#172033",
    fontSize: 12,
    fontWeight: "600",
  },
  mobileCategoryTextSelected: {
    color: "#FFFFFF",
  },
  mainLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  sidebar: {
    width: 230,
    flexShrink: 0,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    borderRadius: 12,
    backgroundColor: "#097AFA,",
  },
  sidebarTitle: {
    fontSize: 17,
    color: "#172033",
    fontWeight: "800",
    marginBottom: 15,
  },
  categoryButton: {
    minHeight: 43,
    paddingHorizontal: 11,
    marginBottom: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#097AFA,",
    borderWidth: 1,
    borderColor: "#E5EAF2",
  },
  categoryButtonSelected: {
    backgroundColor: "#E8F2FF",
    borderColor: "#1374e3",
  },
  categoryText: {
    flex: 1,
    fontSize: 13,
    color: "#172033",
    fontWeight: "600",
  },
  categoryTextSelected: {
    color: "#097AFA",
  },
  filterSection: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F1F6FF",
  },
  filterTitle: {
    fontSize: 16,
    color: "#172033",
    fontWeight: "800",
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    color: "#344054",
    marginBottom: 6,
    marginTop: 7,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceSeparator: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "600",
  },
  priceInput: {
    flex: 1,
    minWidth: 0,
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D5DEEB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#172033",
    fontSize: 14,
  },
  clearFilterButton: {
    marginTop: 12,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 12,
    color: "#097AFA",
    fontWeight: "700",
  },
  productsArea: {
    flex: 1,
    minWidth: 0,
  },
  productsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  productsTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172033",
  },
  productsCount: {
    marginTop: 4,
    color: "#667085",
    fontSize: 13,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5E7FF",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 16,
  },
  productCard: {
    width: "31.5%" as any,
    minWidth: 175,
    maxWidth: 260,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAF2",
  },
  mobileProductCard: {
    width: "47%" as any,
    minWidth: 0,
    maxWidth: "48%" as any,
  },
  productImageContainer: {
    width: "100%",
    height: 170,
    backgroundColor: "#7AABF5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    width: "90%",
    height: "90%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  imagePlaceholderText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  offerBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  offerBadgeText: {
    color: "#097AFA",
    fontSize: 10,
    fontWeight: "800",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    minHeight: 38,
    fontSize: 14,
    fontWeight: "700",
    color: "#172033",
  },
  productCategory: {
    fontSize: 11,
    color: "#667085",
    marginTop: 4,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 2,
  },
  priceDisplay: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 8,
  },
  productPrice: {
    fontSize: 17,
    color: "#172033",
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 12,
    color: "#98A2B3",
    textDecorationLine: "line-through",
  },
  offerText: {
    fontSize: 11,
    color: "#097AFA",
    fontWeight: "800",
    marginTop: 7,
    marginBottom: 10,
  },
  viewDetailsButton: {
    minHeight: 38,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#097AFA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  viewDetailsText: {
    fontSize: 12,
    color: "#097AFA",
    fontWeight: "700",
  },
  addToCartButton: {
    minHeight: 39,
    borderRadius: 7,
    backgroundColor: "#097AFA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 5,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  loadingContainer: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#667085",
    fontSize: 14,
  },
  emptyContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5EAF2",
  },
  emptyTitle: {
    marginTop: 12,
    color: "#172033",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 6,
    color: "#667085",
    fontSize: 13,
    textAlign: "center",
  },
  resetButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#097AFA",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
