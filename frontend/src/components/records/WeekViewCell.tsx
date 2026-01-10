import type { Tactic } from "../../api/types";
import { cn } from "../../lib/cn";

interface WeekViewCellProps {
	tactic: Tactic;
	value: number | null;
	isToday: boolean;
	onChange: (value: number) => void;
	onOpenModal: () => void;
}

// 將時間數值轉為顯示格式 (HH:MM)
function formatTimeValue(value: number): string {
	const hours = Math.floor(value);
	const minutes = Math.round((value - hours) * 60);
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function WeekViewCell({
	tactic,
	value,
	isToday,
	onChange,
	onOpenModal,
}: WeekViewCellProps) {
	const isCheckType =
		tactic.type === "daily_check" || tactic.type === "weekly_count";
	const isChecked = value === 1;

	const handleClick = () => {
		if (isCheckType) {
			// Check types: toggle directly
			onChange(isChecked ? 0 : 1);
		} else {
			// Number/Time types: open modal
			onOpenModal();
		}
	};

	// Render cell content based on type
	const renderContent = () => {
		if (isCheckType) {
			// Check types: show checkmark when checked
			if (isChecked) {
				return (
					<svg
						className="w-5 h-5 text-white"
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
				);
			}
			return null;
		}

		// Number/Time types: show value
		if (value === null || value === 0) {
			return <span className="text-gray-600">-</span>;
		}

		if (tactic.type === "daily_time") {
			return (
				<span className="text-xs text-white font-medium">
					{formatTimeValue(value)}
				</span>
			);
		}

		// daily_number, weekly_number
		return <span className="text-sm text-white font-medium">{value}</span>;
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				// Mobile: compact / Desktop: larger with better shape
				"w-11 h-11 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center transition-all cursor-pointer",
				// Today highlight
				isToday && "ring-2 ring-indigo-500",
				// Check type styling
				isCheckType &&
					(isChecked
						? "bg-green-500 hover:bg-green-400"
						: "bg-gray-700 hover:bg-gray-600"),
				// Number/Time type styling
				!isCheckType &&
					(value && value > 0
						? "bg-indigo-600 hover:bg-indigo-500"
						: "bg-gray-700 hover:bg-gray-600"),
			)}
		>
			{renderContent()}
		</button>
	);
}
