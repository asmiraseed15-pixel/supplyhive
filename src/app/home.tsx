

import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const A = {
  logo: require("../../assets/logo.png"),
  heroNotebook: require("../../assets/note.png"),
  heroSale: require("../../assets/bag1.png"),
  bag2: require("../../assets/bag1.png"),
  heroPens: require("../../assets/highlighters.png"),
  writing: require("../../assets/note1.png"),
  paper: require("../../assets/note2.png"),
  folders: require("../../assets/note3.png"),
  notebook: require("../../assets/pen-notepad.png"),
  calculator: require("../../assets/calculator.png"),
  geometry: require("../../assets/geometry.png"),
  office: require("../../assets/note-clip.png"),
  trending1: require("../../assets/trending1.png"),
  trending2: require("../../assets/trending2.png"),
  trending3: require("../../assets/trending3.png"),
  trending4: require("../../assets/trending4.png"),
  trending5: require("../../assets/trending5.png"),
  trending6: require("../../assets/trending6.png"),
  pencil: require("../../assets/sketch.png"),
  schoolCalculator: require("../../assets/notepen.png"),
  schoolNotebook: require("../../assets/book.png"),
  owner: require("../../assets/pro1.png"),
  manager: require("../../assets/pro2.png"),
  keeper: require("../../assets/pro3.png"),
  testimonial: require("../../assets/pro.png"),
};

const C = {
  background: "#D5E0F8",
  white: "#FFFFFF",
  text: "#080A10",
  muted: "#526078",
  blue: "#087BFA",
  cardBlue: "#78A9F7",
  yellow: "#FFDF32",
  border: "#D5DFF0",
};

const featuredProducts = [
  { id: "1", name: "Scientific Calculator", price: 50, image: A.calculator },
  { id: "2", name: "Geometry Set", price: 50, image: A.geometry },
  { id: "3", name: "Office Notebook", price: 50, image: A.office },
];

const schoolProducts = [
  { id: "4", name: "Pencil Set", price: 50, image: A.pencil },
  { id: "5", name: "Geometry Set", price: 50, image: A.schoolCalculator },
  { id: "6", name: "Notebook Set", price: 50, image: A.schoolNotebook },
];

const trendingImages = [
  A.trending1,
  A.trending2,
  A.trending3,
  A.trending4,
  A.trending5,
  A.trending6,
];

const teamMembers = [
  { name: "Seth Rollins", role: "Shop Owner", image: A.owner },
  { name: "Seth Rollins", role: "Manager", image: A.manager },
  { name: "Seth Rollins", role: "Shop Keeper", image: A.keeper },
];

const footerGroups = [
  {
    title: "Company",
    links: ["About us", "Supplyhive corporate", "Careers", "Team"],
  },
  {
    title: "Contact us",
    links: ["Help & Support", "Partner with us", "Ride with us"],
  },
  {
    title: "Available in",
    links: ["Coimbatore", "Bengaluru", "Chennai", "Kolkata"],
  },
  {
    title: "Legal",
    links: ["Terms & Conditions", "Cookie policy", "Privacy Policy"],
  },
  {
    title: "Information",
    links: ["Location", "Email", "Social Media"],
  },
];

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [searchQuery, setSearchQuery] = useState("");

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 950;
  const columns = width < 420 ? 2 : 3;
  const contentWidth = Math.min(width, 1200);

  // SEARCH: pass the entered text to the Shop page.
  const submitSearch = () => {
    const query = searchQuery.trim();

    router.push({
      pathname: "/shop",
      params: query ? { search: query } : {},
    } as never);
  };

  const navigate = (page: string) => {
    const routes: Record<string, string> = {
      Home: "/",
      Shop: "/shop",
      "About us": "/about",
      Contact: "/contact",
      "Login/Register": "/login",
      "Help & Support": "/contact",
      Profile: "/profile",
    };

    const route = routes[page];

    if (route) {
      router.push(route as never);
    }
  };

  const openExternal = (url: string) => {
    Linking.openURL(url).catch((error) => {
      console.warn("Unable to open link:", error);
    });
  };

  const openShop = () => navigate("Shop");

  const addToCart = (productName: string) => {
    router.push({
      pathname: "/shop" as never,
      params: { product: productName },
    });
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const ProductCard = ({
    name,
    price,
    image,
  }: {
    name: string;
    price: number;
    image: any;
  }) => (
    <View style={styles.productCard}>
      <Pressable onPress={openShop} style={styles.productImageWrap}>
        <Image
          source={image}
          style={styles.productImage}
          resizeMode="cover"
        />
      </Pressable>

      <Text style={styles.productName} numberOfLines={2}>
        {name}
      </Text>

      <Text style={styles.stars}>★★★★★</Text>

      <Text style={styles.price}>Rs. {price.toFixed(2)}</Text>

      <Text style={styles.bulkPrice}>
        Buy 3 or more @ Rs. 101.20
      </Text>

      <Pressable
        onPress={() => addToCart(name)}
        style={({ pressed }) => [
          styles.cartButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.cartButtonText}>Add to Cart</Text>
      </Pressable>
    </View>
  );

  const ImageGrid = ({
    images,
    accessibilityLabel,
  }: {
    images: any[];
    accessibilityLabel: string;
  }) => (
    <View style={[styles.imageGrid, { maxWidth: contentWidth }]}>
      {images.map((image, index) => (
        <Pressable
          key={`${accessibilityLabel}-${index}`}
          style={[
            styles.gridItem,
            { width: `${100 / 3 - 3}%` as `${number}%` },
          ]}
          onPress={openShop}
          accessibilityLabel={`${accessibilityLabel} ${index + 1}`}
        >
          <Image
            source={image}
            style={styles.gridImage}
            resizeMode="cover"
          />
        </Pressable>
      ))}
    </View>
  );

  const ProductGrid = ({
    items,
  }: {
    items: typeof featuredProducts;
  }) => (
    <View style={[styles.productGrid, { maxWidth: contentWidth }]}>
      {items.map((product) => (
        <View
          key={product.id}
          style={[
            styles.productWrapper,
            { width: `${100 / columns - 4}%` as `${number}%` },
          ]}
        >
          <ProductCard
            name={product.name}
            price={product.price}
            image={product.image}
          />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              style={styles.brand}
              onPress={() => navigate("Home")}
            >
              <Image
                source={A.logo}
                style={styles.logo}
                resizeMode="contain"
              />
              {!isMobile && (
                <Text style={styles.brandName}>Supplyhive</Text>
              )}
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.navLinks}
            >
              {["Home", "Shop", "About us", "Contact", "Login/Register"].map(
                (item) => (
                  <Pressable
                    key={item}
                    onPress={() => navigate(item)}
                    style={styles.navItem}
                  >
                    <Text
                      style={[
                        styles.navText,
                        item === "Home" && styles.activeNav,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>

            {/* DESKTOP SEARCH */}
            {!isMobile && (
              <View style={styles.search}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for Stationery"
                  placeholderTextColor={C.white}
                  style={[
                    styles.searchInput,
                    {
                      width: Math.max(
                        85,
                        Math.min(155, width * 0.14)
                      ),
                    },
                  ]}
                  returnKeyType="search"
                  onSubmitEditing={submitSearch}
                  accessibilityLabel="Search for stationery"
                />

                <Pressable
                  onPress={submitSearch}
                  hitSlop={8}
                  accessibilityLabel="Submit search"
                >
                  <Ionicons
                    name="search"
                    size={13}
                    color={C.white}
                  />
                </Pressable>
              </View>
            )}

            <Pressable
              style={styles.headerIcon}
              onPress={openShop}
              accessibilityLabel="Shopping cart"
            >
              <Ionicons name="cart-outline" size={19} color={C.text} />
            </Pressable>

            <Pressable
  style={styles.headerIcon}
  onPress={() => navigate("Profile")}
  accessibilityLabel="Profile"
>
  <Ionicons
    name="person-circle-outline"
    size={19}
    color={C.text}
  />
</Pressable>
          </View>

          {/* MOBILE SEARCH */}
          {isMobile && (
            <View style={styles.mobileSearch}>
              <Ionicons
                name="search"
                size={16}
                color={C.muted}
              />

              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for Stationery"
                placeholderTextColor={C.muted}
                style={styles.mobileSearchInput}
                returnKeyType="search"
                onSubmitEditing={submitSearch}
                accessibilityLabel="Search for stationery"
              />

              <Pressable
                onPress={submitSearch}
                hitSlop={8}
                accessibilityLabel="Submit search"
              >
                <Ionicons
                  name="arrow-forward-circle"
                  size={21}
                  color={C.blue}
                />
              </Pressable>
            </View>
          )}

          {/* HERO */}
          <View style={[styles.hero, isMobile && styles.heroMobile]}>
            <Image
              source={A.heroNotebook}
              style={[styles.heroImage, styles.heroLeft]}
              resizeMode="cover"
            />

            <View style={styles.heroCenter}>
              <Pressable
                style={styles.saleBanner}
                onPress={openShop}
              >
                <Text style={styles.saleTitle}>Upto 50% off on</Text>
                <Text style={styles.saleTitle}>Bulk Order</Text>
              </Pressable>

              <View style={styles.bagsRow}>
                <Image
                  source={A.heroSale}
                  style={styles.bagImage}
                  resizeMode="contain"
                />

                <Image
                  source={A.bag2}
                  style={styles.bagImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Image
              source={A.heroPens}
              style={[styles.heroImage, styles.heroRight]}
              resizeMode="cover"
            />
          </View>

          {/* INTRODUCTION */}
          <View style={styles.intro}>
            <SectionTitle title="Essential Stationery, Exceptional Supply" />

            <Text style={styles.introText}>
              From pens to paper, we deliver quality tools that power
              classrooms, offices, and creativity. Bulk pricing, reliable
              service, and everything your workspace needs—right at your
              fingertips.
            </Text>
          </View>

          {/* CATEGORY IMAGES */}
          <ImageGrid
            images={[A.writing, A.paper, A.folders]}
            accessibilityLabel="Stationery category"
          />

          {/* CATEGORY DESCRIPTIONS */}
          <View
            style={[
              styles.description,
              isMobile && styles.descriptionMobile,
              { maxWidth: contentWidth },
            ]}
          >
            <View style={styles.descriptionText}>
              <Text style={styles.descriptionTitle}>
                1. Writing Essentials
              </Text>
              <Text style={styles.bodyText}>
                From everyday ballpoint pens to premium gel pens and
                highlighters, our writing tools ensure clarity, comfort,
                and reliability. Perfect for classrooms, offices, or
                creative spaces, these essentials support productivity
                and expression at every level.
              </Text>

              <Text style={styles.descriptionTitle}>2. Paper Products</Text>
              <Text style={styles.bodyText}>
                Whether it’s notebooks, notepads, printer paper, or sticky
                notes, our paper supplies cover every need. Designed for
                durability and smooth performance, these products are
                ideal for note-taking, organizing, printing, or planning.
              </Text>

              <Text style={styles.descriptionTitle}>
                3. Classroom & Office Tools
              </Text>
              <Text style={styles.bodyText}>
                Keep workspaces equipped and efficient with rulers,
                staplers, scissors, erasers, and more. These tools bring
                order and precision to daily tasks in educational and
                professional environments.
              </Text>
            </View>

            <Image
              source={A.notebook}
              style={[
                styles.descriptionImage,
                isMobile && styles.descriptionImageMobile,
              ]}
              resizeMode="contain"
            />
          </View>

          {/* FEATURED PRODUCTS */}
          <SectionTitle title="Featured Product" />
          <ProductGrid items={featuredProducts} />

          {/* TRENDING */}
          <SectionTitle title="Trending" />
          <ImageGrid
            images={trendingImages}
            accessibilityLabel="Trending product"
          />

          {/* TESTIMONIAL */}
          <View style={styles.testimonial}>
            <SectionTitle title="Customer Testimonial" />

            <Text style={styles.testimonialTagline}>
              Bulk Stationery. Better Prices.{"\n"}
              Smarter Supply.
            </Text>

            <Image
              source={A.testimonial}
              style={styles.testimonialAvatar}
              resizeMode="cover"
            />

            <Text style={styles.testimonialQuote}>
              Working with SupplyHive has been a game-changer for my store.
              The quality of the stationery is consistently high, prices
              are competitive, and orders always arrive on time—making it
              easy to keep my shelves stocked and customers happy.
            </Text>

            <Text style={styles.customerName}>Priya M.</Text>
            <Text style={styles.customerRole}>Retail shop Owner</Text>
          </View>

          {/* BACK TO SCHOOL */}
          <SectionTitle title="Back to School" />
          <ProductGrid items={schoolProducts} />

          {/* TEAM */}
          <View style={styles.teamSection}>
            <SectionTitle title="The Team" />

            <Text style={styles.teamIntro}>
              Our team is a dedicated group of professionals passionate
              about delivering quality stationery in bulk with efficiency
              and care. With expertise in sourcing, logistics, and customer
              service, we ensure every order meets the highest standards.
            </Text>

            <View style={styles.teamGrid}>
              {teamMembers.map((member, index) => (
                <View key={index} style={styles.teamMember}>
                  <Image
                    source={member.image}
                    style={styles.teamImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Pressable
              style={styles.footerBrand}
              onPress={() => navigate("Home")}
            >
              <Image
                source={A.logo}
                style={styles.footerLogo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.footerBrandName}>Supplyhive</Text>
                <Text style={styles.copyright}>
                  2025 Supplyhive Limited
                </Text>
              </View>
            </Pressable>

            <View style={styles.footerGroups}>
              {footerGroups.map((group) => (
                <View key={group.title} style={styles.footerGroup}>
                  <Text style={styles.footerHeading}>{group.title}</Text>

                  {group.links.map((link) => (
                    <Pressable
                      key={link}
                      onPress={() => navigate(link)}
                    >
                      <Text style={styles.footerLink}>{link}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.socials}>
              <Pressable
                onPress={() =>
                  openExternal("https://www.instagram.com/")
                }
                accessibilityLabel="Instagram"
              >
                <Ionicons
                  name="logo-instagram"
                  size={20}
                  color="#E4405F"
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  openExternal("https://www.facebook.com/")
                }
                accessibilityLabel="Facebook"
              >
                <Ionicons
                  name="logo-facebook"
                  size={20}
                  color="#1877F2"
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  openExternal("https://www.whatsapp.com/")
                }
                accessibilityLabel="WhatsApp"
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={20}
                  color="#20C763"
                />
              </Pressable>
            </View>

            {/* APP DOWNLOAD BUTTONS */}
            <View
              style={[
                styles.appDownload,
                isMobile && styles.appDownloadMobile,
              ]}
            >
              <Text style={styles.appDownloadText}>
                For better experience, download the app now
              </Text>

              <Pressable
                style={styles.storeButton}
                onPress={() =>
                  openExternal("https://play.google.com/store")
                }
              >
                <Ionicons
                  name="logo-google"
                  size={23}
                  color="#20A464"
                />
                <View>
                  <Text style={styles.storeSmall}>Get it on</Text>
                  <Text style={styles.storeTitle}>Google Play</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.storeButton}
                onPress={() =>
                  openExternal("https://www.apple.com/app-store/")
                }
              >
                <Ionicons
                  name="logo-apple"
                  size={23}
                  color="#111111"
                />
                <View>
                  <Text style={styles.storeSmall}>Download on the</Text>
                  <Text style={styles.storeTitle}>App Store</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f4f4",
  },
  page: {
    flex: 1,
    backgroundColor: "#f7f4f4",
  },
  pageContent: {
    alignItems: "center",
    paddingBottom: 24,
  },
  centerContent: {
    width: "100%",
    alignItems: "center",
  },

  // Header
  header: {
    width: "100%",
    minHeight: 52,
    backgroundColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    gap: 10,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 18,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },
  navItem: {
    paddingVertical: 12,
  },
  navText: {
    fontSize: 12,
    color: C.text,
  },
  activeNav: {
    color: C.blue,
    fontWeight: "700",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.blue,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  searchText: {
    fontSize: 10,
    color: C.white,
  },
  searchInput: {
    fontSize: 10,
    color: C.white,
    padding: 0,
    margin: 0,
  },
  headerIcon: {
    padding: 3,
  },
  mobileSearch: {
    width: "94%",
    backgroundColor: C.white,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    gap: 10,
  },
  mobileSearchText: {
    color: C.muted,
    fontSize: 12,
  },
  mobileSearchInput: {
    flex: 1,
    minWidth: 0,
    color: C.muted,
    fontSize: 12,
    padding: 0,
    margin: 0,
  },

  // Hero
  hero: {
    width: "100%",
    maxWidth: 1000,
    minHeight: 310,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 22,
    gap: 12,
  },
  heroMobile: {
    minHeight: 190,
    paddingHorizontal: 8,
    gap: 6,
  },
  heroImage: {
    width: "31%",
    height: 155,
    borderRadius: 11,
  },
  heroLeft: {
    marginTop: 52,
  },
  heroRight: {
    marginBottom: 52,
  },
  saleBanner: {
    width: "100%",
    backgroundColor: "#FF393F",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  saleTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#080808",
    textAlign: "center",
  },
  heroCenter: {
    width: "32%",
    alignItems: "center",
    justifyContent: "center",
  },
  bagsRow: {
    width: "100%",
    height: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bagImage: {
    width: "50%",
    height: "100%",
  },

  // Introduction
  intro: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: C.text,
    marginTop: 30,
    marginBottom: 22,
  },
  introText: {
    width: "100%",
    maxWidth: 760,
    fontSize: 15,
    lineHeight: 18,
    color: C.text,
    textAlign: "center",
  },

  // Category images and trending
  imageGrid: {
    width: "150%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  gridItem: {
    minWidth: 0,
  },
  gridImage: {
    width: "80%",
    height: 140,
    borderRadius: 15,
  },

  // Description
  description: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    gap: 20,
    marginBottom: 25,
  },
  descriptionMobile: {
    paddingHorizontal: 14,
    gap: 6,
  },
  descriptionText: {
    flex: 1.4,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginTop: 8,
    marginBottom: 9,
  },
  bodyText: {
    fontSize: 15,
    color: C.text,
    lineHeight: 17,
    marginBottom: 10,
  },
  descriptionImage: {
    flex: 1,
    height: 400,
  },
  descriptionImageMobile: {
    height: 190,
  },

  // Product cards
  productGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 15,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  productWrapper: {
    minWidth: 0,
  },
  productCard: {
    flex: 1,
    backgroundColor: C.cardBlue,
    borderRadius: 11,
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 11,
  },
  productImageWrap: {
    width: "100%",
    alignItems: "center",
  },
  productImage: {
    width: "60%",
    height: 105,
    backgroundColor: C.white,
  },
  productName: {
    color: C.text,
    fontSize: 14,
    lineHeight: 15,
    minHeight: 29,
    textAlign: "center",
    marginTop: 7,
    marginHorizontal: 3,
  },
  stars: {
    color: C.yellow,
    fontSize: 17,
    letterSpacing: 1,
  },
  price: {
    fontSize: 11,
    color: C.text,
    fontWeight: "700",
    marginTop: 4,
  },
  bulkPrice: {
    fontSize: 9,
    color: C.text,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  cartButton: {
    backgroundColor: C.blue,
    borderRadius: 20,
    minWidth: "72%",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cartButtonText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 11,
  },
  pressed: {
    opacity: 0.7,
  },

  // Testimonial
  testimonial: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  testimonialTagline: {
    fontSize: 15,
    lineHeight: 19,
    textAlign: "center",
    color: C.text,
  },
  testimonialAvatar: {
    width: 54,
    height: 54,
    borderRadius: 30,
    marginVertical: 12,
  },
  testimonialQuote: {
    width: "100%",
    maxWidth: 760,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
    color: C.text,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginTop: 14,
  },
  customerRole: {
    fontSize: 15,
    color: C.text,
    marginTop: 6,
  },

  // Team
  teamSection: {
    width: "100%",
    maxWidth: 1200,
    paddingHorizontal: 22,
    marginTop: 10,
  },
  teamIntro: {
    fontSize: 15,
    lineHeight: 17,
    color: C.text,
    textAlign: "center",
    marginBottom: 22,
  },
  teamGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  teamMember: {
    flex: 1,
    maxWidth: 230,
    alignItems: "center",
    minWidth: 0,
  },
  teamImage: {
    width: "75%",
    height: 130,
    borderRadius: 11,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
    marginTop: 11,
    textAlign: "center",
  },
  teamRole: {
    fontSize: 15,
    color: C.text,
    marginTop: 9,
    marginBottom: 18,
    textAlign: "center",
  },

  // Footer
  footer: {
    width: "100%",
    paddingHorizontal: 25,
    paddingTop: 28,
    paddingBottom: 12,
  },
  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 58,
  },
  footerLogo: {
    width: 38,
    height: 38,
    borderRadius: 20,
  },
  footerBrandName: {
    fontSize: 25,
    fontWeight: "800",
    color: C.text,
  },
  copyright: {
    fontSize: 15,
    color: C.text,
  },
  footerGroups: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 18,
  },
  footerGroup: {
    flex: 1,
    minWidth: 95,
  },
  footerHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 15,
    color: "#66758F",
    marginBottom: 13,
  },
  socials: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 20,
    marginBottom: 45,
  },
  appDownload: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  appDownloadMobile: {
    flexDirection: "column",
  },
  appDownloadText: {
    fontSize: 15,
    color: C.text,
    textAlign: "center",
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  storeSmall: {
    fontSize: 9,
    color: C.text,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
  },
});
