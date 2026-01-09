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
