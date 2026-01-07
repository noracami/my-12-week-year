import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { tactics } from "../db/schema";
import type { Env } from "../lib/auth";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const tacticsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 取得所有戰術
tacticsRouter.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = drizzle(c.env.DB);
	const userTactics = await db
		.select()
		.from(tactics)
		.where(eq(tactics.userId, user.id));

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
		type: "daily_check" | "daily_number" | "weekly_count" | "weekly_number";
		targetValue?: number;
		unit?: string;
	}>();

	if (!body.name || !body.type) {
		return c.json({ error: "name and type are required" }, 400);
	}

	const validTypes = [
		"daily_check",
		"daily_number",
		"weekly_count",
		"weekly_number",
	];
	if (!validTypes.includes(body.type)) {
		return c.json({ error: "Invalid type" }, 400);
	}

	const db = drizzle(c.env.DB);
	const now = new Date();
	const id = crypto.randomUUID();

	await db.insert(tactics).values({
		id,
		userId: user.id,
		name: body.name,
		type: body.type,
		targetValue: body.targetValue ?? null,
		unit: body.unit ?? null,
		active: true,
		createdAt: now,
		updatedAt: now,
	});

	const [newTactic] = await db.select().from(tactics).where(eq(tactics.id, id));

	return c.json({ tactic: newTactic }, 201);
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
		type?: "daily_check" | "daily_number" | "weekly_count" | "weekly_number";
		targetValue?: number | null;
		unit?: string | null;
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
			"weekly_count",
			"weekly_number",
		];
		if (!validTypes.includes(body.type)) {
			return c.json({ error: "Invalid type" }, 400);
		}
	}

	await db
		.update(tactics)
		.set({
			...(body.name !== undefined && { name: body.name }),
			...(body.type !== undefined && { type: body.type }),
			...(body.targetValue !== undefined && { targetValue: body.targetValue }),
			...(body.unit !== undefined && { unit: body.unit }),
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
