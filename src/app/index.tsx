

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  StatusBar,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const COLORS = {
  background: "#100B24",
  violet: "#6D28D9",
  lavender: "#C4B5FD",
  gold: "#F4D28A",
  cyan: "#37D9FF",
  white: "#FFFFFF",
  muted: "#D8D1ED",
};

const stationery = [
  { emoji: "✏️", left: "8%", top: "15%", size: 29, delay: 0 },
  { emoji: "📒", left: "78%", top: "13%", size: 34, delay: 300 },
  { emoji: "🖊️", left: "13%", top: "39%", size: 27, delay: 600 },
  { emoji: "📐", left: "82%", top: "38%", size: 31, delay: 900 },
  { emoji: "🖍️", left: "7%", top: "65%", size: 30, delay: 400 },
  { emoji: "📓", left: "81%", top: "67%", size: 32, delay: 700 },
  { emoji: "✂️", left: "24%", top: "79%", size: 25, delay: 200 },
  { emoji: "📝", left: "70%", top: "81%", size: 29, delay: 500 },
];

export default function SplashScreen() {
  const { width, height } = useWindowDimensions();

  const logoScale = useRef(new Animated.Value(0.65)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.45)).current;

  const floatValues = useRef(
    stationery.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const entranceAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          speed: 1.2,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start();

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.9,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    glowAnimation.start();

    const floatAnimations = floatValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(stationery[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1800 + index * 120,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 1800 + index * 120,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    floatAnimations.forEach((animation) => animation.start());

    return () => {
      entranceAnimation.stop();
      glowAnimation.stop();
      floatAnimations.forEach((animation) => animation.stop());
    };
  }, [
    buttonOpacity,
    floatValues,
    glowPulse,
    logoOpacity,
    logoScale,
    textOpacity,
  ]);

  const handleDiscover = () => {
    router.replace("/home");
  };

  return (
    <View style={styles.screen}>
      <StatusBar
       barStyle="light-content"
         />

      {/* Background gradient - single layer */}
      <LinearGradient
        colors={["#100B24", "#211044", "#100B24"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      {/* Ambient glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: glowPulse,
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: width * 0.4,
            top: height * 0.12,
            left: width * 0.1,
          },
        ]}
      />

      <View style={styles.auroraTop} pointerEvents="none" />
      <View style={styles.auroraBottom} pointerEvents="none" />

      {/* Floating stationery */}
      {stationery.map((item, index) => {
        const translateY = floatValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -14],
        });

        return (
          <Animated.Text
            key={`${item.emoji}-${index}`}
            pointerEvents="none"
            style={[
              styles.floatingItem,
              {
                left: item.left as `${number}%`,
                top: item.top as `${number}%`,
                fontSize: item.size,
                opacity: 0.72,
                transform: [{ translateY }],
              },
            ]}
          >
            {item.emoji}
          </Animated.Text>
        );
      })}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoOuter}>
            <LinearGradient
              colors={["#8B5CF6", "#6D28D9", "#32136A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoInner}
            >
              <Text style={styles.logoLetter}>S</Text>
              <Text style={styles.logoSparkle}>✦</Text>
            </LinearGradient>
          </View>

          <View style={styles.logoUnderline} />
        </Animated.View>

        {/* Brand and tagline */}
        <Animated.View
          style={[styles.brandSection, { opacity: textOpacity }]}
        >
          <Text style={styles.brandName}>SUPPLYHIVE</Text>

          <Text style={styles.brandByline}>BY VETRI TECHNOLOGY</Text>

          <View style={styles.goldDivider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDiamond} />
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.tagline}>
            Every Idea Begins Here.
          </Text>

          <Text style={styles.description}>
            Your world of stationery,{"\n"}art & creativity.
          </Text>
        </Animated.View>

        {/* Discover button */}
        <Animated.View
          style={[
            styles.buttonSection,
            { opacity: buttonOpacity },
          ]}
        >
          <Pressable
            onPress={handleDiscover}
            style={({ pressed }) => [
              styles.buttonWrapper,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Discover Supplyhive"
          >
            <LinearGradient
              colors={["#8B5CF6", "#6D28D9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                Discover Your Creativity
              </Text>
              <Text style={styles.buttonArrow}>→</Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.footerText}>
            CREATE  •  IMAGINE  •  INSPIRE
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#100B24",
    overflow: "hidden",
  },

  background: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  content: {
    flexGrow: 1,
    minHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 65,
    paddingBottom: 36,
  },

  glow: {
    position: "absolute",
    backgroundColor: "#6D28D9",
  },

  auroraTop: {
    position: "absolute",
    width: 240,
    height: 100,
    top: 20,
    left: -70,
    backgroundColor: "#37D9FF",
    opacity: 0.07,
    borderRadius: 100,
    transform: [{ rotate: "-30deg" }],
  },

  auroraBottom: {
    position: "absolute",
    width: 250,
    height: 110,
    bottom: 15,
    right: -90,
    backgroundColor: "#8B5CF6",
    opacity: 0.13,
    borderRadius: 100,
    transform: [{ rotate: "-30deg" }],
  },

  floatingItem: {
    position: "absolute",
    zIndex: 1,
  },

  logoSection: {
    alignItems: "center",
    marginBottom: 28,
    zIndex: 2,
  },

  logoOuter: {
    width: 138,
    height: 138,
    padding: 4,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#C4B5FD",
    backgroundColor: "rgba(196,181,253,0.10)",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 25,
    elevation: 15,
  },

  logoInner: {
    flex: 1,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  logoLetter: {
    color: "#FFFFFF",
    fontSize: 86,
    fontWeight: "800",
    lineHeight: 100,
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  logoSparkle: {
    position: "absolute",
    top: 17,
    right: 20,
    color: "#F4D28A",
    fontSize: 25,
  },

  logoUnderline: {
    width: 48,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#F4D28A",
    marginTop: 15,
  },

  brandSection: {
    alignItems: "center",
    zIndex: 2,
  },

  brandName: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 5,
    textAlign: "center",
  },

  brandByline: {
    color: COLORS.lavender,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    marginTop: 9,
  },

  goldDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    marginBottom: 22,
    gap: 10,
  },

  dividerLine: {
    width: 42,
    height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.8,
  },

  dividerDiamond: {
    width: 7,
    height: 7,
    backgroundColor: COLORS.gold,
    transform: [{ rotate: "45deg" }],
  },

  tagline: {
    color: COLORS.gold,
    fontSize: 21,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  description: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 25,
    textAlign: "center",
    marginTop: 13,
  },

  buttonSection: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    marginTop: 42,
    zIndex: 2,
  },

  buttonWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },

  button: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  buttonArrow: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "600",
  },

  footerText: {
    color: "#A79BCB",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: 25,
    textAlign: "center",
  },
});
