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

// 建立或更新公開分享（同一用戶 + 同一週期只有一個連結）
sharesRouter.post("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		data: {
			period: "week" | "4weeks";
			range: { start: string; end: string };
			[key: string]: unknown;
		};
	}>();

	if (!body.data || !body.data.period || !body.data.range) {
		return c.json({ error: "Missing data" }, 400);
	}

	const { period, range } = body.data;
	const db = drizzle(c.env.DB);
	const now = new Date();
	const frontendUrl = c.env.FRONTEND_URL || "https://my-12-week-year.pages.dev";

	// 查詢是否已有相同用戶 + 週期 + 日期範圍的分享
	const existing = await db
		.select()
		.from(publicShares)
		.where(
			and(
				eq(publicShares.userId, user.id),
				eq(publicShares.period, period),
				eq(publicShares.startDate, range.start),
				eq(publicShares.endDate, range.end),
			),
		)
		.get();

	if (existing) {
		// 更新現有分享
		await db
			.update(publicShares)
			.set({
				data: JSON.stringify(body.data),
				updatedAt: now,
			})
			.where(eq(publicShares.id, existing.id));

		return c.json({
			id: existing.id,
			url: `${frontendUrl}/share/${existing.id}`,
			createdAt: existing.createdAt.toISOString(),
			updatedAt: now.toISOString(),
			isUpdate: true,
		});
	}

	// 建立新分享
	const id = generateShareId();

	await db.insert(publicShares).values({
		id,
		userId: user.id,
		period,
		startDate: range.start,
		endDate: range.end,
		data: JSON.stringify(body.data),
		createdAt: now,
		updatedAt: now,
	});

	return c.json(
		{
			id,
			url: `${frontendUrl}/share/${id}`,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
			isUpdate: false,
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
