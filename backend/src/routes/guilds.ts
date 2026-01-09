import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { groups, guildMembers, guilds, users } from "../db/schema";
import type { Env } from "../lib/auth";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const guildsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Helper: 檢查用戶是否為 guild 成員
async function getGuildMember(
	db: ReturnType<typeof drizzle>,
	guildId: string,
	userId: string,
) {
	const [member] = await db
		.select()
		.from(guildMembers)
		.where(
			and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, userId)),
		);
	return member ?? null;
}

// Helper: 檢查用戶是否為 guild admin
async function isGuildAdmin(
	db: ReturnType<typeof drizzle>,
	guildId: string,
	userId: string,
) {
	const member = await getGuildMember(db, guildId, userId);
	return member?.role === "admin";
}

// 列出用戶所屬的所有 guild
guildsRouter.get("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = drizzle(c.env.DB);

	// 取得用戶所屬的所有 guild（透過 guildMembers 表）
	const memberGuilds = await db
		.select({
			guild: guilds,
			role: guildMembers.role,
			joinedAt: guildMembers.joinedAt,
		})
		.from(guildMembers)
		.innerJoin(guilds, eq(guildMembers.guildId, guilds.id))
		.where(eq(guildMembers.userId, user.id));

	return c.json({
		guilds: memberGuilds.map((mg) => ({
			...mg.guild,
			role: mg.role,
			joinedAt: mg.joinedAt,
		})),
	});
});

// 建立 guild（建立者成為 admin）
guildsRouter.post("/", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{
		name: string;
		description?: string;
	}>();

	if (!body.name) {
		return c.json({ error: "name is required" }, 400);
	}

	const db = drizzle(c.env.DB);
	const now = new Date();
	const guildId = crypto.randomUUID();
	const memberId = crypto.randomUUID();

	// 建立 guild
	await db.insert(guilds).values({
		id: guildId,
		name: body.name,
		description: body.description ?? null,
		createdBy: user.id,
		createdAt: now,
		updatedAt: now,
	});

	// 建立者成為 admin
	await db.insert(guildMembers).values({
		id: memberId,
		guildId: guildId,
		userId: user.id,
		groupId: null,
		role: "admin",
		joinedAt: now,
	});

	const [newGuild] = await db
		.select()
		.from(guilds)
		.where(eq(guilds.id, guildId));

	return c.json(
		{
			guild: {
				...newGuild,
				role: "admin",
				joinedAt: now,
			},
		},
		201,
	);
});

// 取得 guild 詳情（需為成員）
guildsRouter.get("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("id");
	const db = drizzle(c.env.DB);

	// 檢查是否為成員
	const member = await getGuildMember(db, guildId, user.id);
	if (!member) {
		return c.json({ error: "Guild not found" }, 404);
	}

	const [guild] = await db.select().from(guilds).where(eq(guilds.id, guildId));
	if (!guild) {
		return c.json({ error: "Guild not found" }, 404);
	}

	// 取得成員數量
	const members = await db
		.select()
		.from(guildMembers)
		.where(eq(guildMembers.guildId, guildId));

	// 取得 groups
	const guildGroups = await db
		.select()
		.from(groups)
		.where(eq(groups.guildId, guildId));

	return c.json({
		guild: {
			...guild,
			role: member.role,
			joinedAt: member.joinedAt,
			memberCount: members.length,
			groups: guildGroups,
		},
	});
});

// 更新 guild（需為 admin）
guildsRouter.put("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("id");
	const body = await c.req.json<{
		name?: string;
		description?: string | null;
	}>();

	const db = drizzle(c.env.DB);

	// 檢查是否為 admin
	if (!(await isGuildAdmin(db, guildId, user.id))) {
		return c.json({ error: "Forbidden" }, 403);
	}

	await db
		.update(guilds)
		.set({
			...(body.name !== undefined && { name: body.name }),
			...(body.description !== undefined && { description: body.description }),
			updatedAt: new Date(),
		})
		.where(eq(guilds.id, guildId));

	const [updated] = await db
		.select()
		.from(guilds)
		.where(eq(guilds.id, guildId));

	return c.json({ guild: updated });
});

// 刪除 guild（需為建立者）
guildsRouter.delete("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("id");
	const db = drizzle(c.env.DB);

	// 檢查是否為建立者
	const [guild] = await db.select().from(guilds).where(eq(guilds.id, guildId));
	if (!guild) {
		return c.json({ error: "Guild not found" }, 404);
	}

	if (guild.createdBy !== user.id) {
		return c.json({ error: "Forbidden" }, 403);
	}

	// 刪除順序：invites → members → groups → guild
	// 由於有 foreign key，需要按順序刪除
	const { guildInvites } = await import("../db/schema");

	await db.delete(guildInvites).where(eq(guildInvites.guildId, guildId));
	await db.delete(guildMembers).where(eq(guildMembers.guildId, guildId));
	await db.delete(groups).where(eq(groups.guildId, guildId));
	await db.delete(guilds).where(eq(guilds.id, guildId));

	return c.json({ success: true });
});

// ============ Groups（嵌套在 guild 下） ============

// 列出 guild 內所有 group
guildsRouter.get("/:guildId/groups", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("guildId");
	const db = drizzle(c.env.DB);

	// 檢查是否為成員
	const member = await getGuildMember(db, guildId, user.id);
	if (!member) {
		return c.json({ error: "Guild not found" }, 404);
	}

	const guildGroups = await db
		.select()
		.from(groups)
		.where(eq(groups.guildId, guildId));

	return c.json({ groups: guildGroups });
});

// 建立 group（需為 admin）
guildsRouter.post("/:guildId/groups", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("guildId");
	const body = await c.req.json<{
		name: string;
	}>();

	if (!body.name) {
		return c.json({ error: "name is required" }, 400);
	}

	const db = drizzle(c.env.DB);

	// 檢查是否為 admin
	if (!(await isGuildAdmin(db, guildId, user.id))) {
		return c.json({ error: "Forbidden" }, 403);
	}

	const now = new Date();
	const groupId = crypto.randomUUID();

	await db.insert(groups).values({
		id: groupId,
		guildId: guildId,
		name: body.name,
		createdAt: now,
		updatedAt: now,
	});

	const [newGroup] = await db
		.select()
		.from(groups)
		.where(eq(groups.id, groupId));

	return c.json({ group: newGroup }, 201);
});

// ============ Members（嵌套在 guild 下） ============

// 列出 guild 內所有成員
guildsRouter.get("/:guildId/members", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("guildId");
	const db = drizzle(c.env.DB);

	// 檢查是否為成員
	const member = await getGuildMember(db, guildId, user.id);
	if (!member) {
		return c.json({ error: "Guild not found" }, 404);
	}

	// 取得所有成員，包含 user 資訊和 group 資訊
	const members = await db
		.select({
			id: guildMembers.id,
			userId: guildMembers.userId,
			groupId: guildMembers.groupId,
			role: guildMembers.role,
			joinedAt: guildMembers.joinedAt,
			userName: users.name,
			userImage: users.image,
		})
		.from(guildMembers)
		.innerJoin(users, eq(guildMembers.userId, users.id))
		.where(eq(guildMembers.guildId, guildId));

	return c.json({ members });
});

// ============ Invites（嵌套在 guild 下） ============

// 列出 guild 的邀請連結（需為 admin）
guildsRouter.get("/:guildId/invites", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("guildId");
	const db = drizzle(c.env.DB);

	// 檢查是否為 admin
	if (!(await isGuildAdmin(db, guildId, user.id))) {
		return c.json({ error: "Forbidden" }, 403);
	}

	const { guildInvites } = await import("../db/schema");
	const invites = await db
		.select()
		.from(guildInvites)
		.where(eq(guildInvites.guildId, guildId));

	return c.json({ invites });
});

// 建立邀請連結（需為 admin）
guildsRouter.post("/:guildId/invites", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const guildId = c.req.param("guildId");
	const body = await c.req.json<{
		groupId?: string;
		expiresInDays?: number;
		maxUses?: number;
	}>();

	const db = drizzle(c.env.DB);

	// 檢查是否為 admin
	if (!(await isGuildAdmin(db, guildId, user.id))) {
		return c.json({ error: "Forbidden" }, 403);
	}

	// 產生隨機邀請碼（8 字元）
	const code = crypto.randomUUID().slice(0, 8);

	const now = new Date();
	const expiresAt = body.expiresInDays
		? new Date(now.getTime() + body.expiresInDays * 24 * 60 * 60 * 1000)
		: null;

	const { guildInvites } = await import("../db/schema");
	const inviteId = crypto.randomUUID();

	await db.insert(guildInvites).values({
		id: inviteId,
		guildId: guildId,
		groupId: body.groupId ?? null,
		code: code,
		createdBy: user.id,
		expiresAt: expiresAt,
		maxUses: body.maxUses ?? null,
		usedCount: 0,
		createdAt: now,
	});

	const [newInvite] = await db
		.select()
		.from(guildInvites)
		.where(eq(guildInvites.id, inviteId));

	return c.json({ invite: newInvite }, 201);
});

export default guildsRouter;
export { getGuildMember, isGuildAdmin };
