
// app/category/[category].tsx

import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import CommonFooter from "../../components/CommonFooter";

const C = {
  bg: "#FFFFFF",
  blue: "#097AFA",
  text: "#172033",
  muted: "#68748A",
  border: "#E1E6EF",
  white: "#FFFFFF",
  card: "#FFFFFF",
  green: "#16834A",
  red: "#E53935",
  paleBlue: "#F0F6FF",
};

const CATEGORY_NAMES: Record<string, string> = {
  "files-folders": "Files & Folders",
  "paper-notebooks": "Paper & Notebooks",
  "pens-writing": "Pens & Writing",
  "school-supplies": "School Supplies",
  "office-supplies": "Office Supplies",
  "art-supplies": "Art Supplies",
};

const CATEGORY_IMAGES: Record<string, any> = {
  "files-folders": require("../../../assets/files.png"),
  "paper-notebooks": require("../../../assets/pen-notebook.png"),
  "pens-writing": require("../../../assets/eraser.png"),
  "school-supplies": require("../../../assets/school.png"),
  "office-supplies": require("../../../assets/files.png"),
  "art-supplies": require("../../../assets/highlighters.png"),
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  offer: string;
  rating: string;
  reviews: number;
  image: any;
  imageKey: string;
  description: string;
};

const PRODUCTS: Product[] = [
  // FILES & FOLDERS
  {
    id: "file-1",
    name: "Premium Document File",
    category: "Files & Folders",
    price: 89,
    oldPrice: 120,
    offer: "26% OFF",
    rating: "4.5",
    reviews: 128,
    image: require("../../../assets/note-clip.png"),
    imageKey: "note-clip",
    description: "A practical document file for organising your important papers.",
  },
  {
    id: "file-2",
    name: "Classic Document Folder",
    category: "Files & Folders",
    price: 69,
    oldPrice: 90,
    offer: "23% OFF",
    rating: "4.3",
    reviews: 86,
    image: require("../../../assets/book.png"),
    imageKey: "book",
    description: "A simple folder to keep documents neat and organised.",
  },
  {
    id: "file-3",
    name: "Study Document Organizer",
    category: "Files & Folders",
    price: 149,
    oldPrice: 199,
    offer: "25% OFF",
    rating: "4.6",
    reviews: 94,
    image: require("../../../assets/note1.png"),
    imageKey: "note1",
    description: "An everyday organiser for study notes and documents.",
  },

  // PAPER & NOTEBOOKS
  {
    id: "paper-1",
    name: "Classic Ruled Notebook",
    category: "Paper & Notebooks",
    price: 59,
    oldPrice: 75,
    offer: "21% OFF",
    rating: "4.6",
    reviews: 210,
    image: require("../../../assets/note1.png"),
    imageKey: "note1",
    description: "A ruled notebook for daily notes, classwork and writing.",
  },
  {
    id: "paper-2",
    name: "Premium Writing Notebook",
    category: "Paper & Notebooks",
    price: 99,
    oldPrice: 129,
    offer: "23% OFF",
    rating: "4.7",
    reviews: 176,
    image: require("../../../assets/note2.png"),
    imageKey: "note2",
    description: "A premium notebook for organised notes and everyday writing.",
  },
  {
    id: "paper-3",
    name: "Compact Notes Book",
    category: "Paper & Notebooks",
    price: 49,
    oldPrice: 65,
    offer: "25% OFF",
    rating: "4.2",
    reviews: 72,
    image: require("../../../assets/note3.png"),
    imageKey: "note3",
    description: "A compact notebook for quick notes and reminders.",
  },

  // PENS & WRITING
  {
    id: "pen-1",
    name: "Everyday Writing Pen Set",
    category: "Pens & Writing",
    price: 79,
    oldPrice: 99,
    offer: "20% OFF",
    rating: "4.4",
    reviews: 152,
    image: require("../../../assets/pen-notepad.png"),
    imageKey: "pen-notepad",
    description: "Everyday writing pens for school, college and office use.",
  },
  {
    id: "pen-2",
    name: "Colour Highlighter Set",
    category: "Pens & Writing",
    price: 79,
    oldPrice: 99,
    offer: "20% OFF",
    rating: "4.7",
    reviews: 118,
    image: require("../../../assets/highlighters.png"),
    imageKey: "highlighters",
    description: "Colourful highlighters to mark important information.",
  },
  {
    id: "pen-3",
    name: "Study Writing Essentials",
    category: "Pens & Writing",
    price: 119,
    oldPrice: 149,
    offer: "20% OFF",
    rating: "4.5",
    reviews: 91,
    image: require("../../../assets/pen-notepad.png"),
    imageKey: "pen-notepad",
    description: "Useful writing essentials for everyday study sessions.",
  },

  // SCHOOL SUPPLIES
  {
    id: "school-1",
    name: "Student Notebook Set",
    category: "School Supplies",
    price: 129,
    oldPrice: 169,
    offer: "24% OFF",
    rating: "4.6",
    reviews: 143,
    image: require("../../../assets/note2.png"),
    imageKey: "note2",
    description: "A handy notebook set for everyday schoolwork.",
  },
  {
    id: "school-2",
    name: "Geometry Box Essential",
    category: "School Supplies",
    price: 149,
    oldPrice: 189,
    offer: "21% OFF",
    rating: "4.5",
    reviews: 132,
    image: require("../../../assets/geometry.png"),
    imageKey: "geometry",
    description: "Geometry essentials for drawing and mathematics practice.",
  },
  {
    id: "school-3",
    name: "Student Calculator",
    category: "School Supplies",
    price: 249,
    oldPrice: 299,
    offer: "17% OFF",
    rating: "4.4",
    reviews: 87,
    image: require("../../../assets/calculator.png"),
    imageKey: "calculator",
    description: "A practical calculator for everyday study calculations.",
  },

  // OFFICE SUPPLIES
  {
    id: "office-1",
    name: "Office Notes Book",
    category: "Office Supplies",
    price: 99,
    oldPrice: 129,
    offer: "23% OFF",
    rating: "4.5",
    reviews: 96,
    image: require("../../../assets/note3.png"),
    imageKey: "note3",
    description: "A useful notebook for office notes, lists and meetings.",
  },
  {
    id: "office-2",
    name: "Desktop Calculator",
    category: "Office Supplies",
    price: 299,
    oldPrice: 359,
    offer: "17% OFF",
    rating: "4.6",
    reviews: 110,
    image: require("../../../assets/calculator.png"),
    imageKey: "calculator",
    description: "A convenient calculator for daily office calculations.",
  },
  {
    id: "office-3",
    name: "Office Document File",
    category: "Office Supplies",
    price: 179,
    oldPrice: 229,
    offer: "22% OFF",
    rating: "4.3",
    reviews: 65,
    image: require("../../../assets/note-clip.png"),
    imageKey: "note-clip",
    description: "Keep office documents neatly stored and easy to find.",
  },

  // ART SUPPLIES
  {
    id: "art-1",
    name: "Creative Sketch Book",
    category: "Art Supplies",
    price: 119,
    oldPrice: 149,
    offer: "20% OFF",
    rating: "4.7",
    reviews: 124,
    image: require("../../../assets/sketch.png"),
    imageKey: "sketch",
    description: "A sketchbook for drawing, practice and creative ideas.",
  },
  {
    id: "art-2",
    name: "Colour Highlighter Set",
    category: "Art Supplies",
    price: 89,
    oldPrice: 115,
    offer: "23% OFF",
    rating: "4.5",
    reviews: 88,
    image: require("../../../assets/highlighters.png"),
    imageKey: "highlighters",
    description: "Bright colours for creative projects and colourful notes.",
  },
  {
    id: "art-3",
    name: "Drawing Notebook",
    category: "Art Supplies",
    price: 99,
    oldPrice: 129,
    offer: "23% OFF",
    rating: "4.6",
    reviews: 103,
    image: require("../../../assets/sketch.png"),
    imageKey: "sketch",
    description: "A drawing notebook for sketches and creative practice.",
  },
];

export default function CategoryPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const { width } = useWindowDimensions();

  const rawCategory = Array.isArray(params.category)
    ? params.category[0]
    : params.category;

  const categorySlug = rawCategory || "files-folders";
  const categoryName = CATEGORY_NAMES[categorySlug] || "Files & Folders";
  const heroImage = CATEGORY_IMAGES[categorySlug] || CATEGORY_IMAGES["files-folders"];

  const categoryProducts = PRODUCTS.filter(
    (product) => product.category === categoryName
  );

  const columns = width >= 1100 ? 4 : width >= 720 ? 3 : 2;
  const horizontalPadding = width >= 900 ? 36 : 16;
  const gridGap = 16;
  const cardWidth =
    (width - horizontalPadding * 2 - gridGap * (columns - 1)) / columns;

  const openProduct = (product: Product) => {
    router.push({
      pathname: "/product",
      params: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: String(product.price),
        oldPrice: String(product.oldPrice),
        offer: product.offer,
        rating: product.rating,
        reviews: String(product.reviews),
        description: product.description,
        imageKey: product.imageKey,
      },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content"  />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={23} color={C.text} />
          </Pressable>

          <Pressable
            style={styles.brand}
            onPress={() => router.push("/shop" as any)}
          >
            <Text style={styles.brandText}>Supply<Text style={styles.brandBlue}>hive</Text></Text>
          </Pressable>

          <Pressable
            style={styles.cartButton}
            onPress={() => router.push("/cart" as any)}
          >
            <Ionicons name="cart-outline" size={24} color={C.text} />
          </Pressable>
        </View>

        {/* CATEGORY HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image
            source={heroImage}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* QUOTATION */}
        <View style={styles.quoteContainer}>
          <View style={styles.quoteLine} />
          <Text style={styles.quoteText}>
            “Where Ideas Begin – Shop Smart, Stay Sharp.”
          </Text>
          <View style={styles.quoteLine} />
        </View>

        {/* CATEGORY TITLE */}
        <View style={styles.categoryHeading}>
          <Text style={styles.eyebrow}>EXPLORE OUR COLLECTION</Text>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>
            Find the right essentials for every idea.
          </Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultText}>
              {categoryProducts.length} products
            </Text>
            <View style={styles.resultDot} />
            <Text style={styles.resultText}>Quality essentials</Text>
          </View>
        </View>

        {/* PRODUCT GRID */}
        <View
          style={[
            styles.productGrid,
            { paddingHorizontal: horizontalPadding, columnGap: gridGap },
          ]}
        >
          {categoryProducts.map((product) => (
            <View
              key={product.id}
              style={[styles.productCard, { width: cardWidth }]}
            >
              <Pressable
                onPress={() => openProduct(product)}
                style={styles.productImageContainer}
              >
                <View style={styles.offerBadge}>
                  <Text style={styles.offerText}>{product.offer}</Text>
                </View>

                <Image
                  source={product.image}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              </Pressable>

              <View style={styles.productInfo}>
                <Text style={styles.productCategory} numberOfLines={1}>
                  {product.category}
                </Text>

                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={styles.ratingText}>{product.rating}</Text>
                  <Text style={styles.reviewText}>
                    ({product.reviews})
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{product.price}</Text>
                  <Text style={styles.oldPrice}>₹{product.oldPrice}</Text>
                </View>

                <Pressable
                  style={styles.viewButton}
                  onPress={() => openProduct(product)}
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color={C.white}
                  />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {categoryProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={42} color={C.muted} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Please check this category again later.
            </Text>
          </View>
        )}

        {/* COMMON FOOTER */}
        <View style={styles.footerContainer}>
          <CommonFooter />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  header: {
    minHeight: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F6",
    backgroundColor: C.white,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F3F6FB",
  },
  brand: {
    flex: 1,
    alignItems: "center",
  },
  brandText: {
    fontSize: 25,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -1,
  },
  brandBlue: {
    color: C.blue,
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F6FB",
  },
  heroContainer: {
    width: "100%",
    height: 270,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  quoteContainer: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
  },
  quoteLine: {
    width: 42,
    height: 3,
    borderRadius: 3,
    backgroundColor: C.blue,
    marginVertical: 9,
  },
  quoteText: {
    maxWidth: 650,
    textAlign: "center",
    fontSize: 19,
    lineHeight: 29,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 0.15,
  },
  categoryHeading: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: "center",
    backgroundColor: C.paleBlue,
  },
  eyebrow: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  categoryTitle: {
    color: C.text,
    fontSize: 29,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.6,
  },
  categorySubtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: C.muted,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
    gap: 8,
  },
  resultText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  resultDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.blue,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 18,
    paddingTop: 25,
    paddingBottom: 36,
    alignItems: "stretch",
  },
  productCard: {
    backgroundColor: C.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  productImageContainer: {
    height: 165,
    backgroundColor: "#F5F8FD",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  offerBadge: {
    position: "absolute",
    zIndex: 2,
    top: 10,
    left: 10,
    backgroundColor: C.blue,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  offerText: {
    color: C.white,
    fontSize: 10,
    fontWeight: "800",
  },
  productInfo: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 13,
    flexGrow: 1,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: "700",
    color: C.blue,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  productName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: C.text,
    minHeight: 40,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
  },
  reviewText: {
    fontSize: 11,
    color: C.muted,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
    marginBottom: 13,
  },
  price: {
    fontSize: 19,
    fontWeight: "800",
    color: C.text,
  },
  oldPrice: {
    fontSize: 12,
    color: C.muted,
    textDecorationLine: "line-through",
  },
  viewButton: {
    minHeight: 39,
    borderRadius: 8,
    backgroundColor: C.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 7,
  },
  viewButtonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
  },
  footerContainer: {
    marginTop: 10,
  },
});
