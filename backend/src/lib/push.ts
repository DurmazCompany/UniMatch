import { Expo } from "expo-server-sdk";
import type { ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!Expo.isExpoPushToken(token)) {
    console.log(`Push token ${token} is not a valid Expo push token`);
    return;
  }

  const message: ExpoPushMessage = {
    to: token,
    sound: "default",
    title,
    body,
    data: data ?? {},
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];

    if (ticket && ticket.status === "error") {
      console.error(`Error sending push notification: ${ticket.message}`);
      if (ticket.details?.error) {
        console.error(`Error code: ${ticket.details.error}`);
      }
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}

// Send notification to multiple tokens
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    return;
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title,
    body,
    data: data ?? {},
  }));

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.error("Failed to send push notifications:", error);
  }
}
