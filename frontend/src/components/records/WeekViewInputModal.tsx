import type { Tactic } from "../../api/types";
import { Dialog } from "../ui/Dialog";
import { NumberInput } from "../ui/NumberInput";
import { TimeSlider } from "../ui/TimeSlider";

interface WeekViewInputModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tactic: Tactic | null;
	date: string;
	dateLabel: string; // e.g., "週一 1/6"
	value: number | null;
	onSubmit: (value: number) => void;
}

const directionLabels: Record<string, string> = {
	gte: "至少",
	lte: "不超過",
};

export function WeekViewInputModal({
	open,
	onOpenChange,
	tactic,
	dateLabel,
	value,
	onSubmit,
}: WeekViewInputModalProps) {
	if (!tactic) return null;

	const handleChange = (newValue: number | null) => {
		onSubmit(newValue ?? 0);
	};

	const title = `${tactic.name} - ${dateLabel}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange} title={title}>
			<div className="space-y-4">
				{/* 目標顯示 */}
				{tactic.targetValue && (
					<div className="text-sm text-gray-400">
						目標: {directionLabels[tactic.targetDirection || "gte"]}{" "}
						{tactic.type === "daily_time"
							? formatTimeValue(tactic.targetValue)
							: `${tactic.targetValue} ${tactic.unit || ""}`}
					</div>
				)}

				{/* 輸入控制項 */}
				<div className="flex justify-center py-4">
					{tactic.type === "daily_time" ? (
						<TimeSlider value={value} onChange={handleChange} />
					) : (
						<NumberInput
							value={value}
							onChange={handleChange}
							min={0}
							step={tactic.type === "daily_number" ? 0.5 : 1}
							unit={tactic.unit}
						/>
					)}
				</div>
			</div>
		</Dialog>
	);
}

// 將時間數值轉為顯示格式 (HH:MM)
function formatTimeValue(value: number): string {
	const hours = Math.floor(value);
	const minutes = Math.round((value - hours) * 60);
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
