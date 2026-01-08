import type { ScoreDetail as ScoreDetailType } from "../../api/types";
import { cn } from "../../lib/cn";

interface ScoreDetailProps {
	detail: ScoreDetailType;
}

const typeLabels: Record<string, string> = {
	daily_check: "每日",
	daily_number: "每日",
	weekly_count: "每週",
	weekly_number: "每週",
};

export function ScoreDetail({ detail }: ScoreDetailProps) {
	const progress =
		detail.target > 0
			? Math.min(100, (detail.current / detail.target) * 100)
			: 0;

	return (
		<div className="bg-gray-800 rounded-lg p-4">
			<div className="flex items-center justify-between mb-2">
				<div className="flex-1 min-w-0">
					<span className="text-white font-medium truncate block">
						{detail.tacticName}
					</span>
					<span className="text-xs text-gray-500">
						{typeLabels[detail.type]}
					</span>
				</div>
				<div className="text-right flex-shrink-0 ml-4">
					<span
						className={cn(
							"text-lg font-bold",
							detail.achieved ? "text-green-400" : "text-gray-300",
						)}
					>
						{detail.current}
					</span>
					<span className="text-gray-500 text-sm">
						{" / "}
						{detail.target} {detail.unit}
					</span>
				</div>
			</div>

			{/* 進度條 */}
			<div className="h-2 bg-gray-700 rounded-full overflow-hidden">
				<div
					className={cn(
						"h-full transition-all duration-300 rounded-full",
						detail.achieved ? "bg-green-500" : "bg-indigo-500",
					)}
					style={{ width: `${progress}%` }}
				/>
			</div>

			{/* 達成標記 */}
			{detail.achieved && (
				<div className="mt-2 flex items-center gap-1 text-green-400 text-sm">
					<svg
						className="w-4 h-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>已達成</span>
				</div>
			)}
		</div>
	);
}
