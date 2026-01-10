import { useCallback, useEffect, useState } from "react";
import { getUnreadCount, hasUnread, markAsRead } from "../lib/shareReadStatus";

export function useShareReadStatus(
	shareId: string,
	commentCount: number,
	reactionCount: number,
) {
	const [unread, setUnread] = useState(false);
	const [unreadCounts, setUnreadCounts] = useState({
		comments: 0,
		reactions: 0,
	});

	useEffect(() => {
		setUnread(hasUnread(shareId, commentCount, reactionCount));
		setUnreadCounts(getUnreadCount(shareId, commentCount, reactionCount));
	}, [shareId, commentCount, reactionCount]);

	const markRead = useCallback(() => {
		markAsRead(shareId, commentCount, reactionCount);
		setUnread(false);
		setUnreadCounts({ comments: 0, reactions: 0 });
	}, [shareId, commentCount, reactionCount]);

	return {
		hasUnread: unread,
		unreadCounts,
		markRead,
	};
}
