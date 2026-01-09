import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, type Env } from "./lib/auth";
import quartersRouter from "./routes/quarters";
import recordsRouter from "./routes/records";
import tacticsRouter from "./routes/tactics";
import weekSelectionsRouter from "./routes/weekSelections";

type SessionResult = Awaited<
	ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>
>;

type Variables = {
	user: NonNullable<SessionResult>["user"] | null;
	session: NonNullable<SessionResult>["session"] | null;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS
app.use(
	"/api/*",
	cors({
		origin: (origin) => origin, // 允許所有來源（開發用）
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
		credentials: true,
	}),
);

// Auth routes
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

// Session middleware
app.use("/api/*", async (c, next) => {
	const auth = createAuth(c.env);
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	c.set("user", session?.user ?? null);
	c.set("session", session?.session ?? null);
	await next();
});

// Health check
app.get("/", (c) => {
	return c.json({ status: "ok", message: "My 12-Week Year API" });
});

// Protected route example
app.get("/api/me", (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	return c.json({ user });
});

// API routes
app.route("/api/tactics", tacticsRouter);
app.route("/api/records", recordsRouter);
app.route("/api/week-selections", weekSelectionsRouter);
app.route("/api/quarters", quartersRouter);

export default app;
