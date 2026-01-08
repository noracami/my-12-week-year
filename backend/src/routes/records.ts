import { and, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { records, tactics, weekTacticSelections } from "../db/schema";
import type { Env } from "../lib/auth";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const recordsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 取得記錄（依日期範圍）
recordsRouter.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const startDate = c.req.query("startDate");
	const endDate = c.req.query("endDate");
	const tacticId = c.req.query("tacticId");

	const db = drizzle(c.env.DB);

	// 先取得用戶的所有戰術 ID
	const userTactics = await db
		.select({ id: tactics.id })
		.from(tactics)
		.where(eq(tactics.userId, user.id));

	const userTacticIds = userTactics.map((t) => t.id);

	if (userTacticIds.length === 0) {
		return c.json({ records: [] });
	}

	// 建立查詢條件
	const conditions = [eq(tactics.userId, user.id)];

	if (startDate) {
		conditions.push(gte(records.date, startDate));
	}
	if (endDate) {
		conditions.push(lte(records.date, endDate));
	}
	if (tacticId) {
		conditions.push(eq(records.tacticId, tacticId));
	}

	const results = await db
		.select({
			record: records,
			tactic: tactics,
		})
		.from(records)
		.innerJoin(tactics, eq(records.tacticId, tactics.id))
		.where(and(...conditions));

	return c.json({
		records: results.map((r) => ({
			...r.record,
			tactic: r.tactic,
		})),
	});
});

// 新增或更新記錄
recordsRouter.post("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		tacticId: string;
		date: string;
		value: number;
	}>();

	if (!body.tacticId || !body.date || body.value === undefined) {
		return c.json({ error: "tacticId, date, and value are required" }, 400);
	}

	// 驗證日期格式
	if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
		return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 確認戰術存在且屬於該用戶
	const [tactic] = await db
		.select()
		.from(tactics)
		.where(and(eq(tactics.id, body.tacticId), eq(tactics.userId, user.id)));

	if (!tactic) {
		return c.json({ error: "Tactic not found" }, 404);
	}

	// 檢查是否已有該日期的記錄
	const [existing] = await db
		.select()
		.from(records)
		.where(
			and(eq(records.tacticId, body.tacticId), eq(records.date, body.date)),
		);

	const now = new Date();

	if (existing) {
		// 更新現有記錄
		await db
			.update(records)
			.set({
				value: body.value,
				updatedAt: now,
			})
			.where(eq(records.id, existing.id));

		const [updated] = await db
			.select()
			.from(records)
			.where(eq(records.id, existing.id));

		return c.json({ record: updated });
	}

	// 新增記錄
	const id = crypto.randomUUID();
	await db.insert(records).values({
		id,
		tacticId: body.tacticId,
		date: body.date,
		value: body.value,
		createdAt: now,
		updatedAt: now,
	});

	const [newRecord] = await db.select().from(records).where(eq(records.id, id));

	return c.json({ record: newRecord }, 201);
});

// 刪除記錄
recordsRouter.delete("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const recordId = c.req.param("id");
	const db = drizzle(c.env.DB);

	// 確認記錄存在且屬於該用戶的戰術
	const [existing] = await db
		.select({
			record: records,
			tactic: tactics,
		})
		.from(records)
		.innerJoin(tactics, eq(records.tacticId, tactics.id))
		.where(and(eq(records.id, recordId), eq(tactics.userId, user.id)));

	if (!existing) {
		return c.json({ error: "Record not found" }, 404);
	}

	await db.delete(records).where(eq(records.id, recordId));

	return c.json({ success: true });
});

// 輔助函數：計算前一週的 weekStart
function getPrevWeekStart(weekStart: string): string {
	const date = new Date(weekStart);
	date.setDate(date.getDate() - 7);
	return date.toISOString().split("T")[0];
}

// 計算週執行率
recordsRouter.get("/score", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const startDate = c.req.query("startDate");
	const endDate = c.req.query("endDate");

	if (!startDate || !endDate) {
		return c.json({ error: "startDate and endDate are required" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 取得該週的有效策略 ID（含沿用邏輯）
	let weekTacticIds: string[] | null = null;
	let currentWeekStart = startDate;

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
			weekTacticIds = JSON.parse(selection.tacticIds) as string[];
			break;
		}

		currentWeekStart = getPrevWeekStart(currentWeekStart);
	}

	// 取得用戶的所有啟用戰術
	const allActiveTactics = await db
		.select()
		.from(tactics)
		.where(and(eq(tactics.userId, user.id), eq(tactics.active, true)));

	// 如果有週選擇，過濾出該週的戰術；否則使用所有啟用戰術
	const userTactics = weekTacticIds
		? allActiveTactics.filter((t) => weekTacticIds.includes(t.id))
		: allActiveTactics;

	if (userTactics.length === 0) {
		return c.json({ score: 0, details: [] });
	}

	// 取得該週期內的所有記錄
	const weekRecords = await db
		.select()
		.from(records)
		.where(
			and(
				gte(records.date, startDate),
				lte(records.date, endDate),
				sql`${records.tacticId} IN (${sql.join(
					userTactics.map((t) => sql`${t.id}`),
					sql`,`,
				)})`,
			),
		);

	// 計算週期內的天數
	const start = new Date(startDate);
	const end = new Date(endDate);
	const daysInPeriod =
		Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

	// 產生週期內所有日期
	const allDates: string[] = [];
	for (let i = 0; i < daysInPeriod; i++) {
		const d = new Date(start);
		d.setDate(d.getDate() + i);
		allDates.push(d.toISOString().split("T")[0]);
	}

	// 判斷是否達標的輔助函數
	const meetsTarget = (
		value: number,
		targetValue: number,
		direction: string | null,
	) => {
		if (direction === "lte") {
			return value <= targetValue;
		}
		return value >= targetValue; // 預設 gte
	};

	// 計算每個戰術的得分
	const details = userTactics.map((tactic) => {
		const tacticRecords = weekRecords.filter((r) => r.tacticId === tactic.id);
		const direction = tactic.targetDirection ?? "gte";

		let achieved = false;
		let current = 0;
		let target = tactic.targetValue ?? 1;
		let dailyStatus: boolean[] | null = null;
		let dailyValues: number[] | null = null;

		switch (tactic.type) {
			case "daily_check":
				// 每日勾選：目標是週期內每天都要完成
				target = daysInPeriod;
				current = tacticRecords.filter((r) => r.value === 1).length;
				achieved = current >= target;
				// 產生每日狀態
				dailyStatus = allDates.map((date) => {
					const record = tacticRecords.find((r) => r.date === date);
					return record?.value === 1;
				});
				break;

			case "daily_number":
			case "daily_time":
				// 每日數值/時間：目標是週期內每天都要達標
				target = daysInPeriod;
				current = tacticRecords.filter((r) =>
					meetsTarget(r.value, tactic.targetValue ?? 0, direction),
				).length;
				achieved = current >= target;
				// 產生每日狀態
				dailyStatus = allDates.map((date) => {
					const record = tacticRecords.find((r) => r.date === date);
					return record
						? meetsTarget(record.value, tactic.targetValue ?? 0, direction)
						: false;
				});
				break;

			case "weekly_count":
				// 每週次數：計算該週期內完成次數
				current = tacticRecords.filter((r) => r.value === 1).length;
				achieved = meetsTarget(current, target, direction);
				break;

			case "weekly_number":
				// 每週數值：加總該週期內所有記錄
				current = tacticRecords.reduce((sum, r) => sum + r.value, 0);
				achieved = meetsTarget(current, target, direction);
				// 產生每日數值
				dailyValues = allDates.map((date) => {
					const record = tacticRecords.find((r) => r.date === date);
					return record?.value ?? 0;
				});
				break;
		}

		return {
			tacticId: tactic.id,
			tacticName: tactic.name,
			type: tactic.type,
			category: tactic.category,
			target,
			current,
			achieved,
			unit: tactic.unit,
			dailyStatus,
			dailyValues,
		};
	});

	// 計算整體得分（各戰術達成率的平均，每項最高 100%）
	const totalProgress = details.reduce((sum, d) => {
		// 每項進度最高為 1（100%），超過目標也不會超過 100%
		const progress = d.target > 0 ? Math.min(d.current / d.target, 1) : 0;
		return sum + progress;
	}, 0);
	const score = Math.round((totalProgress / details.length) * 100);

	return c.json({ score, details });
});

export default recordsRouter;
