import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { groups, guildMembers } from "../db/schema";
import type { Env } from "../lib/auth";
import { isGuildAdmin } from "./guilds";

type Variables = {
	user: { id: string } | null;
	session: unknown;
};

const groupsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 更新 group（需為 guild admin）
groupsRouter.put("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const groupId = c.req.param("id");
	const body = await c.req.json<{
		name?: string;
	}>();

	const db = drizzle(c.env.DB);

	// 取得 group 確認存在
	const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
	if (!group) {
		return c.json({ error: "Group not found" }, 404);
	}

	// 檢查是否為 guild admin
	if (!(await isGuildAdmin(db, group.guildId, user.id))) {
		return c.json({ error: "Forbidden" }, 403);
	}

	await db
		.update(groups)
		.set({
			...(body.name !== undefined && { name: body.name }),
			updatedAt: new Date(),
		})
		.where(eq(groups.id, groupId));

	const [updated] = await db
		.select()
		.from(groups)
		.where(eq(groups.id, groupId));

	return c.json({ group: updated });
});

// 刪除 group（需為 guild admin）
groupsRouter.delete("/:id", async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const groupId = c.req.param("id");
	const db = drizzle(c.env.DB);

	// 取得 group 確認存在
	const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
	if (!group) {
		return c.json({ error: "Group not found" }, 404);
	}

	// 檢查是否為 guild admin
	if (!(await isGuildAdmin(db, group.guildId, user.id))) {
		return c.json({ error: "Forbidden" }, 403);
	}

	// 將該 group 的成員移出（設為 null）
	await db
		.update(guildMembers)
		.set({ groupId: null })
		.where(eq(guildMembers.groupId, groupId));

	// 刪除 group
	await db.delete(groups).where(eq(groups.id, groupId));

	return c.json({ success: true });
});

export default groupsRouter;
