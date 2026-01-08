import type { Tactic } from "../../api/types";
import { cn } from "../../lib/cn";

interface TacticItemProps {
	tactic: Tactic;
	isSelected: boolean;
	onEdit: (tactic: Tactic) => void;
	onDelete: (id: string) => void;
	onToggleActive: (tactic: Tactic) => void;
	onToggleWeekSelection: (tacticId: string) => void;
}

const typeLabels: Record<string, string> = {
	daily_check: "每日勾選",
	daily_number: "每日數值",
	daily_time: "每日時間",
	weekly_count: "每週次數",
	weekly_number: "每週數值",
};

const directionLabels: Record<string, string> = {
	gte: "至少",
	lte: "不超過",
};

// 將時間數值轉為顯示格式
function formatTimeValue(value: number): string {
	const hours = Math.floor(value);
	const minutes = Math.round((value - hours) * 60);
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function TacticItem({
	tactic,
	isSelected,
	onEdit,
	onDelete,
	onToggleActive,
	onToggleWeekSelection,
}: TacticItemProps) {
	return (
		<div
			className={cn(
				"bg-gray-800 rounded-lg p-4 flex items-center gap-4",
				!tactic.active && "opacity-50",
			)}
		>
			{/* 週選擇勾選框 */}
			<button
				type="button"
				onClick={() => tactic.active && onToggleWeekSelection(tactic.id)}
				disabled={!tactic.active}
				className={cn(
					"w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
					tactic.active
						? isSelected
							? "bg-indigo-600 border-indigo-600 cursor-pointer"
							: "bg-transparent border-gray-500 hover:border-gray-400 cursor-pointer"
						: "bg-transparent border-gray-600 cursor-not-allowed",
				)}
				aria-label={isSelected ? "取消本週計分" : "加入本週計分"}
			>
				{isSelected && (
					<svg
						className="w-4 h-4 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={3}
							d="M5 13l4 4L19 7"
						/>
					</svg>
				)}
			</button>

			{/* 主要內容 */}
			<button
				type="button"
				onClick={() => onEdit(tactic)}
				className="flex-1 min-w-0 text-left cursor-pointer"
			>
				<div className="flex items-center gap-2">
					<span className="text-white font-medium truncate">{tactic.name}</span>
					{tactic.category && (
						<span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full flex-shrink-0">
							{tactic.category}
						</span>
					)}
				</div>
				<div className="text-sm text-gray-400 flex items-center gap-2">
					<span>{typeLabels[tactic.type]}</span>
					{tactic.targetValue != null && tactic.type !== "daily_check" && (
						<>
							<span>·</span>
							<span>
								{directionLabels[tactic.targetDirection || "gte"]}{" "}
								{tactic.type === "daily_time"
									? formatTimeValue(tactic.targetValue)
									: `${tactic.targetValue} ${tactic.unit || ""}`}
							</span>
						</>
					)}
				</div>
			</button>

			{/* 啟用/停用切換 */}
			<button
				type="button"
				onClick={() => onToggleActive(tactic)}
				className={cn(
					"p-2 transition-colors flex-shrink-0 cursor-pointer",
					tactic.active
						? "text-green-400 hover:text-green-300"
						: "text-gray-500 hover:text-gray-400",
				)}
				aria-label={tactic.active ? "停用策略" : "啟用策略"}
				title={tactic.active ? "停用策略" : "啟用策略"}
			>
				<svg
					className="w-5 h-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					{tactic.active ? (
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						/>
					) : (
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
						/>
					)}
				</svg>
			</button>

			{/* 刪除按鈕 */}
			<button
				type="button"
				onClick={() => onDelete(tactic.id)}
				className="p-2 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 cursor-pointer"
				aria-label="刪除"
			>
				<svg
					className="w-5 h-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			</button>
		</div>
	);
}
