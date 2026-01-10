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
 * 將 Uint8Array 轉為 base64url 字串
 */
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
	const binString = Array.from(bytes, (byte) =>
		String.fromCodePoint(byte),
	).join("");
	return btoa(binString)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/**
 * 將 base64url 字串轉為 Uint8Array
 */
function base64UrlToUint8Array(base64url: string): Uint8Array {
	// 還原 base64 標準字符
	let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
	// 補齊 padding
	while (base64.length % 4) {
		base64 += "=";
	}
	const binString = atob(base64);
	return Uint8Array.from(binString, (c) => c.codePointAt(0) ?? 0);
}

/**
 * 將分享資料編碼為 URL-safe base64 字串
 */
export function encodeShareData(data: ShareData): string {
	const json = JSON.stringify(data);
	const bytes = new TextEncoder().encode(json);
	return uint8ArrayToBase64Url(bytes);
}

/**
 * 從 URL hash 解碼分享資料
 */
export function decodeShareData(hash: string): ShareData | null {
	try {
		const bytes = base64UrlToUint8Array(hash);
		const json = new TextDecoder().decode(bytes);
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
 * 產生私人分享 URL（使用 URL hash 編碼）
 */
export function generateShareUrl(data: ShareData): string {
	const encoded = encodeShareData(data);
	return `${window.location.origin}/share#${encoded}`;
}

/**
 * 產生公開分享 URL（使用資料庫儲存的 ID）
 */
export function generatePublicShareUrl(shareId: string): string {
	return `${window.location.origin}/share/${shareId}`;
}

/**
 * 格式化日期區間顯示
 */
export function formatShareRange(start: string, end: string): string {
	const startParts = start.split("-");
	const endParts = end.split("-");
	return `${Number.parseInt(startParts[1], 10)}/${Number.parseInt(startParts[2], 10)} - ${Number.parseInt(endParts[1], 10)}/${Number.parseInt(endParts[2], 10)}`;
}
