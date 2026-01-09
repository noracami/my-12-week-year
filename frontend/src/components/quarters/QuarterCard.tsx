import type { Quarter, QuarterGoal, QuarterStatus } from "../../api/types";
import { cn } from "../../lib/cn";

interface QuarterCardProps {
	quarter: Quarter;
	goals: QuarterGoal[];
	onEdit: () => void;
	onDelete: () => void;
	onStatusChange: (status: QuarterStatus) => void;
}

const statusLabels: Record<QuarterStatus, string> = {
	planning: "規劃中",
	active: "進行中",
	completed: "已完成",
};

const statusColors: Record<QuarterStatus, string> = {
	planning: "bg-yellow-500/20 text-yellow-400",
	active: "bg-green-500/20 text-green-400",
	completed: "bg-gray-500/20 text-gray-400",
};

export function QuarterCard({
	quarter,
	goals,
	onEdit,
	onDelete,
	onStatusChange,
}: QuarterCardProps) {
	// 計算進度
	const today = new Date().toISOString().split("T")[0];
	const isActive = quarter.startDate <= today && quarter.endDate >= today;
	const isPast = quarter.endDate < today;
	const isFuture = quarter.startDate > today;

	let weekNumber = 0;
	let progress = 0;
	if (isActive) {
		const start = new Date(quarter.startDate);
		const now = new Date(today);
		const daysDiff = Math.floor(
			(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
		);
		weekNumber = Math.floor(daysDiff / 7) + 1;
		progress = Math.min(100, Math.round((daysDiff / 84) * 100));
	} else if (isPast) {
		weekNumber = 12;
		progress = 100;
	}

	return (
		<div className="bg-gray-800 rounded-lg p-4 space-y-3">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-medium text-white">{quarter.name}</h3>
					<p className="text-sm text-gray-400">
						{quarter.startDate} ~ {quarter.endDate}
					</p>
				</div>
				<span
					className={cn(
						"px-2 py-1 rounded text-xs font-medium",
						statusColors[quarter.status],
					)}
				>
					{statusLabels[quarter.status]}
				</span>
			</div>

			{/* Progress bar (only for active/past quarters) */}
			{(isActive || isPast) && (
				<div className="space-y-1">
					<div className="flex justify-between text-xs text-gray-400">
						<span>第 {weekNumber} 週 / 12 週</span>
						<span>{progress}%</span>
					</div>
					<div className="h-2 bg-gray-700 rounded-full overflow-hidden">
						<div
							className="h-full bg-indigo-500 transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			)}

			{/* Future indicator */}
			{isFuture && <div className="text-xs text-gray-500">尚未開始</div>}

			{/* Goals preview */}
			{goals.length > 0 && (
				<div className="space-y-1">
					<p className="text-xs text-gray-500">目標</p>
					<ul className="text-sm text-gray-300 space-y-1">
						{goals.slice(0, 3).map((goal) => (
							<li key={goal.title} className="flex items-start gap-2">
								<span className="text-gray-500">•</span>
								<span>{goal.title}</span>
							</li>
						))}
						{goals.length > 3 && (
							<li className="text-gray-500 text-xs">
								還有 {goals.length - 3} 個目標...
							</li>
						)}
					</ul>
				</div>
			)}

			{/* Actions */}
			<div className="flex items-center justify-between pt-2 border-t border-gray-700">
				<div className="flex gap-2">
					{quarter.status === "planning" && (
						<button
							type="button"
							onClick={() => onStatusChange("active")}
							className="text-xs text-green-400 hover:text-green-300 cursor-pointer"
						>
							開始執行
						</button>
					)}
					{quarter.status === "active" && (
						<button
							type="button"
							onClick={() => onStatusChange("completed")}
							className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
						>
							標記完成
						</button>
					)}
					{quarter.status === "completed" && (
						<button
							type="button"
							onClick={() => onStatusChange("active")}
							className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer"
						>
							重新開啟
						</button>
					)}
				</div>
				<div className="flex gap-3">
					<button
						type="button"
						onClick={onEdit}
						className="text-sm text-gray-400 hover:text-white cursor-pointer"
					>
						編輯
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="text-sm text-red-400 hover:text-red-300 cursor-pointer"
					>
						刪除
					</button>
				</div>
			</div>
		</div>
	);
}
