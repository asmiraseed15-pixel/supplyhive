
import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CommonFooter from "../components/CommonFooter";

const C = {
  bg: "#FFFFFF",
  text: "#101828",
  muted: "#263B59",
  blue: "#097AFA",
  white: "#FFFFFF",
};

const A = {
  hero: require("../../assets/baggy.png"),
  trending: require("../../assets/trending6.png"),
  notepad: require("../../assets/notepen.png"),
  book: require("../../assets/book.png"),
  sketch: require("../../assets/sketch.png"),
  pen: require("../../assets/pen.png"),
  bag1: require("../../assets/baggy1.png"),
  bag2: require("../../assets/baggy2.png"),
  penNotepad: require("../../assets/pen-notepad.png"),
  yellow: require("../../assets/yellow.png"),
  stapler: require("../../assets/stapler.png"),
  team1: require("../../assets/pro1.png"),
  team2: require("../../assets/pro2.png"),
  team3: require("../../assets/pro3.png"),
};

export default function AboutUs() {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const horizontalPadding = compact ? 20 : 36;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle="dark-content"
        />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View
          style={[
            styles.heroSection,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <Image
  source={A.hero}
  style={styles.heroImage}
  resizeMode="contain"
/>

          <Text style={styles.heroTitle}>
            "Smart Supplies for Bright Futures."
          </Text>

          <Text style={styles.heroDescription}>
            We provide quality stationery and school supplies
            to support learning, creativity, and organization.
            From classrooms to home desks, we're here to help
            students and educators stay prepared and inspired.
          </Text>
        </View>

        {/* FEATURED IMAGES */}
        <View
          style={[
            styles.featureRow,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <Image
            source={A.trending}
            style={styles.featureImage}
            resizeMode="contain"
          />

          <Image
            source={A.notepad}
            style={styles.featureImage}
            resizeMode="contain"
          />

          <Image
            source={A.book}
            style={styles.featureImage}
            resizeMode="contain"
          />
        </View>

        {/* PEN AND PENCIL */}
        <View
          style={[
            styles.section,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <Text style={styles.sectionTitle}>
            PEN & PENCIL
          </Text>

          <Text style={styles.sectionDescription}>
            At Supplyhive, we believe a great pen is more than
            just a writing tool—it's an expression of thought,
            precision, and personality. From smooth everyday
            ballpoints to elegant signature pens, we offer
            reliable writing instruments designed for comfort,
            style, and performance.
          </Text>

          <View style={styles.twoImages}>
            <Image
              source={A.pen}
              style={styles.penImage}
              resizeMode="contain"
            />

            <Image
              source={A.sketch}
              style={styles.penImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* BAGS */}
        <View
          style={[
            styles.section,
            styles.bagSection,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <Text style={styles.sectionTitle}>
            BAGS
          </Text>

          <View style={styles.twoImages}>
            <Image
              source={A.bag1}
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

        {/* ALL STATIONERY */}
        <View
          style={[
            styles.section,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <Text style={styles.sectionTitle}>
            ALL STATIONERY
          </Text>

          <Text style={styles.sectionDescription}>
            We offer a wide range of stationery essentials,
            from notebooks, folders, and sticky notes to
            markers, staplers, and rulers. Each item is chosen
            for quality, functionality, and style—perfect for
            school, office, or creative use.
          </Text>

          <View style={styles.stationeryGrid}>
            {/* LEFT IMAGE */}
            <View style={styles.stationeryLeft}>
              <Image
                source={A.penNotepad}
                style={styles.stationeryLeftImage}
                resizeMode="contain"
              />
            </View>

            {/* RIGHT IMAGES */}
            <View style={styles.stationeryRight}>
              <Image
                source={A.yellow}
                style={styles.stationeryRightImage}
                resizeMode="contain"
              />

              <Image
                source={A.stapler}
                style={styles.stationeryRightImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* TEAM */}
        <View
          style={[
            styles.teamSection,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <Text style={styles.teamTitle}>
            The Team
          </Text>

          <Text style={styles.teamDescription}>
            Our team is a dedicated group of professionals
            passionate about delivering quality stationery
            in bulk with efficiency and care. With expertise
            in sourcing, logistics, and customer service, we
            ensure every order meets the highest standards.
          </Text>

          <View style={styles.teamRow}>
            {[
              {
                image: A.team1,
                name: "Seth Rollins",
                role: "Shop Owner",
              },
              {
                image: A.team2,
                name: "Seth Rollins",
                role: "Manager",
              },
              {
                image: A.team3,
                name: "Seth Rollins",
                role: "Shop Keeper",
              },
            ].map((member, index) => (
              <View
                key={`${member.role}-${index}`}
                style={styles.teamCard}
              >
                <Image
                  source={member.image}
                  style={styles.teamImage}
                  resizeMode="cover"
                />

                <Text style={styles.teamName}>
                  {member.name}
                </Text>

                <Text style={styles.teamRole}>
                  {member.role}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* COMMON FOOTER */}
        <CommonFooter />
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

  content: {
    paddingBottom: 0,
    backgroundColor: C.bg,
  },

  heroSection: {
    paddingTop: 12,
    backgroundColor: C.bg,
  },

  heroImage: {
  width: "100%",
  height: 350,
  borderRadius: 10,
  backgroundColor: C.white,
},

  heroTitle: {
    marginTop: 18,
    textAlign: "center",
    color: C.text,
    fontSize: 25,
    fontWeight: "500",
    fontFamily: "Roboto",
  },

  heroDescription: {
    marginTop: 12,
    marginBottom: 18,
    textAlign: "center",
    color: C.muted,
    fontSize: 20,
    lineHeight: 18,
    maxWidth: 850,
    alignSelf: "center",
  },

  featureRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
    backgroundColor: C.bg,
  },

  featureImage: {
    flex: 1,
    height: 300,
    borderRadius: 10,
    backgroundColor: C.bg,
  },

  section: {
    marginTop: 4,
    marginBottom: 14,
    backgroundColor: C.bg,
  },

  sectionTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: C.text,
    marginBottom: 10,
  },

  sectionDescription: {
    fontSize: 20,
    lineHeight: 18,
    color: C.muted,
    marginBottom: 12,
  },

  twoImages: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 50,
  },

  penImage: {
    flex: 1,
    height: 200,
    borderRadius: 10,
  },

  bagSection: {
    marginTop: 0,
    marginBottom: 18,
  },

  bagImage: {
    flex: 1,
    height: 300,
  },

  stationeryGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 8,
  },

  stationeryLeft: {
    width: "49%",
    justifyContent: "center",
  },

  stationeryLeftImage: {
    width: "100%",
    height: 400,
  },

  stationeryRight: {
    width: "49%",
    justifyContent: "space-between",
    gap: 6,
  },

  stationeryRightImage: {
    width: "100%",
    height: 200,
  },

  teamSection: {
    marginTop: 4,
    marginBottom: 18,
    backgroundColor: C.bg,
  },

  teamTitle: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: "800",
    color: C.text,
    marginBottom: 12,
  },

  teamDescription: {
    textAlign: "center",
    color: C.muted,
    fontSize: 20,
    lineHeight: 18,
    marginBottom: 18,
  },

  teamRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
  },

  teamCard: {
    flex: 1,
    maxWidth: 400,
    alignItems: "center",
  },

  teamImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    backgroundColor: C.white,
  },

  teamName: {
    marginTop: 10,
    fontSize: 25,
    fontWeight: "800",
    color: C.text,
    textAlign: "center",
  },

  teamRole: {
    fontSize: 20,
    color: C.muted,
    marginTop: 5,
    textAlign: "center",
  },
});