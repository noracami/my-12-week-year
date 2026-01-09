import { and, eq, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { tactics } from "../db/schema";
import type { Env } from "../lib/auth";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const tacticsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 取得用戶已使用的 categories
tacticsRouter.get("/categories", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = drizzle(c.env.DB);
	const userTactics = await db
		.select({ category: tactics.category })
		.from(tactics)
		.where(eq(tactics.userId, user.id));

	// 取得唯一且非空的 categories
	const categories = [
		...new Set(
			userTactics
				.map((t) => t.category)
				.filter((c): c is string => c !== null && c !== ""),
		),
	].sort();

	return c.json({ categories });
});

// 取得所有戰術（按 sortOrder 排序）
tacticsRouter.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = drizzle(c.env.DB);
	const userTactics = await db
		.select()
		.from(tactics)
		.where(eq(tactics.userId, user.id))
		.orderBy(tactics.sortOrder);

	return c.json({ tactics: userTactics });
});

// 新增戰術
tacticsRouter.post("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		name: string;
		type:
			| "daily_check"
			| "daily_number"
			| "daily_time"
			| "weekly_count"
			| "weekly_number";
		targetValue?: number;
		targetDirection?: "gte" | "lte";
		unit?: string;
		category?: string;
		quarterId?: string | null;
	}>();

	if (!body.name || !body.type) {
		return c.json({ error: "name and type are required" }, 400);
	}

	const validTypes = [
		"daily_check",
		"daily_number",
		"daily_time",
		"weekly_count",
		"weekly_number",
	];
	if (!validTypes.includes(body.type)) {
		return c.json({ error: "Invalid type" }, 400);
	}

	if (body.targetDirection && !["gte", "lte"].includes(body.targetDirection)) {
		return c.json({ error: "Invalid targetDirection" }, 400);
	}

	const db = drizzle(c.env.DB);
	const now = new Date();
	const id = crypto.randomUUID();

	// 取得目前最大 sortOrder
	const [maxResult] = await db
		.select({ maxOrder: max(tactics.sortOrder) })
		.from(tactics)
		.where(eq(tactics.userId, user.id));
	const nextSortOrder = (maxResult?.maxOrder ?? -1) + 1;

	await db.insert(tactics).values({
		id,
		userId: user.id,
		name: body.name,
		type: body.type,
		targetValue: body.targetValue ?? null,
		targetDirection: body.targetDirection ?? "gte",
		unit: body.unit ?? null,
		category: body.category ?? null,
		quarterId: body.quarterId ?? null,
		sortOrder: nextSortOrder,
		active: true,
		createdAt: now,
		updatedAt: now,
	});

	const [newTactic] = await db.select().from(tactics).where(eq(tactics.id, id));

	return c.json({ tactic: newTactic }, 201);
});

// 批次更新排序（必須在 /:id 路由之前）
tacticsRouter.put("/reorder", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		orderedIds: string[];
	}>();

	if (!body.orderedIds || !Array.isArray(body.orderedIds)) {
		return c.json({ error: "orderedIds array is required" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 驗證所有 ID 都屬於該用戶
	const userTactics = await db
		.select({ id: tactics.id })
		.from(tactics)
		.where(eq(tactics.userId, user.id));

	const userTacticIds = new Set(userTactics.map((t) => t.id));
	const invalidIds = body.orderedIds.filter((id) => !userTacticIds.has(id));

	if (invalidIds.length > 0) {
		return c.json({ error: "Some tactic IDs are invalid" }, 400);
	}

	// 批次更新 sortOrder
	const now = new Date();
	for (let i = 0; i < body.orderedIds.length; i++) {
		await db
			.update(tactics)
			.set({ sortOrder: i, updatedAt: now })
			.where(eq(tactics.id, body.orderedIds[i]));
	}

	return c.json({ success: true });
});

// 更新戰術
tacticsRouter.put("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const tacticId = c.req.param("id");
	const body = await c.req.json<{
		name?: string;
		type?:
			| "daily_check"
			| "daily_number"
			| "daily_time"
			| "weekly_count"
			| "weekly_number";
		targetValue?: number | null;
		targetDirection?: "gte" | "lte";
		unit?: string | null;
		category?: string | null;
		quarterId?: string | null;
		active?: boolean;
	}>();

	const db = drizzle(c.env.DB);

	// 確認戰術存在且屬於該用戶
	const [existing] = await db
		.select()
		.from(tactics)
		.where(and(eq(tactics.id, tacticId), eq(tactics.userId, user.id)));

	if (!existing) {
		return c.json({ error: "Tactic not found" }, 404);
	}

	if (body.type) {
		const validTypes = [
			"daily_check",
			"daily_number",
			"daily_time",
			"weekly_count",
			"weekly_number",
		];
		if (!validTypes.includes(body.type)) {
			return c.json({ error: "Invalid type" }, 400);
		}
	}

	if (body.targetDirection && !["gte", "lte"].includes(body.targetDirection)) {
		return c.json({ error: "Invalid targetDirection" }, 400);
	}

	await db
		.update(tactics)
		.set({
			...(body.name !== undefined && { name: body.name }),
			...(body.type !== undefined && { type: body.type }),
			...(body.targetValue !== undefined && { targetValue: body.targetValue }),
			...(body.targetDirection !== undefined && {
				targetDirection: body.targetDirection,
			}),
			...(body.unit !== undefined && { unit: body.unit }),
			...(body.category !== undefined && { category: body.category }),
			...(body.quarterId !== undefined && { quarterId: body.quarterId }),
			...(body.active !== undefined && { active: body.active }),
			updatedAt: new Date(),
		})
		.where(eq(tactics.id, tacticId));

	const [updated] = await db
		.select()
		.from(tactics)
		.where(eq(tactics.id, tacticId));

	return c.json({ tactic: updated });
});

// 刪除戰術
tacticsRouter.delete("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const tacticId = c.req.param("id");
	const db = drizzle(c.env.DB);

	// 確認戰術存在且屬於該用戶
	const [existing] = await db
		.select()
		.from(tactics)
		.where(and(eq(tactics.id, tacticId), eq(tactics.userId, user.id)));

	if (!existing) {
		return c.json({ error: "Tactic not found" }, 404);
	}

	await db.delete(tactics).where(eq(tactics.id, tacticId));

	return c.json({ success: true });
});

export default tacticsRouter;
