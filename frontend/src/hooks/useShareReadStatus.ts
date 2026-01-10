import { useCallback, useEffect, useState } from "react";
import {
	getUnreadCommentCount,
	hasUnreadComments,
	markAsRead,
} from "../lib/shareReadStatus";

export function useShareReadStatus(shareId: string, commentCount: number) {
	const [hasUnread, setHasUnread] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		setHasUnread(hasUnreadComments(shareId, commentCount));
		setUnreadCount(getUnreadCommentCount(shareId, commentCount));
	}, [shareId, commentCount]);

	const markRead = useCallback(() => {
		markAsRead(shareId, commentCount);
		setHasUnread(false);
		setUnreadCount(0);
	}, [shareId, commentCount]);

	return {
		hasUnread,
		unreadCount,
		markRead,
	};
}
