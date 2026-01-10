const STORAGE_KEY = "my-12-week-year-share-read-status";

interface ReadStatus {
	[shareId: string]: {
		lastReadAt: string;
		commentCount: number;
		reactionCount: number;
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

export function markAsRead(
	shareId: string,
	commentCount: number,
	reactionCount: number,
): void {
	const status = getReadStatus();
	status[shareId] = {
		lastReadAt: new Date().toISOString(),
		commentCount,
		reactionCount,
	};
	localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

export function hasUnread(
	shareId: string,
	currentCommentCount: number,
	currentReactionCount: number,
): boolean {
	const status = getReadStatus();
	const read = status[shareId];

	if (!read) {
		// 從未讀過，如果有任何互動就算未讀
		return currentCommentCount > 0 || currentReactionCount > 0;
	}

	// 比較當前數量與上次讀取時的數量
	return (
		currentCommentCount > read.commentCount ||
		currentReactionCount > read.reactionCount
	);
}

export function getUnreadCount(
	shareId: string,
	currentCommentCount: number,
	currentReactionCount: number,
): { comments: number; reactions: number } {
	const status = getReadStatus();
	const read = status[shareId];

	if (!read) {
		return {
			comments: currentCommentCount,
			reactions: currentReactionCount,
		};
	}

	return {
		comments: Math.max(0, currentCommentCount - read.commentCount),
		reactions: Math.max(0, currentReactionCount - read.reactionCount),
	};
}
