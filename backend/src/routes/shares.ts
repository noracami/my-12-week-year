import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { publicShares } from "../db/schema";
import type { Env } from "../lib/auth";
import { generateShareId } from "../lib/id";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const sharesRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 建立公開分享
sharesRouter.post("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		data: unknown;
	}>();

	if (!body.data) {
		return c.json({ error: "Missing data" }, 400);
	}

	const db = drizzle(c.env.DB);
	const id = generateShareId();
	const now = new Date();

	await db.insert(publicShares).values({
		id,
		userId: user.id,
		data: JSON.stringify(body.data),
		createdAt: now,
	});

	const frontendUrl = c.env.FRONTEND_URL || "https://my-12-week-year.pages.dev";

	return c.json(
		{
			id,
			url: `${frontendUrl}/share/${id}`,
			createdAt: now.toISOString(),
		},
		201,
	);
});

// 取得公開分享（無需驗證）
sharesRouter.get("/:id", async (c) => {
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);

	const share = await db
		.select()
		.from(publicShares)
		.where(eq(publicShares.id, id))
		.get();

	if (!share) {
		return c.json({ error: "Share not found" }, 404);
	}

	return c.json({
		id: share.id,
		data: JSON.parse(share.data),
		createdAt: share.createdAt.toISOString(),
		isPublic: true,
	});
});

export default sharesRouter;
