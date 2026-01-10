import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import {
	publicShares,
	shareComments,
	shareReactions,
	users,
} from "../db/schema";
import type { Env } from "../lib/auth";
import { generateShareId } from "../lib/id";

const ALLOWED_EMOJIS = ["👍", "❤️", "🔥", "👏", "💪", "🎉"];

// 匿名化動物列表
const ANONYMOUS_ANIMALS = [
	{ emoji: "🐻", name: "熊" },
	{ emoji: "🦊", name: "狐狸" },
	{ emoji: "🐰", name: "兔子" },
	{ emoji: "🐼", name: "熊貓" },
	{ emoji: "🦁", name: "獅子" },
	{ emoji: "🐨", name: "無尾熊" },
	{ emoji: "🐯", name: "老虎" },
	{ emoji: "🐮", name: "牛" },
	{ emoji: "🐷", name: "豬" },
	{ emoji: "🐸", name: "青蛙" },
];

function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

function anonymizeUserId(
	userId: string,
	shareId: string,
): { emoji: string; name: string } {
	const hash = simpleHash(`${shareId}:${userId}`);
	const index = hash % ANONYMOUS_ANIMALS.length;
	return ANONYMOUS_ANIMALS[index];
}

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

// ============ Comments API ============

// 取得留言列表（支援匿名化）
sharesRouter.get("/:id/comments", async (c) => {
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

	// 取得所有留言 with user info
	const comments = await db
		.select({
			id: shareComments.id,
			shareId: shareComments.shareId,
			userId: shareComments.userId,
			content: shareComments.content,
			createdAt: shareComments.createdAt,
			updatedAt: shareComments.updatedAt,
			userName: users.name,
			userImage: users.image,
		})
		.from(shareComments)
		.leftJoin(users, eq(shareComments.userId, users.id))
		.where(eq(shareComments.shareId, shareId))
		.orderBy(shareComments.createdAt)
		.all();

	if (user) {
		// 已登入：顯示真實身份
		return c.json({
			comments: comments.map((comment) => ({
				id: comment.id,
				shareId: comment.shareId,
				userId: comment.userId,
				userName: comment.userName ?? "",
				userImage: comment.userImage,
				content: comment.content,
				createdAt: comment.createdAt.toISOString(),
				updatedAt: comment.updatedAt.toISOString(),
				isOwn: comment.userId === user.id,
			})),
			isAnonymized: false,
		});
	}

	// 未登入：匿名化
	return c.json({
		comments: comments.map((comment) => ({
			id: comment.id,
			shareId: comment.shareId,
			anonymousId: anonymizeUserId(comment.userId, shareId),
			content: comment.content,
			createdAt: comment.createdAt.toISOString(),
			updatedAt: comment.updatedAt.toISOString(),
		})),
		isAnonymized: true,
	});
});

// 新增留言
sharesRouter.post("/:id/comments", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const shareId = c.req.param("id");
	const body = await c.req.json<{ content: string }>();

	if (!body.content || body.content.trim().length === 0) {
		return c.json({ error: "Content is required" }, 400);
	}

	if (body.content.length > 1000) {
		return c.json({ error: "Content too long (max 1000 chars)" }, 400);
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

	const now = new Date();
	const id = generateShareId();

	await db.insert(shareComments).values({
		id,
		shareId,
		userId: user.id,
		content: body.content.trim(),
		createdAt: now,
		updatedAt: now,
	});

	// 取得 user info for response
	const userInfo = await db
		.select()
		.from(users)
		.where(eq(users.id, user.id))
		.get();

	return c.json(
		{
			id,
			shareId,
			userId: user.id,
			userName: userInfo?.name ?? "",
			userImage: userInfo?.image ?? null,
			content: body.content.trim(),
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
			isOwn: true,
		},
		201,
	);
});

// 編輯留言
sharesRouter.put("/:id/comments/:commentId", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const shareId = c.req.param("id");
	const commentId = c.req.param("commentId");
	const body = await c.req.json<{ content: string }>();

	if (!body.content || body.content.trim().length === 0) {
		return c.json({ error: "Content is required" }, 400);
	}

	if (body.content.length > 1000) {
		return c.json({ error: "Content too long (max 1000 chars)" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 確認留言存在且屬於該分享
	const comment = await db
		.select()
		.from(shareComments)
		.where(
			and(eq(shareComments.id, commentId), eq(shareComments.shareId, shareId)),
		)
		.get();

	if (!comment) {
		return c.json({ error: "Comment not found" }, 404);
	}

	if (comment.userId !== user.id) {
		return c.json({ error: "Forbidden" }, 403);
	}

	const now = new Date();
	await db
		.update(shareComments)
		.set({ content: body.content.trim(), updatedAt: now })
		.where(eq(shareComments.id, commentId));

	return c.json({ success: true, updatedAt: now.toISOString() });
});

// 刪除留言
sharesRouter.delete("/:id/comments/:commentId", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const shareId = c.req.param("id");
	const commentId = c.req.param("commentId");
	const db = drizzle(c.env.DB);

	// 確認留言存在且屬於該分享
	const comment = await db
		.select()
		.from(shareComments)
		.where(
			and(eq(shareComments.id, commentId), eq(shareComments.shareId, shareId)),
		)
		.get();

	if (!comment) {
		return c.json({ error: "Comment not found" }, 404);
	}

	if (comment.userId !== user.id) {
		return c.json({ error: "Forbidden" }, 403);
	}

	await db.delete(shareComments).where(eq(shareComments.id, commentId));

	return c.json({ success: true });
});

// ============ Stats API ============

// 取得分享的統計（表情數 + 留言數）
sharesRouter.get("/:id/stats", async (c) => {
	const shareId = c.req.param("id");
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

	// 計算 reactions 數量
	const reactionCountResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(shareReactions)
		.where(eq(shareReactions.shareId, shareId))
		.get();

	// 計算 comments 數量
	const commentCountResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(shareComments)
		.where(eq(shareComments.shareId, shareId))
		.get();

	return c.json({
		reactionCount: reactionCountResult?.count ?? 0,
		commentCount: commentCountResult?.count ?? 0,
	});
});

// ============ My Shares API ============

// 取得當前用戶的分享列表（含統計）
sharesRouter.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = drizzle(c.env.DB);

	// 取得用戶的所有分享
	const shares = await db
		.select({
			id: publicShares.id,
			period: publicShares.period,
			startDate: publicShares.startDate,
			endDate: publicShares.endDate,
			createdAt: publicShares.createdAt,
			updatedAt: publicShares.updatedAt,
		})
		.from(publicShares)
		.where(eq(publicShares.userId, user.id))
		.all();

	// 取得每個分享的統計
	const sharesWithStats = await Promise.all(
		shares.map(async (share) => {
			const reactionCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(shareReactions)
				.where(eq(shareReactions.shareId, share.id))
				.get();

			const commentCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(shareComments)
				.where(eq(shareComments.shareId, share.id))
				.get();

			return {
				id: share.id,
				period: share.period,
				startDate: share.startDate,
				endDate: share.endDate,
				createdAt: share.createdAt.toISOString(),
				updatedAt: share.updatedAt.toISOString(),
				stats: {
					reactionCount: reactionCount?.count ?? 0,
					commentCount: commentCount?.count ?? 0,
				},
			};
		}),
	);

	return c.json({ shares: sharesWithStats });
});

export default sharesRouter;
