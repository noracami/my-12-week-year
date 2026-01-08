import { cn } from "../../lib/cn";
import {
	addDays,
	formatDisplayDate,
	getToday,
	getWeekdayName,
	isToday,
} from "../../lib/date";

interface DatePickerProps {
	value: string;
	onChange: (date: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
	const handlePrev = () => {
		onChange(addDays(value, -1));
	};

	const handleNext = () => {
		onChange(addDays(value, 1));
	};

	const handleToday = () => {
		onChange(getToday());
	};

	const isTodaySelected = isToday(value);

	return (
		<div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
			<button
				type="button"
				onClick={handlePrev}
				className="p-2 text-gray-400 hover:text-white transition-colors"
				aria-label="前一天"
			>
				<svg
					className="w-6 h-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>

			<button
				type="button"
				onClick={handleToday}
				className={cn(
					"flex flex-col items-center px-4 py-1 rounded-lg transition-colors",
					isTodaySelected
						? "bg-indigo-600 text-white"
						: "hover:bg-gray-700 text-gray-300",
				)}
			>
				<span className="text-lg font-bold">{formatDisplayDate(value)}</span>
				<span className="text-xs">
					{isTodaySelected ? "今天" : `週${getWeekdayName(value)}`}
				</span>
			</button>

			<button
				type="button"
				onClick={handleNext}
				disabled={isTodaySelected}
				className={cn(
					"p-2 transition-colors",
					isTodaySelected
						? "text-gray-600 cursor-not-allowed"
						: "text-gray-400 hover:text-white",
				)}
				aria-label="下一天"
			>
				<svg
					className="w-6 h-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</button>
		</div>
	);
}
