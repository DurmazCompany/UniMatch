import Purchases, { PurchasesPackage, CustomerInfo } from "react-native-purchases";
import { Platform } from "react-native";

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_VIBECODE_REVENUECAT_APPLE_KEY || process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "",
  android: process.env.EXPO_PUBLIC_VIBECODE_REVENUECAT_GOOGLE_KEY || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "",
}) || "";

export async function initRevenueCat(userId?: string) {
  if (!API_KEY) {
    console.warn("RevenueCat API key not configured");
    return;
  }

  await Purchases.configure({ apiKey: API_KEY });

  if (userId) {
    await Purchases.logIn(userId);
  }
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages || [];
  } catch (e) {
    console.error("Failed to get offerings:", e);
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (e.userCancelled) return null;
    throw e;
  }
}

export async function purchasePackageById(storeId: string) {
  const packages = await getOfferings();
  const pkg = packages.find((p) => p.product.identifier === storeId);
  if (!pkg) throw new Error(`Package not found: ${storeId}`);
  return purchasePackage(pkg);
}

export async function identify(userId: string) {
  if (!API_KEY) return;
  await Purchases.logIn(userId);
}

export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active["premium"] !== undefined;
  } catch (e) {
    return false;
  }
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active["premium"] !== undefined;
}

export { PurchasesPackage, CustomerInfo };
