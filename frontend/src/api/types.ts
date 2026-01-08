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
	target: number;
	current: number;
	achieved: boolean;
	unit: string | null;
	dailyStatus: boolean[] | null; // 每日達成狀態（僅每日類型有）
}

// API 請求參數
export interface CreateTacticParams {
	name: string;
	type: TacticType;
	targetValue?: number;
	targetDirection?: TargetDirection;
	unit?: string;
	category?: string;
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
