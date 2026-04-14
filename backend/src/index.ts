import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "./env";
import { auth } from "./auth";
import { sampleRouter } from "./routes/sample";
import { universitiesRouter } from "./routes/universities";
import { profilesRouter } from "./routes/profiles";
import { discoverRouter } from "./routes/discover";
import { swipesRouter } from "./routes/swipes";
import { matchesRouter } from "./routes/matches";
import { campusRouter } from "./routes/campus";
import { uploadsRouter } from "./routes/uploads";
import { webhooksRouter } from "./routes/webhooks";
import { seedRouter } from "./routes/seed";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS middleware
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
];

app.use("*", cors({
  origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
  credentials: true,
}));

app.use("*", logger());

// Auth middleware
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Auth routes
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// App routes
app.route("/api/sample", sampleRouter);
app.route("/api/universities", universitiesRouter);
app.route("/api/profile", profilesRouter);
app.route("/api/discover", discoverRouter);
app.route("/api/swipe", swipesRouter);
app.route("/api/matches", matchesRouter);
app.route("/api/campus", campusRouter);
app.route("/api/uploads", uploadsRouter);
app.route("/api/webhooks", webhooksRouter);
app.route("/api/seed", seedRouter);

const port = Number(process.env.PORT) || 3000;

export default { port, fetch: app.fetch };
