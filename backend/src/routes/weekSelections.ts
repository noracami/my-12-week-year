import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { tactics, weekTacticSelections } from "../db/schema";
import type { Env } from "../lib/auth";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const weekSelectionsRouter = new Hono<{
	Bindings: Env;
	Variables: Variables;
}>();

// 計算前一週的 weekStart
function getPrevWeekStart(weekStart: string): string {
	const date = new Date(weekStart);
	date.setDate(date.getDate() - 7);
	return date.toISOString().split("T")[0];
}

// 取得特定週的有效策略（含沿用邏輯）
weekSelectionsRouter.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const weekStart = c.req.query("weekStart");
	if (!weekStart) {
		return c.json({ error: "weekStart is required" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 遞迴查詢：從該週開始，往前找最近的自訂記錄，最多回溯 12 週
	let currentWeekStart = weekStart;
	let foundSelection = null;
	let isCustom = false;

	for (let i = 0; i < 12; i++) {
		const [selection] = await db
			.select()
			.from(weekTacticSelections)
			.where(
				and(
					eq(weekTacticSelections.userId, user.id),
					eq(weekTacticSelections.weekStart, currentWeekStart),
				),
			);

		if (selection) {
			foundSelection = selection;
			isCustom = i === 0; // 只有第一次找到（當週）才算自訂
			break;
		}

		currentWeekStart = getPrevWeekStart(currentWeekStart);
	}

	// 如果找到了自訂記錄，使用它
	if (foundSelection) {
		const tacticIds = JSON.parse(foundSelection.tacticIds) as string[];
		return c.json({
			weekStart,
			tacticIds,
			isCustom,
		});
	}

	// 沒有找到任何記錄，使用所有 active 策略
	const activeTactics = await db
		.select({ id: tactics.id })
		.from(tactics)
		.where(and(eq(tactics.userId, user.id), eq(tactics.active, true)));

	return c.json({
		weekStart,
		tacticIds: activeTactics.map((t) => t.id),
		isCustom: false,
	});
});

// 設定特定週的策略組合（upsert）
weekSelectionsRouter.put("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		weekStart: string;
		tacticIds: string[];
	}>();

	if (!body.weekStart || !Array.isArray(body.tacticIds)) {
		return c.json({ error: "weekStart and tacticIds are required" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 驗證所有 tacticIds 都屬於該用戶
	if (body.tacticIds.length > 0) {
		const userTactics = await db
			.select({ id: tactics.id })
			.from(tactics)
			.where(eq(tactics.userId, user.id));

		const userTacticIds = new Set(userTactics.map((t) => t.id));
		const invalidIds = body.tacticIds.filter((id) => !userTacticIds.has(id));

		if (invalidIds.length > 0) {
			return c.json({ error: "Invalid tacticIds", invalidIds }, 400);
		}
	}

	const now = new Date();

	// 檢查是否已存在該週的記錄
	const [existing] = await db
		.select()
		.from(weekTacticSelections)
		.where(
			and(
				eq(weekTacticSelections.userId, user.id),
				eq(weekTacticSelections.weekStart, body.weekStart),
			),
		);

	if (existing) {
		// 更新
		await db
			.update(weekTacticSelections)
			.set({
				tacticIds: JSON.stringify(body.tacticIds),
				updatedAt: now,
			})
			.where(eq(weekTacticSelections.id, existing.id));
	} else {
		// 新增
		const id = crypto.randomUUID();
		await db.insert(weekTacticSelections).values({
			id,
			userId: user.id,
			weekStart: body.weekStart,
			tacticIds: JSON.stringify(body.tacticIds),
			createdAt: now,
			updatedAt: now,
		});
	}

	return c.json({
		weekStart: body.weekStart,
		tacticIds: body.tacticIds,
		isCustom: true,
	});
});

// 清除特定週的自訂選擇（改為沿用上週）
weekSelectionsRouter.delete("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const weekStart = c.req.query("weekStart");
	if (!weekStart) {
		return c.json({ error: "weekStart is required" }, 400);
	}

	const db = drizzle(c.env.DB);

	await db
		.delete(weekTacticSelections)
		.where(
			and(
				eq(weekTacticSelections.userId, user.id),
				eq(weekTacticSelections.weekStart, weekStart),
			),
		);

	return c.json({ success: true });
});

export default weekSelectionsRouter;
