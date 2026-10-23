
import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Linking,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const logo = require("../../assets/logo.png");

const footerGroups = [
  {
    title: "Company",
    links: [
      { label: "About us", route: "/about" },
      { label: "Supplyhive corporate", route: "/about" },
      { label: "Careers", route: "/about" },
      { label: "Team", route: "/about" },
    ],
  },
  {
    title: "Contact us",
    links: [
      { label: "Help & Support", route: "/contact" },
      { label: "Partner with us", route: "/contact" },
      { label: "Ride with us", route: "/contact" },
    ],
  },
  {
    title: "Available in",
    links: [
      { label: "Coimbatore", route: "/shop" },
      { label: "Bengaluru", route: "/shop" },
      { label: "Chennai", route: "/shop" },
      { label: "Kolkata", route: "/shop" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", route: "/terms" },
      { label: "Cookie policy", route: "/privacy" },
      { label: "Privacy Policy", route: "/privacy" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "Location", route: "/contact" },
      { label: "Email", route: "/contact" },
      { label: "Social Media", route: "/contact" },
    ],
  },
];

export default function Footer() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const openExternal = (url: string) => {
    Linking.openURL(url).catch((error) => {
      console.warn("Unable to open link:", error);
    });
  };

  return (
    <View style={styles.footer}>
      <Pressable
        style={styles.brand}
        onPress={() => router.push("/" as any)}
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />

        <View>
          <Text style={styles.brandName}>Supplyhive</Text>
          <Text style={styles.copyright}>
            © 2026 Supplyhive Limited
          </Text>
        </View>
      </Pressable>

      <View style={styles.groups}>
        {footerGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.heading}>{group.title}</Text>

            {group.links.map((link) => (
              <Pressable
                key={link.label}
                onPress={() => router.push(link.route as any)}
                style={styles.linkButton}
              >
                <Text style={styles.link}>{link.label}</Text>
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
          <Ionicons name="logo-instagram" size={22} color="#E4405F" />
        </Pressable>

        <Pressable
          onPress={() =>
            openExternal("https://www.facebook.com/")
          }
          accessibilityLabel="Facebook"
        >
          <Ionicons name="logo-facebook" size={22} color="#1877F2" />
        </Pressable>

        <Pressable
          onPress={() =>
            openExternal("https://www.whatsapp.com/")
          }
          accessibilityLabel="WhatsApp"
        >
          <Ionicons name="logo-whatsapp" size={22} color="#20C763" />
        </Pressable>
      </View>

      <View
        style={[
          styles.download,
          isMobile && styles.downloadMobile,
        ]}
      >
        <Text style={styles.downloadText}>
          For better experience, download the app now
        </Text>

        <Pressable
          style={styles.storeButton}
          onPress={() =>
            openExternal("https://play.google.com/store")
          }
        >
          <Ionicons name="logo-google" size={23} color="#20A464" />
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
          <Ionicons name="logo-apple" size={23} color="#111111" />
          <View>
            <Text style={styles.storeSmall}>Download on the</Text>
            <Text style={styles.storeTitle}>App Store</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 25,
    paddingTop: 32,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#D5DFF0",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 36,
  },
  logo: {
    width: 42,
    height: 42,
  },
  brandName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#080A10",
  },
  copyright: {
    fontSize: 13,
    color: "#66758F",
    marginTop: 4,
  },
  groups: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 24,
  },
  group: {
    flexGrow: 1,
    flexBasis: 130,
    minWidth: 100,
  },
  heading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#080A10",
    marginBottom: 14,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: 5,
  },
  link: {
    fontSize: 14,
    color: "#66758F",
  },
  socials: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 18,
    marginTop: 28,
    marginBottom: 28,
  },
  download: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  downloadMobile: {
    flexDirection: "column",
  },
  downloadText: {
    fontSize: 14,
    color: "#080A10",
    textAlign: "center",
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  storeSmall: {
    fontSize: 10,
    color: "#080A10",
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#080A10",
  },
});
