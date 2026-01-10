const STORAGE_KEY = "my-12-week-year-share-read-status";

interface ReadStatus {
	[shareId: string]: {
		lastReadAt: string;
		commentCount: number;
	};
}

export function getReadStatus(): ReadStatus {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

export function markAsRead(shareId: string, commentCount: number): void {
	const status = getReadStatus();
	status[shareId] = {
		lastReadAt: new Date().toISOString(),
		commentCount,
	};
	localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

export function hasUnreadComments(
	shareId: string,
	currentCommentCount: number,
): boolean {
	const status = getReadStatus();
	const read = status[shareId];

	if (!read) {
		// 從未讀過，有留言就算未讀
		return currentCommentCount > 0;
	}

	// 比較當前留言數與上次讀取時的數量
	return currentCommentCount > read.commentCount;
}

export function getUnreadCommentCount(
	shareId: string,
	currentCommentCount: number,
): number {
	const status = getReadStatus();
	const read = status[shareId];

	if (!read) {
		return currentCommentCount;
	}

	return Math.max(0, currentCommentCount - read.commentCount);
}
