import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Alert, Platform } from "react-native";
import type { QueryClient } from "@tanstack/react-query";
import { api } from "./api/api";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const behavior: Notifications.NotificationBehavior = {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
    return behavior;
  },
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data;

    // Send token to backend
    await api.post("/api/profile/push-token", { token });

    // Configure Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF69B4",
      });
    }

    return token;
  } catch (error) {
    console.error("Failed to get push token:", error);
    return null;
  }
}

export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Clear badge count
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// Handle admin-triggered notifications: invalidate React Query caches and
// surface UX where appropriate (e.g. ban alert).
export function handleAdminNotification(
  data: any,
  queryClient: QueryClient,
): void {
  const type = data?.type;
  if (!type) return;

  switch (type) {
    case "banned":
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      Alert.alert(
        "Hesap askıya alındı",
        data?.body ||
          "Hesabın askıya alındı. Detaylar için destek ile iletişime geç.",
        [{ text: "Tamam" }],
      );
      break;
    case "unbanned":
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      break;
    case "premium_granted":
    case "premium_revoked":
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      break;
    case "ambassador_approved":
    case "ambassador_rejected":
      queryClient.invalidateQueries({ queryKey: ["ambassador-me"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      break;
    case "role_changed":
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      break;
    case "event_deleted":
      queryClient.invalidateQueries({ queryKey: ["events"] });
      break;
    default:
      break;
  }
}
