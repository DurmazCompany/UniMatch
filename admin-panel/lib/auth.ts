// MVP placeholder. Real auth check is enforced in middleware.ts via HTTP Basic.
// Future: integrate Better Auth and check profile.role === "admin".

export const ADMIN_ID = "admin-system";

export function getAdminId(): string {
  return ADMIN_ID;
}
