import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { quarters, tactics } from "../db/schema";
import type { Env } from "../lib/auth";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const quartersRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 計算季度結束日期（起始日 + 83 天 = 12 週 - 1 天）
function calculateEndDate(startDate: string): string {
	const date = new Date(startDate);
	date.setDate(date.getDate() + 83);
	return date.toISOString().split("T")[0];
}

// 取得所有季度（按 startDate 降序）
quartersRouter.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = drizzle(c.env.DB);
	const userQuarters = await db
		.select()
		.from(quarters)
		.where(eq(quarters.userId, user.id))
		.orderBy(desc(quarters.startDate));

	return c.json({ quarters: userQuarters });
});

// 取得當前進行中的季度
quartersRouter.get("/active", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = drizzle(c.env.DB);
	const today = new Date().toISOString().split("T")[0];

	// 找出今日落在哪個季度範圍內
	const userQuarters = await db
		.select()
		.from(quarters)
		.where(eq(quarters.userId, user.id))
		.orderBy(desc(quarters.startDate));

	const activeQuarter = userQuarters.find(
		(q) => q.startDate <= today && q.endDate >= today,
	);

	if (!activeQuarter) {
		return c.json({ quarter: null, weekNumber: null, daysRemaining: null });
	}

	// 計算當前是第幾週
	const startDate = new Date(activeQuarter.startDate);
	const todayDate = new Date(today);
	const daysDiff = Math.floor(
		(todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
	);
	const weekNumber = Math.floor(daysDiff / 7) + 1;

	// 計算剩餘天數
	const endDate = new Date(activeQuarter.endDate);
	const daysRemaining = Math.floor(
		(endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	return c.json({
		quarter: activeQuarter,
		weekNumber,
		daysRemaining,
	});
});

// 取得單一季度詳情（含關聯策略）
quartersRouter.get("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const quarterId = c.req.param("id");
	const db = drizzle(c.env.DB);

	const [quarter] = await db
		.select()
		.from(quarters)
		.where(and(eq(quarters.id, quarterId), eq(quarters.userId, user.id)));

	if (!quarter) {
		return c.json({ error: "Quarter not found" }, 404);
	}

	// 取得關聯策略
	const quarterTactics = await db
		.select()
		.from(tactics)
		.where(and(eq(tactics.quarterId, quarterId), eq(tactics.userId, user.id)))
		.orderBy(tactics.sortOrder);

	return c.json({ quarter, tactics: quarterTactics });
});

// 新增季度
quartersRouter.post("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		name: string;
		startDate: string;
		goals?: Array<{ title: string; description?: string }>;
	}>();

	if (!body.name || !body.startDate) {
		return c.json({ error: "name and startDate are required" }, 400);
	}

	// 驗證日期格式 YYYY-MM-DD
	if (!/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
		return c.json({ error: "Invalid startDate format (YYYY-MM-DD)" }, 400);
	}

	const db = drizzle(c.env.DB);
	const now = new Date();
	const id = crypto.randomUUID();
	const endDate = calculateEndDate(body.startDate);

	await db.insert(quarters).values({
		id,
		userId: user.id,
		name: body.name,
		startDate: body.startDate,
		endDate,
		goals: body.goals ? JSON.stringify(body.goals) : null,
		status: "planning",
		createdAt: now,
		updatedAt: now,
	});

	const [newQuarter] = await db
		.select()
		.from(quarters)
		.where(eq(quarters.id, id));

	return c.json({ quarter: newQuarter }, 201);
});

// 更新季度
quartersRouter.put("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const quarterId = c.req.param("id");
	const body = await c.req.json<{
		name?: string;
		startDate?: string;
		goals?: Array<{ title: string; description?: string }>;
		reviewNotes?: string | null;
		status?: "planning" | "active" | "completed";
	}>();

	const db = drizzle(c.env.DB);

	// 確認季度存在且屬於該用戶
	const [existing] = await db
		.select()
		.from(quarters)
		.where(and(eq(quarters.id, quarterId), eq(quarters.userId, user.id)));

	if (!existing) {
		return c.json({ error: "Quarter not found" }, 404);
	}

	if (body.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
		return c.json({ error: "Invalid startDate format (YYYY-MM-DD)" }, 400);
	}

	if (
		body.status &&
		!["planning", "active", "completed"].includes(body.status)
	) {
		return c.json({ error: "Invalid status" }, 400);
	}

	// 如果更新 startDate，也要更新 endDate
	const endDate = body.startDate ? calculateEndDate(body.startDate) : undefined;

	await db
		.update(quarters)
		.set({
			...(body.name !== undefined && { name: body.name }),
			...(body.startDate !== undefined && { startDate: body.startDate }),
			...(endDate !== undefined && { endDate }),
			...(body.goals !== undefined && {
				goals: JSON.stringify(body.goals),
			}),
			...(body.reviewNotes !== undefined && { reviewNotes: body.reviewNotes }),
			...(body.status !== undefined && { status: body.status }),
			updatedAt: new Date(),
		})
		.where(eq(quarters.id, quarterId));

	const [updated] = await db
		.select()
		.from(quarters)
		.where(eq(quarters.id, quarterId));

	return c.json({ quarter: updated });
});

// 刪除季度（需無關聯策略）
quartersRouter.delete("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const quarterId = c.req.param("id");
	const db = drizzle(c.env.DB);

	// 確認季度存在且屬於該用戶
	const [existing] = await db
		.select()
		.from(quarters)
		.where(and(eq(quarters.id, quarterId), eq(quarters.userId, user.id)));

	if (!existing) {
		return c.json({ error: "Quarter not found" }, 404);
	}

	// 檢查是否有關聯策略
	const linkedTactics = await db
		.select({ id: tactics.id })
		.from(tactics)
		.where(eq(tactics.quarterId, quarterId));

	if (linkedTactics.length > 0) {
		return c.json(
			{
				error:
					"Cannot delete quarter with linked tactics. Remove tactics first.",
			},
			400,
		);
	}

	await db.delete(quarters).where(eq(quarters.id, quarterId));

	return c.json({ success: true });
});

export default quartersRouter;
