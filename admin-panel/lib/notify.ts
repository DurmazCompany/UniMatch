type NotifyType =
  | "banned"
  | "unbanned"
  | "premium_granted"
  | "premium_revoked"
  | "ambassador_approved"
  | "ambassador_rejected"
  | "role_changed"
  | "event_deleted"
  | "generic";

interface NotifyParams {
  userId: string;
  type: NotifyType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function notifyUser(params: NotifyParams): Promise<void> {
  const backendUrl = process.env.BACKEND_URL;
  const secret = process.env.ADMIN_PANEL_SECRET;
  if (!backendUrl || !secret) {
    console.warn(
      "[notify] BACKEND_URL or ADMIN_PANEL_SECRET not configured — skipping push",
    );
    return;
  }
  try {
    const res = await fetch(`${backendUrl}/api/admin/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[notify] Push send failed (${res.status}): ${text}`);
    }
  } catch (err) {
    console.error("[notify] Push send error:", err);
  }
}
