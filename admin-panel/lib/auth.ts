// MVP: ADMIN_ID is read from env. Set this to a real admin profile id (run
// `bun run scripts/promote-admin.ts <email>` in backend/ to create one).
// Falls back to a placeholder for dev — DB writes will fail until a real id is set.

export function getAdminId(): string {
  const id = process.env.ADMIN_PROFILE_ID;
  if (!id) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_PROFILE_ID env var is required in production");
    }
    console.warn("[admin-panel] ADMIN_PROFILE_ID not set — admin actions will fail FK");
    return "admin-system";
  }
  return id;
}

export const ADMIN_ID = getAdminId();
