import type { TacticType } from "../api/types";

// 分享資料結構
export interface ShareTactic {
	name: string;
	type: TacticType;
	target: number;
	current: number;
	achieved: boolean;
	category?: string;
}

export interface ShareData {
	v: 1; // 版本號，用於未來相容
	period: "week" | "4week";
	range: {
		start: string; // YYYY-MM-DD
		end: string; // YYYY-MM-DD
	};
	score: number;
	tactics: ShareTactic[];
	generatedAt: string; // ISO timestamp
}

/**
 * 將分享資料編碼為 URL-safe base64 字串
 */
export function encodeShareData(data: ShareData): string {
	const json = JSON.stringify(data);
	// 使用 base64url 編碼（URL 安全）
	return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * 從 URL hash 解碼分享資料
 */
export function decodeShareData(hash: string): ShareData | null {
	try {
		// 還原 base64 填充和字符
		let base64 = hash.replace(/-/g, "+").replace(/_/g, "/");
		// 補齊 padding
		while (base64.length % 4) {
			base64 += "=";
		}
		const json = atob(base64);
		const data = JSON.parse(json);

		// 驗證版本和結構
		if (data.v !== 1) {
			console.warn("Unsupported share data version:", data.v);
			return null;
		}

		// 基本結構驗證
		if (
			!data.period ||
			!data.range?.start ||
			!data.range?.end ||
			typeof data.score !== "number" ||
			!Array.isArray(data.tactics)
		) {
			console.warn("Invalid share data structure");
			return null;
		}

		return data as ShareData;
	} catch (error) {
		console.error("Failed to decode share data:", error);
		return null;
	}
}

/**
 * 產生分享 URL
 */
export function generateShareUrl(data: ShareData): string {
	const encoded = encodeShareData(data);
	return `${window.location.origin}/share#${encoded}`;
}

/**
 * 格式化日期區間顯示
 */
export function formatShareRange(start: string, end: string): string {
	const startParts = start.split("-");
	const endParts = end.split("-");
	return `${Number.parseInt(startParts[1], 10)}/${Number.parseInt(startParts[2], 10)} - ${Number.parseInt(endParts[1], 10)}/${Number.parseInt(endParts[2], 10)}`;
}
