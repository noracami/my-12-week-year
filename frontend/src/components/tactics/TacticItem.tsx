import type { Tactic } from "../../api/types";
import { cn } from "../../lib/cn";

interface TacticItemProps {
	tactic: Tactic;
	onEdit: (tactic: Tactic) => void;
	onDelete: (id: string) => void;
	onToggleActive: (tactic: Tactic) => void;
}

const typeLabels: Record<string, string> = {
	daily_check: "每日勾選",
	daily_number: "每日數值",
	weekly_count: "每週次數",
	weekly_number: "每週數值",
};

export function TacticItem({
	tactic,
	onEdit,
	onDelete,
	onToggleActive,
}: TacticItemProps) {
	return (
		<div
			className={cn(
				"bg-gray-800 rounded-lg p-4 flex items-center gap-4",
				!tactic.active && "opacity-50",
			)}
		>
			{/* 啟用/停用切換 */}
			<button
				type="button"
				onClick={() => onToggleActive(tactic)}
				className={cn(
					"w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors",
					tactic.active
						? "bg-green-500 border-green-500"
						: "bg-transparent border-gray-500",
				)}
				aria-label={tactic.active ? "停用" : "啟用"}
			>
				{tactic.active && (
					<svg
						className="w-full h-full text-white p-0.5"
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
				className="flex-1 min-w-0 text-left"
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
					{tactic.targetValue && (
						<>
							<span>·</span>
							<span>
								{tactic.targetValue} {tactic.unit}
							</span>
						</>
					)}
				</div>
			</button>

			{/* 刪除按鈕 */}
			<button
				type="button"
				onClick={() => onDelete(tactic.id)}
				className="p-2 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
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
