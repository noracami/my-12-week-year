import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { ShareStats } from "../../api/types";
import { useShareReadStatus } from "../../hooks/useShareReadStatus";

const REACTION_EMOJIS = ["👍", "❤️", "🔥", "👏", "💪", "🎉"];

interface ShareBadgeProps {
	shareId: string;
	stats: ShareStats;
}

export function ShareBadge({ shareId, stats }: ShareBadgeProps) {
	const { hasUnread } = useShareReadStatus(shareId, stats.commentCount);

	// 隨機選擇一個表情 emoji（基於 shareId 保持一致性）
	const randomEmoji = useMemo(() => {
		let hash = 0;
		for (let i = 0; i < shareId.length; i++) {
			hash = (hash << 5) - hash + shareId.charCodeAt(i);
			hash = hash & hash;
		}
		return REACTION_EMOJIS[Math.abs(hash) % REACTION_EMOJIS.length];
	}, [shareId]);

	const hasReactions = stats.reactionCount > 0;
	const hasComments = stats.commentCount > 0;

	return (
		<Link
			to={`/share/${shareId}`}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 transition-colors"
		>
			{/* 表情：顯示隨機 emoji + 總數 */}
			{hasReactions && (
				<span className="inline-flex items-center gap-0.5">
					<span>{randomEmoji}</span>
					<span>{stats.reactionCount}</span>
				</span>
			)}

			{/* 留言：顯示 💬 + 數量 */}
			{hasComments && (
				<span className="inline-flex items-center gap-0.5">
					<span>💬</span>
					<span>{stats.commentCount}</span>
				</span>
			)}

			{/* 未讀留言：顯示 new */}
			{hasUnread && (
				<span className="px-1 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded">
					new
				</span>
			)}

			{/* 無表情無留言：僅顯示連結圖示 */}
			{!hasReactions && !hasComments && (
				<span className="text-gray-500">
					<svg
						className="w-3.5 h-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</span>
			)}
		</Link>
	);
}
