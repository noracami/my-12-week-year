import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { guildInvites, guildMembers, guilds } from "../db/schema";
import type { Env } from "../lib/auth";
import { isGuildAdmin } from "./guilds";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const invitesRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 刪除邀請連結（需為 admin）
invitesRouter.delete("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const inviteId = c.req.param("id");
	const db = drizzle(c.env.DB);

	// 取得邀請
	const [invite] = await db
		.select()
		.from(guildInvites)
		.where(eq(guildInvites.id, inviteId));

	if (!invite) {
		return c.json({ error: "Invite not found" }, 404);
	}

	// 檢查是否為 admin
	if (!(await isGuildAdmin(db, invite.guildId, user.id))) {
		return c.json({ error: "Forbidden" }, 403);
	}

	await db.delete(guildInvites).where(eq(guildInvites.id, inviteId));

	return c.json({ success: true });
});

// 取得邀請資訊（公開）
invitesRouter.get("/code/:code", async (c) => {
	const code = c.req.param("code");
	const db = drizzle(c.env.DB);

	const [invite] = await db
		.select()
		.from(guildInvites)
		.where(eq(guildInvites.code, code));

	if (!invite) {
		return c.json({ error: "Invite not found" }, 404);
	}

	// 檢查是否已過期
	if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
		return c.json({ error: "Invite has expired" }, 410);
	}

	// 檢查是否已達使用上限
	if (invite.maxUses && invite.usedCount >= invite.maxUses) {
		return c.json({ error: "Invite has reached maximum uses" }, 410);
	}

	// 取得 guild 資訊
	const [guild] = await db
		.select({
			id: guilds.id,
			name: guilds.name,
			description: guilds.description,
		})
		.from(guilds)
		.where(eq(guilds.id, invite.guildId));

	if (!guild) {
		return c.json({ error: "Guild not found" }, 404);
	}

	return c.json({
		invite: {
			code: invite.code,
			guildId: invite.guildId,
			groupId: invite.groupId,
		},
		guild,
	});
});

// 接受邀請加入
invitesRouter.post("/code/:code/accept", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const code = c.req.param("code");
	const db = drizzle(c.env.DB);

	const [invite] = await db
		.select()
		.from(guildInvites)
		.where(eq(guildInvites.code, code));

	if (!invite) {
		return c.json({ error: "Invite not found" }, 404);
	}

	// 檢查是否已過期
	if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
		return c.json({ error: "Invite has expired" }, 410);
	}

	// 檢查是否已達使用上限
	if (invite.maxUses && invite.usedCount >= invite.maxUses) {
		return c.json({ error: "Invite has reached maximum uses" }, 410);
	}

	// 檢查是否已經是成員
	const [existingMember] = await db
		.select()
		.from(guildMembers)
		.where(
			and(
				eq(guildMembers.guildId, invite.guildId),
				eq(guildMembers.userId, user.id),
			),
		);

	if (existingMember) {
		return c.json({ error: "Already a member of this guild" }, 409);
	}

	const now = new Date();
	const memberId = crypto.randomUUID();

	// 新增成員
	await db.insert(guildMembers).values({
		id: memberId,
		guildId: invite.guildId,
		userId: user.id,
		groupId: invite.groupId,
		role: "member",
		joinedAt: now,
	});

	// 更新邀請使用次數
	await db
		.update(guildInvites)
		.set({ usedCount: invite.usedCount + 1 })
		.where(eq(guildInvites.id, invite.id));

	// 取得 guild 資訊回傳
	const [guild] = await db
		.select()
		.from(guilds)
		.where(eq(guilds.id, invite.guildId));

	return c.json(
		{
			guild: {
				...guild,
				role: "member",
				joinedAt: now,
			},
		},
		201,
	);
});

export default invitesRouter;
