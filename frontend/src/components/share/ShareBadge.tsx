import { Link } from "react-router-dom";
import type { ShareStats } from "../../api/types";
import { useShareReadStatus } from "../../hooks/useShareReadStatus";

interface ShareBadgeProps {
	shareId: string;
	stats: ShareStats;
}

export function ShareBadge({ shareId, stats }: ShareBadgeProps) {
	const { hasUnread } = useShareReadStatus(
		shareId,
		stats.commentCount,
		stats.reactionCount,
	);

	const totalCount = stats.reactionCount + stats.commentCount;

	return (
		<Link
			to={`/share/${shareId}`}
			className="relative inline-flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 transition-colors"
		>
			{/* 未讀紅點 */}
			{hasUnread && (
				<span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
			)}

			{/* 表情 icon */}
			<span>💬</span>

			{/* 數字（0 不顯示） */}
			{totalCount > 0 && <span>{totalCount}</span>}
		</Link>
	);
}
