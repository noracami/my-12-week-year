// 戰術類型
export type TacticType =
	| "daily_check"
	| "daily_number"
	| "daily_time"
	| "weekly_count"
	| "weekly_number";

// 目標方向
export type TargetDirection = "gte" | "lte"; // gte = 至少, lte = 不超過

// 戰術
export interface Tactic {
	id: string;
	userId: string;
	name: string;
	type: TacticType;
	targetValue: number | null;
	targetDirection: TargetDirection | null;
	unit: string | null;
	category: string | null;
	quarterId: string | null;
	sortOrder: number;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

// 記錄
export interface Record {
	id: string;
	tacticId: string;
	date: string; // YYYY-MM-DD
	value: number;
	createdAt: string;
	updatedAt: string;
	tactic?: Tactic;
}

// 週得分詳情
export interface ScoreDetail {
	tacticId: string;
	tacticName: string;
	type: TacticType;
	category: string | null;
	target: number;
	current: number;
	achieved: boolean;
	unit: string | null;
	dailyStatus: boolean[] | null; // 每日達成狀態（僅每日類型有）
	dailyValues: number[] | null; // 每日數值（僅 weekly_number 有）
}

// API 請求參數
export interface CreateTacticParams {
	name: string;
	type: TacticType;
	targetValue?: number;
	targetDirection?: TargetDirection;
	unit?: string;
	category?: string;
	quarterId?: string | null;
}

export interface UpdateTacticParams extends Partial<CreateTacticParams> {
	active?: boolean;
}

export interface CreateRecordParams {
	tacticId: string;
	date: string;
	value: number;
}

export interface GetRecordsParams {
	startDate?: string;
	endDate?: string;
	tacticId?: string;
}

export interface GetScoreParams {
	startDate: string;
	endDate: string;
}

// 週策略選擇
export interface WeekTacticSelection {
	weekStart: string;
	tacticIds: string[];
	isCustom: boolean; // 是否為自訂（false 表示沿用上週）
}

export interface UpdateWeekSelectionParams {
	weekStart: string;
	tacticIds: string[];
}

// 季度狀態
export type QuarterStatus = "planning" | "active" | "completed";

// 季度目標
export interface QuarterGoal {
	title: string;
	description?: string;
}

// 季度
export interface Quarter {
	id: string;
	userId: string;
	name: string;
	startDate: string;
	endDate: string;
	goals: string | null; // JSON string of QuarterGoal[]
	reviewNotes: string | null;
	status: QuarterStatus;
	createdAt: string;
	updatedAt: string;
}

// 季度詳情（含關聯策略）
export interface QuarterWithTactics extends Quarter {
	tactics: Tactic[];
}

// 當前季度資訊
export interface ActiveQuarterInfo {
	quarter: Quarter | null;
	weekNumber: number | null;
	daysRemaining: number | null;
}

// 季度 API 請求參數
export interface CreateQuarterParams {
	name: string;
	startDate: string;
	goals?: QuarterGoal[];
}

export interface UpdateQuarterParams {
	name?: string;
	startDate?: string;
	goals?: QuarterGoal[];
	reviewNotes?: string | null;
	status?: QuarterStatus;
}

// ============ Guild 相關類型 ============

// 角色
export type GuildRole = "admin" | "member";

// Guild
export interface Guild {
	id: string;
	name: string;
	description: string | null;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	role: GuildRole; // 當前用戶在此 guild 的角色
	joinedAt: string;
	memberCount?: number;
	groups?: Group[];
}

// Group
export interface Group {
	id: string;
	guildId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

// Guild 成員
export interface GuildMember {
	id: string;
	userId: string;
	groupId: string | null;
	role: GuildRole;
	joinedAt: string;
	userName: string;
	userImage: string | null;
}

// Guild 邀請
export interface GuildInvite {
	id: string;
	guildId: string;
	groupId: string | null;
	code: string;
	createdBy: string;
	expiresAt: string | null;
	maxUses: number | null;
	usedCount: number;
	createdAt: string;
}

// 邀請資訊（公開）
export interface InviteInfo {
	invite: {
		code: string;
		guildId: string;
		groupId: string | null;
	};
	guild: {
		id: string;
		name: string;
		description: string | null;
	};
}

// Guild API 請求參數
export interface CreateGuildParams {
	name: string;
	description?: string;
}

export interface UpdateGuildParams {
	name?: string;
	description?: string | null;
}

export interface CreateGroupParams {
	name: string;
}

export interface UpdateGroupParams {
	name?: string;
}

export interface UpdateMemberParams {
	role?: GuildRole;
	groupId?: string | null;
}

export interface CreateInviteParams {
	groupId?: string;
	expiresInDays?: number;
	maxUses?: number;
}

// 成員得分（複用 ScoreDetail）
export interface MemberScoreResponse {
	user: {
		name: string;
		image: string | null;
	};
	score: number;
	details: ScoreDetail[];
}

// ============ Share 相關類型 ============

// 公開分享
export interface PublicShare {
	id: string;
	data: import("../lib/share").ShareData;
	createdAt: string;
	isPublic: true;
}

// 建立公開分享的請求參數
export interface CreatePublicShareParams {
	data: import("../lib/share").ShareData;
}

// 建立公開分享的回應
export interface CreatePublicShareResponse {
	id: string;
	url: string;
	createdAt: string;
	updatedAt: string;
	isUpdate: boolean; // true = 更新現有分享, false = 新建分享
}

// 表情回應
export interface ShareReaction {
	count: number;
	reacted: boolean;
}

// 分享的表情回應（所有 emoji）
export interface ShareReactions {
	[emoji: string]: ShareReaction;
}

// 表情回應 API 回應
export interface ShareReactionsResponse {
	reactions: ShareReactions;
}

// ============ Comment 相關類型 ============

// 匿名身份
export interface AnonymousId {
	emoji: string;
	name: string;
}

// 留言（已登入用戶看到的）
export interface ShareComment {
	id: string;
	shareId: string;
	userId: string;
	userName: string;
	userImage: string | null;
	content: string;
	hidden: boolean;
	createdAt: string;
	updatedAt: string;
	isOwn: boolean;
}

// 匿名留言（未登入用戶看到的）
export interface AnonymousShareComment {
	id: string;
	shareId: string;
	anonymousId: AnonymousId;
	content: string;
	hidden: boolean;
	createdAt: string;
	updatedAt: string;
}

// 留言 API 回應
export interface ShareCommentsResponse {
	comments: ShareComment[] | AnonymousShareComment[];
	isAnonymized: boolean;
}

// 分享統計
export interface ShareStats {
	reactionCount: number;
	commentCount: number;
}

// 我的分享（含統計）
export interface MyShare {
	id: string;
	period: string;
	startDate: string;
	endDate: string;
	createdAt: string;
	updatedAt: string;
	stats: ShareStats;
}

// 我的分享列表回應
export interface MySharesResponse {
	shares: MyShare[];
}
