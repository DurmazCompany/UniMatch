import { router } from "expo-router";

/**
 * Detect if an error from `api.*` represents a paywall trigger.
 * The backend returns 402 with code like *_INSUFFICIENT, *_QUOTA_EXCEEDED,
 * PREMIUM_REQUIRED, or LIMIT_REACHED. The api.ts client preserves
 * `status`, `code`, and `data` on the thrown Error.
 */
export function isPaywallError(err: unknown): boolean {
  if (!err) return false;
  const e = err as any;
  const status: number | undefined = e?.status ?? e?.response?.status;
  const code: string | undefined =
    e?.code ?? e?.data?.error?.code ?? e?.response?.data?.error?.code;
  if (status === 402) return true;
  if (typeof code === "string") {
    if (
      code.endsWith("_INSUFFICIENT") ||
      code.endsWith("_QUOTA_EXCEEDED") ||
      code === "PREMIUM_REQUIRED" ||
      code === "LIMIT_REACHED"
    ) {
      return true;
    }
  }
  // Fallback: legacy Error("API Error: 402")
  const msg = e?.message;
  if (typeof msg === "string" && msg.includes("402")) return true;
  return false;
}

/**
 * If the error is a paywall trigger, push the paywall route and return true.
 * Otherwise return false so the caller can show a generic error.
 */
export function openPaywallOnError(err: unknown): boolean {
  if (isPaywallError(err)) {
    router.push("/paywall");
    return true;
  }
  return false;
}
