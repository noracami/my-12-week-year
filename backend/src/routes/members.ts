import { and, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import {
	guildMembers,
	guilds,
	records,
	tactics,
	users,
	weekTacticSelections,
} from "../db/schema";
import type { Env } from "../lib/auth";
import { getGuildMember, isGuildAdmin } from "./guilds";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const membersRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 更新成員（角色、分組）- 需為 admin
membersRouter.put("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const memberId = c.req.param("id");
	const body = await c.req.json<{
		role?: "admin" | "member";
		groupId?: string | null;
	}>();

	const db = drizzle(c.env.DB);

	// 取得該成員記錄
	const [member] = await db
		.select()
		.from(guildMembers)
		.where(eq(guildMembers.id, memberId));

	if (!member) {
		return c.json({ error: "Member not found" }, 404);
	}

	// 檢查當前用戶是否為 guild admin
	if (!(await isGuildAdmin(db, member.guildId, user.id))) {
		return c.json({ error: "Forbidden" }, 403);
	}

	// 不能修改建立者的角色
	const [guild] = await db
		.select()
		.from(guilds)
		.where(eq(guilds.id, member.guildId));

	if (guild && member.userId === guild.createdBy && body.role === "member") {
		return c.json({ error: "Cannot demote guild creator" }, 400);
	}

	await db
		.update(guildMembers)
		.set({
			...(body.role !== undefined && { role: body.role }),
			...(body.groupId !== undefined && { groupId: body.groupId }),
		})
		.where(eq(guildMembers.id, memberId));

	const [updated] = await db
		.select()
		.from(guildMembers)
		.where(eq(guildMembers.id, memberId));

	return c.json({ member: updated });
});

// 移除成員/退出 - admin 可移除他人，任何人可以退出
membersRouter.delete("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const memberId = c.req.param("id");
	const db = drizzle(c.env.DB);

	// 取得該成員記錄
	const [member] = await db
		.select()
		.from(guildMembers)
		.where(eq(guildMembers.id, memberId));

	if (!member) {
		return c.json({ error: "Member not found" }, 404);
	}

	// 檢查權限：自己可以退出，admin 可以移除他人
	const isSelf = member.userId === user.id;
	const isAdmin = await isGuildAdmin(db, member.guildId, user.id);

	if (!isSelf && !isAdmin) {
		return c.json({ error: "Forbidden" }, 403);
	}

	// 建立者不能退出（只能刪除整個 guild）
	const [guild] = await db
		.select()
		.from(guilds)
		.where(eq(guilds.id, member.guildId));

	if (guild && member.userId === guild.createdBy) {
		return c.json({ error: "Guild creator cannot leave" }, 400);
	}

	await db.delete(guildMembers).where(eq(guildMembers.id, memberId));

	return c.json({ success: true });
});

// ============ 成員週執行率 ============

// 輔助函數：計算前一週的 weekStart
function getPrevWeekStart(weekStart: string): string {
	const date = new Date(weekStart);
	date.setDate(date.getDate() - 7);
	return date.toISOString().split("T")[0];
}

// 取得成員週執行率（需為同 Guild 成員）
membersRouter.get("/score/:guildId/:userId", async (c) => {
	const currentUser = c.get("user");
	if (!currentUser) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("guildId");
	const targetUserId = c.req.param("userId");
	const startDate = c.req.query("startDate");
	const endDate = c.req.query("endDate");

	if (!startDate || !endDate) {
		return c.json({ error: "startDate and endDate are required" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 檢查當前用戶是否為 guild 成員
	const currentMember = await getGuildMember(db, guildId, currentUser.id);
	if (!currentMember) {
		return c.json({ error: "Guild not found" }, 404);
	}

	// 檢查目標用戶是否也是 guild 成員
	const targetMember = await getGuildMember(db, guildId, targetUserId);
	if (!targetMember) {
		return c.json({ error: "Member not found" }, 404);
	}

	// 取得目標用戶資訊
	const [targetUser] = await db
		.select({ name: users.name, image: users.image })
		.from(users)
		.where(eq(users.id, targetUserId));

	// 以下是複製自 records.ts 的 score 計算邏輯，但針對 targetUserId

	// 取得該週的有效策略 ID（含沿用邏輯）
	let weekTacticIds: string[] | null = null;
	let currentWeekStart = startDate;

	for (let i = 0; i < 12; i++) {
		const [selection] = await db
			.select()
			.from(weekTacticSelections)
			.where(
				and(
					eq(weekTacticSelections.userId, targetUserId),
					eq(weekTacticSelections.weekStart, currentWeekStart),
				),
			);

		if (selection) {
			weekTacticIds = JSON.parse(selection.tacticIds) as string[];
			break;
		}

		currentWeekStart = getPrevWeekStart(currentWeekStart);
	}

	// 取得目標用戶的所有啟用戰術
	const allActiveTactics = await db
		.select()
		.from(tactics)
		.where(and(eq(tactics.userId, targetUserId), eq(tactics.active, true)));

	// 如果有週選擇，過濾出該週的戰術；否則使用所有啟用戰術
	const userTactics = weekTacticIds
		? allActiveTactics.filter((t) => weekTacticIds.includes(t.id))
		: allActiveTactics;

	if (userTactics.length === 0) {
		return c.json({
			user: targetUser,
			score: 0,
			details: [],
		});
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

	// 計算週期內的天數與週數
	const start = new Date(startDate);
	const end = new Date(endDate);
	const daysInPeriod =
		Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
	const weeksInPeriod = Math.round(daysInPeriod / 7);

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
				target = daysInPeriod;
				current = tacticRecords.filter((r) => r.value === 1).length;
				achieved = current >= target;
				dailyStatus = allDates.map((date) => {
					const record = tacticRecords.find((r) => r.date === date);
					return record?.value === 1;
				});
				break;

			case "daily_number":
			case "daily_time":
				target = daysInPeriod;
				current = tacticRecords.filter((r) =>
					meetsTarget(r.value, tactic.targetValue ?? 0, direction),
				).length;
				achieved = current >= target;
				dailyStatus = allDates.map((date) => {
					const record = tacticRecords.find((r) => r.date === date);
					return record
						? meetsTarget(record.value, tactic.targetValue ?? 0, direction)
						: false;
				});
				break;

			case "weekly_count":
				target = (tactic.targetValue ?? 1) * weeksInPeriod;
				current = tacticRecords.filter((r) => r.value === 1).length;
				achieved = meetsTarget(current, target, direction);
				break;

			case "weekly_number":
				target = (tactic.targetValue ?? 1) * weeksInPeriod;
				current = tacticRecords.reduce((sum, r) => sum + r.value, 0);
				achieved = meetsTarget(current, target, direction);
				dailyValues = allDates.map((date) => {
					const dayRecords = tacticRecords.filter((r) => r.date === date);
					return dayRecords.reduce((sum, r) => sum + r.value, 0);
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

	// 計算整體得分
	const totalProgress = details.reduce((sum, d) => {
		const progress = d.target > 0 ? Math.min(d.current / d.target, 1) : 0;
		return sum + progress;
	}, 0);
	const score = Math.round((totalProgress / details.length) * 100);

	return c.json({
		user: targetUser,
		score,
		details,
	});
});

export default membersRouter;
