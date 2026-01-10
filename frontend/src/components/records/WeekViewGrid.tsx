import { useState } from "react";
import type { Record, Tactic } from "../../api/types";
import { cn } from "../../lib/cn";
import {
	addDays,
	formatDisplayDate,
	getToday,
	getWeekdayName,
	parseDate,
} from "../../lib/date";
import { WeekViewCell } from "./WeekViewCell";
import { WeekViewInputModal } from "./WeekViewInputModal";

interface WeekViewGridProps {
	weekStart: string;
	tactics: Tactic[];
	records: Record[];
	onRecordChange: (tacticId: string, date: string, value: number) => void;
}

// 生成一週的日期
function getWeekDays(weekStart: string): string[] {
	const days: string[] = [];
	for (let i = 0; i < 7; i++) {
		days.push(addDays(weekStart, i));
	}
	return days;
}

// 格式化日期標籤（週幾 + 日期）
function formatDayLabel(dateStr: string): string {
	const weekday = getWeekdayName(dateStr);
	const date = parseDate(dateStr);
	return `${weekday} ${date.getDate()}`;
}

// 格式化完整日期標籤（用於 Modal）
function formatFullDayLabel(dateStr: string): string {
	const weekday = getWeekdayName(dateStr);
	return `週${weekday} ${formatDisplayDate(dateStr)}`;
}

export function WeekViewGrid({
	weekStart,
	tactics,
	records,
	onRecordChange,
}: WeekViewGridProps) {
	const [modalState, setModalState] = useState<{
		open: boolean;
		tactic: Tactic | null;
		date: string;
	}>({
		open: false,
		tactic: null,
		date: "",
	});

	const weekDays = getWeekDays(weekStart);
	const today = getToday();

	// 建立 record 查詢 map
	const recordMap = new Map<string, number>();
	for (const record of records) {
		const key = `${record.tacticId}-${record.date}`;
		recordMap.set(key, record.value);
	}

	const getRecordValue = (tacticId: string, date: string): number | null => {
		return recordMap.get(`${tacticId}-${date}`) ?? null;
	};

	const handleOpenModal = (tactic: Tactic, date: string) => {
		setModalState({ open: true, tactic, date });
	};

	const handleCloseModal = () => {
		setModalState({ open: false, tactic: null, date: "" });
	};

	const handleModalSubmit = (value: number) => {
		if (modalState.tactic) {
			onRecordChange(modalState.tactic.id, modalState.date, value);
		}
	};

	if (tactics.length === 0) {
		return (
			<div className="text-center py-8 text-gray-400">本週無選中的策略</div>
		);
	}

	// Mobile: 固定尺寸佈局
	// 策略欄 120px + 7天 × 48px = 456px 總寬度
	// 375px 手機可見約 4.5 天
	// 用 box-shadow 延伸遮蓋滑動中的格子
	const mobileGridStyle = {
		"--tactic-col": "120px",
		"--cell-size": "48px",
	} as React.CSSProperties;

	return (
		<>
			{/* Mobile: 橫向捲動 / Desktop: 置中滿版 */}
			<div
				className="overflow-x-auto scrollbar-hide md:overflow-visible"
				style={mobileGridStyle}
			>
				<div className="w-max md:w-full">
					{/* 表頭 */}
					<div className="flex md:grid md:grid-cols-[minmax(120px,1fr)_repeat(7,minmax(56px,1fr))] md:gap-1">
						{/* 策略名稱欄（空白 header，用 box-shadow 延伸遮蓋） */}
						<div className="sticky left-0 z-10 w-[var(--tactic-col)] h-10 flex-shrink-0 bg-gray-900 shadow-[48px_0_0_0_rgb(17,24,39)] md:static md:w-auto md:h-auto md:bg-transparent md:shadow-none" />
						{/* 日期欄 */}
						{weekDays.map((day) => (
							<div
								key={day}
								className={cn(
									"w-[var(--cell-size)] flex-shrink-0 text-center py-2 md:w-auto md:py-3",
									day === today &&
										"bg-indigo-900/30 rounded-t-lg md:rounded-xl",
								)}
							>
								<div
									className={cn(
										"text-xs md:text-sm",
										day === today
											? "text-indigo-300 font-medium"
											: "text-gray-500",
									)}
								>
									{formatDayLabel(day)}
								</div>
							</div>
						))}
					</div>

					{/* 策略列表 */}
					<div className="space-y-1 md:space-y-2">
						{tactics.map((tactic) => (
							<div
								key={tactic.id}
								className="flex items-stretch md:grid md:grid-cols-[minmax(120px,1fr)_repeat(7,minmax(56px,1fr))] md:gap-1 md:bg-gray-800/50 md:rounded-xl md:p-2"
							>
								{/* 策略名稱（sticky + box-shadow 遮蓋滑動中的格子） */}
								<div className="sticky left-0 z-10 w-[var(--tactic-col)] flex-shrink-0 flex items-center pr-2 bg-gray-900 shadow-[48px_0_0_0_rgb(17,24,39)] md:static md:w-auto md:pr-0 md:bg-transparent md:shadow-none md:overflow-hidden">
									<div className="min-w-0">
										<span className="text-sm md:text-base text-white line-clamp-2">
											{tactic.name}
										</span>
										{tactic.type !== "daily_check" &&
											tactic.type !== "weekly_count" && (
												<span className="text-xs text-gray-500 truncate block">
													{tactic.unit || ""}
												</span>
											)}
									</div>
								</div>
								{/* 日期格子 */}
								{weekDays.map((day) => (
									<div
										key={`${tactic.id}-${day}`}
										className={cn(
											"w-[var(--cell-size)] flex-shrink-0 flex justify-center p-0.5 md:w-auto md:p-1",
											day === today && "bg-indigo-900/30 md:rounded-xl",
										)}
									>
										<WeekViewCell
											tactic={tactic}
											value={getRecordValue(tactic.id, day)}
											isToday={day === today}
											onChange={(value) =>
												onRecordChange(tactic.id, day, value)
											}
											onOpenModal={() => handleOpenModal(tactic, day)}
										/>
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* 輸入 Modal */}
			<WeekViewInputModal
				open={modalState.open}
				onOpenChange={(open) => !open && handleCloseModal()}
				tactic={modalState.tactic}
				date={modalState.date}
				dateLabel={modalState.date ? formatFullDayLabel(modalState.date) : ""}
				value={
					modalState.tactic && modalState.date
						? getRecordValue(modalState.tactic.id, modalState.date)
						: null
				}
				onSubmit={handleModalSubmit}
			/>
		</>
	);
}
