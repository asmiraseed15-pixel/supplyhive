
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const COLORS = {
  background: "#F7F8FC",
  white: "#FFFFFF",
  text: "#182230",
  muted: "#788394",
  green: "#20A464",
  border: "#E6EAF0",
  paleGreen: "#EAF8F0",
};

type Category = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  image: string;
};

type Product = {
  id: string;
  category: string;
  name: string;
  image: string;
  price: number;
  oldPrice: number;
  rating: number;
};

const CATEGORIES: Category[] = [
  {
    id: "files",
    slug: "Files-and-Folders",
    title: "Files & Folders",
    subtitle: "Organise documents neatly",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700",
  },
  {
    id: "school",
    slug: "School-Supplies",
    title: "School Supplies",
    subtitle: "Everyday student essentials",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700",
  },
  {
    id: "office",
    slug: "Office-Basics",
    title: "Office Basics",
    subtitle: "Essentials for your workspace",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=700",
  },
  {
    id: "paper",
    slug: "Paper-and-Notebooks",
    title: "Paper & Notebooks",
    subtitle: "Every idea starts on paper",
    image:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=700",
  },
  {
    id: "pens",
    slug: "Pens-and-Writing",
    title: "Pens & Writing",
    subtitle: "Pens, pencils and highlighters",
    image:
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=700",
  },
  {
    id: "art",
    slug: "Art-and-Craft",
    title: "Art & Craft",
    subtitle: "Bring your ideas to life",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700",
  },
  {
    id: "desk",
    slug: "Desk-Organizers",
    title: "Desk Organizers",
    subtitle: "Keep your desk clutter-free",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=700",
  },
];

const PRODUCTS: Product[] = [
  {
    id: "file-1",
    category: "files",
    name: "Premium Document File",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600",
    price: 89,
    oldPrice: 120,
    rating: 4.7,
  },
  {
    id: "school-1",
    category: "school",
    name: "Student School Bag",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
    price: 599,
    oldPrice: 799,
    rating: 4.6,
  },
  {
    id: "office-1",
    category: "office",
    name: "Office Document Tray",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600",
    price: 249,
    oldPrice: 320,
    rating: 4.6,
  },
  {
    id: "paper-1",
    category: "paper",
    name: "Classic Ruled Notebook",
    image:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600",
    price: 65,
    oldPrice: 85,
    rating: 4.7,
  },
  {
    id: "pens-1",
    category: "pens",
    name: "Smooth Blue Ball Pens",
    image:
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600",
    price: 40,
    oldPrice: 55,
    rating: 4.6,
  },
  {
    id: "art-1",
    category: "art",
    name: "Artist Colour Set",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600",
    price: 199,
    oldPrice: 259,
    rating: 4.7,
  },
  {
    id: "desk-1",
    category: "desk",
    name: "Desktop Pen Holder",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600",
    price: 119,
    oldPrice: 159,
    rating: 4.6,
  },
];

export default function ShopScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return CATEGORIES;

    return CATEGORIES.filter(
      (category) =>
        category.title.toLowerCase().includes(keyword) ||
        category.subtitle.toLowerCase().includes(keyword)
    );
  }, [search]);

  const openCategory = (category: Category) => {
    router.push({
      pathname: "/category/[category]",
      params: {
        category: category.slug,
      },
    });
  };

  const openProduct = (product: Product) => {
    router.push({
      pathname: "/category/[category]",
      params: {
        category:
          CATEGORIES.find((category) => category.id === product.category)
            ?.slug ?? "Files-and-Folders",
        productId: product.id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pageContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Ionicons name="storefront" size={23} color={COLORS.white} />
            </View>

            <View>
              <Text style={styles.brandName}>Supplyhive</Text>
              <Text style={styles.brandSubtitle}>YOUR STATIONERY STORE</Text>
            </View>
          </View>

          <Pressable
            style={styles.headerIcon}
            onPress={() => router.push("/")}
          >
            <Ionicons name="home-outline" size={22} color={COLORS.text} />
          </Pressable>
        </View>

        {/* INTRO */}
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>DISCOVER OUR COLLECTION</Text>
          <Text style={styles.pageTitle}>Shop Stationery</Text>
          <Text style={styles.pageDescription}>
            Everything you need for school, office and creativity — all in one
            place.
          </Text>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color={COLORS.muted} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search categories..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.muted}
              />
            </Pressable>
          )}
        </View>

        {/* CATEGORY HEADING */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <Text style={styles.sectionSubtitle}>
              Select a category to explore products
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredCategories.length}</Text>
          </View>
        </View>

        {/* CATEGORY LIST: ONE CARD PER ROW */}
        <View style={styles.categoryList}>
          {filteredCategories.map((category) => {
            const count = PRODUCTS.filter(
              (product) => product.category === category.id
            ).length;

            return (
              <Pressable
                key={category.id}
                style={({ pressed }) => [
                  styles.categoryCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => openCategory(category)}
              >
                <Image
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />

                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>

                  <Text style={styles.categorySubtitle}>
                    {category.subtitle}
                  </Text>

                  <View style={styles.categoryBottom}>
                    <Text style={styles.productCount}>
                      {count} featured product{count === 1 ? "" : "s"}
                    </Text>

                    <View style={styles.exploreButton}>
                      <Text style={styles.exploreText}>Explore</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={15}
                        color={COLORS.white}
                      />
                    </View>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={COLORS.muted}
                  style={styles.cardChevron}
                />
              </Pressable>
            );
          })}
        </View>

        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={42}
              color={COLORS.muted}
            />
            <Text style={styles.emptyTitle}>No categories found</Text>
            <Text style={styles.emptySubtitle}>
              Try another category name.
            </Text>
            <Pressable
              style={styles.resetButton}
              onPress={() => setSearch("")}
            >
              <Text style={styles.resetButtonText}>Clear Search</Text>
            </Pressable>
          </View>
        )}

        {/* FEATURED PRODUCTS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Popular Products</Text>
            <Text style={styles.sectionSubtitle}>
              A featured pick from every category
            </Text>
          </View>
        </View>

        <View style={styles.featuredList}>
          {PRODUCTS.map((product) => {
            const discount = Math.round(
              ((product.oldPrice - product.price) / product.oldPrice) * 100
            );

            return (
              <Pressable
                key={product.id}
                style={({ pressed }) => [
                  styles.featuredCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => openProduct(product)}
              >
                <Image
                  source={{ uri: product.image }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />

                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredCategory}>
                    {CATEGORIES.find(
                      (category) => category.id === product.category
                    )?.title ?? "Stationery"}
                  </Text>

                  <Text style={styles.featuredName}>{product.name}</Text>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F5A623" />
                    <Text style={styles.ratingText}>
                      {product.rating.toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{product.price}</Text>
                    <Text style={styles.oldPrice}>₹{product.oldPrice}</Text>
                    <Text style={styles.discount}>{discount}% OFF</Text>
                  </View>

                  <Text style={styles.detailsLink}>
                    View details <Ionicons name="arrow-forward" size={13} />
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Ionicons name="leaf-outline" size={19} color={COLORS.green} />
          <Text style={styles.footerText}>
            Smart stationery choices for everyday creativity.
          </Text>
        </View>

        <Text style={styles.demoNote}>
          Product details, prices and ratings shown here are sample data.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pageContent: {
    paddingBottom: 35,
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  logoBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green,
  },
  brandName: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 3,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: {
    paddingHorizontal: 19,
    paddingTop: 25,
    paddingBottom: 17,
  },
  eyebrow: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 7,
    letterSpacing: -0.8,
  },
  pageDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
  },
  searchBox: {
    minHeight: 52,
    marginHorizontal: 17,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 12,
  },
  sectionHeader: {
    marginTop: 27,
    marginBottom: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  countBadge: {
    minWidth: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: COLORS.paleGreen,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "900",
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 13,
  },
  categoryCard: {
    minHeight: 124,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    overflow: "hidden",
    gap: 12,
  },
  cardPressed: {
    opacity: 0.82,
  },
  categoryImage: {
    width: 96,
    height: 103,
    borderRadius: 12,
    backgroundColor: "#EDF0F3",
  },
  categoryInfo: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 4,
  },
  categoryTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  categorySubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  categoryBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 11,
  },
  productCount: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "700",
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: COLORS.green,
  },
  exploreText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },
  cardChevron: {
    marginRight: 1,
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 13,
  },
  featuredCard: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 13,
  },
  featuredImage: {
    width: 112,
    height: 133,
    borderRadius: 12,
    backgroundColor: "#EDF0F3",
  },
  featuredInfo: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 3,
  },
  featuredCategory: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  featuredName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  ratingText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 7,
  },
  price: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  oldPrice: {
    color: COLORS.muted,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  discount: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
  },
  detailsLink: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 9,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 45,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 12,
  },
  emptySubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  resetButton: {
    marginTop: 15,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.green,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    marginTop: 30,
    marginHorizontal: 18,
    padding: 15,
    borderRadius: 14,
    backgroundColor: COLORS.paleGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  footerText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  demoNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 25,
    marginTop: 12,
  },
});
