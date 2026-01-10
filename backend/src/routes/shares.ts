import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { publicShares, shareReactions } from "../db/schema";
import type { Env } from "../lib/auth";
import { generateShareId } from "../lib/id";

const ALLOWED_EMOJIS = ["👍", "❤️", "🔥", "👏", "💪", "🎉"];

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

// 取得分享的表情回應
sharesRouter.get("/:id/reactions", async (c) => {
	const shareId = c.req.param("id");
	const user = c.get("user");
	const db = drizzle(c.env.DB);

	// 確認分享存在
	const share = await db
		.select()
		.from(publicShares)
		.where(eq(publicShares.id, shareId))
		.get();

	if (!share) {
		return c.json({ error: "Share not found" }, 404);
	}

	// 取得所有 reactions 的統計
	const reactionCounts = await db
		.select({
			emoji: shareReactions.emoji,
			count: sql<number>`count(*)`.as("count"),
		})
		.from(shareReactions)
		.where(eq(shareReactions.shareId, shareId))
		.groupBy(shareReactions.emoji)
		.all();

	// 取得當前用戶的 reactions（如果已登入）
	let userReactions: string[] = [];
	if (user) {
		const userReactionRows = await db
			.select({ emoji: shareReactions.emoji })
			.from(shareReactions)
			.where(
				and(
					eq(shareReactions.shareId, shareId),
					eq(shareReactions.userId, user.id),
				),
			)
			.all();
		userReactions = userReactionRows.map((r) => r.emoji);
	}

	// 組合結果
	const reactions: Record<string, { count: number; reacted: boolean }> = {};
	for (const emoji of ALLOWED_EMOJIS) {
		const found = reactionCounts.find((r) => r.emoji === emoji);
		reactions[emoji] = {
			count: found?.count ?? 0,
			reacted: userReactions.includes(emoji),
		};
	}

	return c.json({ reactions });
});

// 新增表情回應
sharesRouter.post("/:id/reactions", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const shareId = c.req.param("id");
	const body = await c.req.json<{ emoji: string }>();

	if (!body.emoji || !ALLOWED_EMOJIS.includes(body.emoji)) {
		return c.json({ error: "Invalid emoji" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 確認分享存在
	const share = await db
		.select()
		.from(publicShares)
		.where(eq(publicShares.id, shareId))
		.get();

	if (!share) {
		return c.json({ error: "Share not found" }, 404);
	}

	// 新增 reaction（如果已存在會因為 unique index 失敗）
	try {
		await db.insert(shareReactions).values({
			id: generateShareId(),
			shareId,
			userId: user.id,
			emoji: body.emoji,
			createdAt: new Date(),
		});
		return c.json({ success: true }, 201);
	} catch {
		// 已存在，忽略錯誤
		return c.json({ success: true });
	}
});

// 移除表情回應
sharesRouter.delete("/:id/reactions/:emoji", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const shareId = c.req.param("id");
	const emoji = decodeURIComponent(c.req.param("emoji"));

	if (!ALLOWED_EMOJIS.includes(emoji)) {
		return c.json({ error: "Invalid emoji" }, 400);
	}

	const db = drizzle(c.env.DB);

	await db
		.delete(shareReactions)
		.where(
			and(
				eq(shareReactions.shareId, shareId),
				eq(shareReactions.userId, user.id),
				eq(shareReactions.emoji, emoji),
			),
		);

	return c.json({ success: true });
});

export default sharesRouter;
