# UniMatch Admin Panel

Local-only admin panel for managing users, ambassadors, and events.

## Setup

```bash
cd admin-panel
cp .env.local.example .env.local
# Edit .env.local with real DATABASE_URL and admin credentials
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3001 — basic auth required.

## Auth

This MVP uses HTTP Basic Auth with credentials from env (`ADMIN_USERNAME`,
`ADMIN_PASSWORD`). Production deployment should migrate to Better Auth
integration with the `role === "admin"` check.

The hardcoded `ADMIN_ID = "admin-system"` in `lib/auth.ts` is used as the
recorded admin in `AdminAction` rows. Replace with the actual admin profile id
once Better Auth integration lands. A profile with id `admin-system` should
exist in the DB (or change `ADMIN_ID` to a real admin profile id) so foreign
key constraints in `AdminAction` succeed.

## Schema sync

Prisma schema is copied from `backend/prisma/schema.prisma`. After backend
schema changes, re-copy:

```bash
cp backend/prisma/schema.prisma admin-panel/prisma/schema.prisma
cd admin-panel && npx prisma generate
```

## Pages

- `/dashboard` — key counts (users, premium, ambassadors, recent activity)
- `/users` — search/filter table; `/users/[id]` for ban / premium / role actions
- `/ambassadors` — application queue with approve/reject
- `/events` — moderation table with soft-delete (deactivate)
- `/audit-log` — timeline of all admin actions
