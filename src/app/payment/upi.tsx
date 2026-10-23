
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type PaymentMethod = "gpay" | "phonepe" | "supplyhive";

type CartItem = {
  id?: number | string;
  name?: string;
  title?: string;
  price?: number | string;
  quantity?: number | string;
};

const ADDRESS_KEY = "supplyhive_delivery_address";
const CART_KEY = "supplyhive_checkout_items";

export default function UpiPaymentScreen() {
  const router = useRouter();

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod | null>(null);
  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        const storedItems = await AsyncStorage.getItem(CART_KEY);

        if (storedItems) {
          const parsed = JSON.parse(storedItems);

          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch (error) {
        console.log("Unable to load checkout items:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, []);

  const totalAmount = useMemo(
    () =>
      items.reduce((total, item) => {
        const price = Number(item.price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return total + price * quantity;
      }, 0),
    [items]
  );

  const methodLabel =
    selectedMethod === "gpay"
      ? "Google Pay"
      : selectedMethod === "phonepe"
        ? "PhonePe"
        : "SupplyHive UPI";

  // Reject ordinary email addresses and check the UPI ID format.
  const validateUpiId = (value: string): string => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Please enter your UPI ID.";
    }

    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailPattern.test(trimmed)) {
      return "Email ID is not allowed. Enter your UPI ID.";
    }

    const upiPattern =
      /^[a-zA-Z0-9._-]{2,100}@[a-zA-Z][a-zA-Z0-9.-]{1,50}$/;

    if (!upiPattern.test(trimmed)) {
      return "Invalid UPI ID. Example: 9876543210@ybl";
    }

    return "";
  };

  const handlePayNow = async () => {
    if (!selectedMethod) {
      Alert.alert("Select Payment", "Please select a payment option.");
      return;
    }

    if (items.length === 0) {
      Alert.alert(
        "Cart Empty",
        "Checkout items could not be found. Please return to checkout and try again."
      );
      return;
    }

    const validationMessage = validateUpiId(upiId);

    if (validationMessage) {
      setUpiError(validationMessage);
      return;
    }

    setUpiError("");

    try {
      const address = await AsyncStorage.getItem(ADDRESS_KEY);

      if (!address || !address.trim()) {
        Alert.alert(
          "Delivery Address Required",
          "Please enter your delivery details before payment."
        );
        return;
      }

      setPaying(true);

      // Project demo only. This does not authenticate or charge a UPI account.
      await new Promise((resolve) => setTimeout(resolve, 900));

      router.replace({
        pathname: "/payment/success" as any,
        params: {
          amount: totalAmount.toFixed(2),
          method: methodLabel,
        },
      });
    } catch (error) {
      Alert.alert("Payment Error", "Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const renderPaymentOption = (
    method: PaymentMethod,
    title: string,
    subtitle: string
  ) => {
    const selected = selectedMethod === method;

    return (
      <Pressable
        key={method}
        style={[
          styles.paymentOption,
          selected && styles.paymentOptionSelected,
        ]}
        onPress={() => {
          setSelectedMethod(method);
          setUpiId("");
          setUpiError("");
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
      >
        <View style={styles.logoContainer}>
          {method === "gpay" ? (
            <View style={styles.googleLogo}>
              <Text style={styles.googleG}>G</Text>
            </View>
          ) : method === "phonepe" ? (
            <View style={styles.phonePeLogo}>
              <Text style={styles.phonePeSymbol}>पे</Text>
            </View>
          ) : (
            <View style={styles.supplyHiveLogo}>
              <Ionicons name="wallet" size={28} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>

        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Loading payment details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content"  />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace("/shop" as never)}
            >
              <Ionicons
                name="arrow-back"
                size={23}
                color="#172554"
              />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>UPI Payment</Text>
              <Text style={styles.headerSubtitle}>
                Choose your preferred payment option
              </Text>
            </View>
          </View>

          <View style={styles.amountCard}>
            <View style={styles.amountIcon}>
              <Ionicons
                name="shield-checkmark"
                size={27}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.amountTextContainer}>
              <Text style={styles.amountLabel}>
                Total Payable Amount
              </Text>
              <Text style={styles.amountValue}>
                ₹{totalAmount.toFixed(2)}
              </Text>
            </View>

            <Ionicons
              name="lock-closed"
              size={20}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.sectionTitle}>Choose UPI App</Text>
          <Text style={styles.sectionDescription}>
            Select an option to continue
          </Text>

          {renderPaymentOption(
            "gpay",
            "Google Pay",
            "Google Pay UPI (demo)"
          )}

          {renderPaymentOption(
            "phonepe",
            "PhonePe",
            "PhonePe UPI (demo)"
          )}

          {renderPaymentOption(
            "supplyhive",
            "SupplyHive",
            "SupplyHive UPI (demo)"
          )}

          {selectedMethod !== null && (
            <View style={styles.upiInputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons
                  name="card-outline"
                  size={21}
                  color="#2563EB"
                />
                <Text style={styles.inputLabel}>Enter UPI ID</Text>
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  upiError ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={23}
                  color={upiError ? "#DC2626" : "#64748B"}
                />

                <TextInput
                  style={styles.upiInput}
                  placeholder="example@okaxis"
                  placeholderTextColor="#94A3B8"
                  value={upiId}
                  onChangeText={(value) => {
                    setUpiId(value);
                    setUpiError("");
                  }}
                  onBlur={() => {
                    if (upiId.trim()) {
                      setUpiError(validateUpiId(upiId));
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="done"
                  maxLength={320}
                />
              </View>

              {upiError ? (
                <View style={styles.errorRow}>
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color="#DC2626"
                  />
                  <Text style={styles.upiErrorText}>{upiError}</Text>
                </View>
              ) : upiId.trim() ? (
                validateUpiId(upiId) === "" ? (
                  <View style={styles.successRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#15803D"
                    />
                    <Text style={styles.upiValidText}>
                      UPI ID format looks valid
                    </Text>
                  </View>
                ) : null
              ) : (
                <Text style={styles.inputHint}>
                  Selected: {methodLabel}
                </Text>
              )}

              <Text style={styles.securityHint}>
                Format validation only. Never enter your UPI PIN here.
              </Text>
            </View>
          )}

          <View style={styles.demoNotice}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#2563EB"
            />
            <Text style={styles.demoNoticeText}>
              Demo payment screen for project submission. No real payment
              will be processed.
            </Text>
          </View>

          <Pressable
            style={[
              styles.payButton,
              (!selectedMethod || paying) && styles.payButtonDisabled,
            ]}
            onPress={handlePayNow}
            disabled={!selectedMethod || paying}
          >
            {paying ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.payButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#FFFFFF"
                />
                <Text style={styles.payButtonText}>
                  Pay ₹{totalAmount.toFixed(2)} Now
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </>
            )}
          </Pressable>

          <View style={styles.secureFooter}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color="#64748B"
            />
            <Text style={styles.secureFooterText}>
              Demo checkout · No real payment
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 35,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172554",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  amountCard: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  amountIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#4F8DF7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  amountTextContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 13,
    color: "#DBEAFE",
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 27,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#172554",
  },
  sectionDescription: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
    marginBottom: 14,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  paymentOptionSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  googleLogo: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  googleG: {
    fontSize: 29,
    fontWeight: "800",
    color: "#4285F4",
  },
  phonePeLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#5F259F",
    alignItems: "center",
    justifyContent: "center",
  },
  phonePeSymbol: {
    fontSize: 23,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  supplyHiveLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#172554",
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  radioSelected: {
    borderColor: "#2563EB",
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#2563EB",
  },
  upiInputContainer: {
    marginTop: 8,
    marginBottom: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 11,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#172554",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  inputWrapperError: {
    borderColor: "#DC2626",
    backgroundColor: "#FFF7F7",
  },
  upiInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: "#172554",
    marginLeft: 9,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
  },
  upiErrorText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 12,
    lineHeight: 18,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  upiValidText: {
    color: "#15803D",
    fontSize: 12,
  },
  inputHint: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 9,
  },
  securityHint: {
    fontSize: 11,
    lineHeight: 17,
    color: "#64748B",
    marginTop: 12,
  },
  demoNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 13,
    marginBottom: 20,
    gap: 9,
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#1E40AF",
  },
  payButton: {
    minHeight: 55,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  payButtonDisabled: {
    opacity: 0.65,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  secureFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    gap: 7,
  },
  secureFooterText: {
    fontSize: 11,
    color: "#64748B",
  },
});
