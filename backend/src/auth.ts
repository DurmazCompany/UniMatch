import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { env } from "./env";

// Helper function to validate university email (.edu domain)
function isUniversityEmail(email: string): boolean {
  const emailLower = email.toLowerCase();
  // Check for .edu domain (international) or .edu.tr domain (Turkish universities)
  return emailLower.includes('.edu');
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,
  trustedOrigins: [
    "vibecode://*/*",
    "exp://*/*",
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
    "https://*.vibecode.dev",
    "https://vibecode.dev",
  ],
  // Enable email + password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production to require email verification
    // Validate that the email is a university email
    async sendResetPassword({ user, url }) {
      // Send password reset email
      const response = await fetch("https://smtp.vibecodeapp.com/v1/send/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          code: url,
          fromName: "CampusMatch",
          lang: "tr",
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || `Failed to send reset email (HTTP ${response.status})`);
      }
    },
  },
  plugins: [
    expo(),
  ],
  // Custom user validation to ensure university email
  user: {
    additionalFields: {},
    async beforeCreate({ email }: { email: string }) {
      if (!isUniversityEmail(email)) {
        throw new Error("Sadece üniversite e-posta adresleri (.edu) kabul edilmektedir.");
      }
    },
  },
  advanced: {
    trustedProxyHeaders: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
});
