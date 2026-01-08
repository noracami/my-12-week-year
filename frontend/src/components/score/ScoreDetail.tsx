import type { ScoreDetail as ScoreDetailType } from "../../api/types";
import { cn } from "../../lib/cn";

interface ScoreDetailProps {
	detail: ScoreDetailType;
	weekStartDate?: string; // YYYY-MM-DD 格式，用於顯示日期
	showDates?: boolean;
}

const typeLabels: Record<string, string> = {
	daily_check: "每日",
	daily_number: "每日",
	weekly_count: "每週",
	weekly_number: "每週",
};

// 生成一週的日期數字
function getWeekDates(startDate: string): number[] {
	const start = new Date(startDate);
	const dates: number[] = [];
	for (let i = 0; i < 7; i++) {
		const date = new Date(start);
		date.setDate(start.getDate() + i);
		dates.push(date.getDate());
	}
	return dates;
}

export function ScoreDetail({
	detail,
	weekStartDate,
	showDates,
}: ScoreDetailProps) {
	const progress =
		detail.target > 0
			? Math.min(100, (detail.current / detail.target) * 100)
			: 0;

	const weekDates = weekStartDate ? getWeekDates(weekStartDate) : null;

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

			{/* 每日格子視圖（僅每日類型顯示） */}
			{detail.dailyStatus && (
				<div className="space-y-1 mb-2">
					{/* 日期標籤 */}
					{showDates && weekDates && (
						<div className="flex gap-1">
							{weekDates.map((date, index) => (
								<div
									key={`date-${detail.tacticId}-${index}`}
									className="flex-1 text-center text-xs text-gray-500"
								>
									{date}
								</div>
							))}
						</div>
					)}
					{/* 達成格子 */}
					<div className="flex gap-1">
						{detail.dailyStatus.map((completed, index) => (
							<div
								key={`day-${detail.tacticId}-${index}`}
								className={cn(
									"flex-1 h-6 rounded",
									completed ? "bg-green-500" : "bg-gray-700",
								)}
								title={`${weekDates ? `${weekDates[index]}日` : `第 ${index + 1} 天`}${completed ? "：已完成" : "：未完成"}`}
							/>
						))}
					</div>
				</div>
			)}

			{/* 進度條（非每日類型顯示） */}
			{!detail.dailyStatus && (
				<div className="h-2 bg-gray-700 rounded-full overflow-hidden">
					<div
						className={cn(
							"h-full transition-all duration-300 rounded-full",
							detail.achieved ? "bg-green-500" : "bg-indigo-500",
						)}
						style={{ width: `${progress}%` }}
					/>
				</div>
			)}

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
