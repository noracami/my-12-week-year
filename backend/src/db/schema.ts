import {
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ============ Better Auth Tables ============

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
});

export const accounts = sqliteTable("accounts", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", {
		mode: "timestamp",
	}),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verifications", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ============ App Tables ============

export const quarters = sqliteTable("quarters", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	name: text("name").notNull(), // e.g., "Q1 2026"
	startDate: text("start_date").notNull(), // YYYY-MM-DD（季度起始日）
	endDate: text("end_date").notNull(), // YYYY-MM-DD（startDate + 83 days）
	goals: text("goals"), // JSON 陣列字串
	reviewNotes: text("review_notes"), // 回顧筆記（markdown）
	status: text("status", {
		enum: ["planning", "active", "completed"],
	})
		.notNull()
		.default("planning"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const tactics = sqliteTable("tactics", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	name: text("name").notNull(),
	type: text("type", {
		enum: [
			"daily_check",
			"daily_number",
			"daily_time",
			"weekly_count",
			"weekly_number",
		],
	}).notNull(),
	targetValue: real("target_value"), // 目標值（如：每週 3 次、體重 70 kg、時間 25.0 = 01:00）
	targetDirection: text("target_direction", {
		enum: ["gte", "lte"],
	}).default("gte"), // 目標方向：gte = 至少, lte = 不超過
	unit: text("unit"), // 單位（如：kg、次、km）
	category: text("category"), // 領域（如：技術、開源、健康）
	quarterId: text("quarter_id").references(() => quarters.id), // 所屬季度
	sortOrder: integer("sort_order").notNull().default(0), // 排序順序
	active: integer("active", { mode: "boolean" }).notNull().default(true),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const records = sqliteTable(
	"records",
	{
		id: text("id").primaryKey(),
		tacticId: text("tactic_id")
			.notNull()
			.references(() => tactics.id),
		date: text("date").notNull(), // YYYY-MM-DD 格式
		value: real("value").notNull(), // 數值（勾選為 1/0，數值為實際值）
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		uniqueIndex("records_tactic_date_idx").on(table.tacticId, table.date),
	],
);

export const weekTacticSelections = sqliteTable("week_tactic_selections", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	weekStart: text("week_start").notNull(), // YYYY-MM-DD 格式（週起始日）
	tacticIds: text("tactic_ids").notNull(), // JSON 陣列字串 ["id1","id2"]
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============ Guild Tables ============

export const guilds = sqliteTable("guilds", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	createdBy: text("created_by")
		.notNull()
		.references(() => users.id),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const groups = sqliteTable("groups", {
	id: text("id").primaryKey(),
	guildId: text("guild_id")
		.notNull()
		.references(() => guilds.id),
	name: text("name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const guildMembers = sqliteTable(
	"guild_members",
	{
		id: text("id").primaryKey(),
		guildId: text("guild_id")
			.notNull()
			.references(() => guilds.id),
		userId: text("user_id")
			.notNull()
			.references(() => users.id),
		groupId: text("group_id").references(() => groups.id), // 可選，成員所屬的 group
		role: text("role", { enum: ["admin", "member"] })
			.notNull()
			.default("member"),
		joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		uniqueIndex("guild_members_guild_user_idx").on(table.guildId, table.userId),
	],
);

export const guildInvites = sqliteTable(
	"guild_invites",
	{
		id: text("id").primaryKey(),
		guildId: text("guild_id")
			.notNull()
			.references(() => guilds.id),
		groupId: text("group_id").references(() => groups.id), // 可選，邀請加入特定 group
		code: text("code").notNull(),
		createdBy: text("created_by")
			.notNull()
			.references(() => users.id),
		expiresAt: integer("expires_at", { mode: "timestamp" }), // 可選，到期時間
		maxUses: integer("max_uses"), // 可選，最大使用次數
		usedCount: integer("used_count").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [uniqueIndex("guild_invites_code_idx").on(table.code)],
);

// ============ Share Tables ============

export const publicShares = sqliteTable("public_shares", {
	id: text("id").primaryKey(), // 10-char alphanumeric
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	data: text("data").notNull(), // JSON ShareData
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
