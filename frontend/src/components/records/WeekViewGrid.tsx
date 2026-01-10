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

	// Mobile: 計算讓 viewport 顯示 4.5 天的格子寬度
	// 公式: (100vw - 策略欄96px - 左右padding32px) / 4.5
	// sticky 用負 margin 延伸背景但不影響 flex 佈局
	// sticky-extend 要 1.5 倍格子寬度確保完全覆蓋
	const mobileGridStyle = {
		"--tactic-col": "96px",
		"--day-cell-width": "calc((100vw - 96px - 32px) / 4.5)",
		"--sticky-extend": "calc((100vw - 96px - 32px) / 3)",
	} as React.CSSProperties;

	return (
		<>
			{/* Mobile: 橫向捲動顯示4.5天 / Desktop: 置中滿版 */}
			<div
				className="overflow-x-auto -mx-4 px-4 md:overflow-visible md:mx-0 md:px-0 scrollbar-hide"
				style={mobileGridStyle}
			>
				<div className="inline-block md:block md:w-full">
					{/* 表頭 */}
					<div className="flex md:grid md:grid-cols-[minmax(120px,1fr)_repeat(7,minmax(56px,1fr))] md:gap-1">
						{/* 策略名稱欄（空白 header，用負 margin 延伸背景但不影響佈局） */}
						<div className="sticky left-0 z-10 bg-gray-900 w-[calc(var(--tactic-col)+16px+var(--sticky-extend))] mr-[calc(var(--sticky-extend)*-1)] pl-4 -ml-4 flex-shrink-0 h-10 md:static md:w-auto md:bg-transparent md:pl-0 md:ml-0 md:mr-0 md:h-auto" />
						{/* 日期欄 */}
						{weekDays.map((day) => (
							<div
								key={day}
								className={cn(
									"w-[var(--day-cell-width)] flex-shrink-0 text-center py-2 md:w-auto md:py-3",
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
								className="flex items-center md:grid md:grid-cols-[minmax(120px,1fr)_repeat(7,minmax(56px,1fr))] md:gap-1 md:bg-gray-800/50 md:rounded-xl md:p-2"
							>
								{/* 策略名稱（sticky on mobile，用負 margin 延伸背景但不影響佈局） */}
								<div className="sticky left-0 z-10 bg-gray-900 w-[calc(var(--tactic-col)+16px+var(--sticky-extend))] mr-[calc(var(--sticky-extend)*-1)] pl-4 -ml-4 pr-2 flex-shrink-0 self-stretch flex items-center md:static md:w-auto md:bg-transparent md:pl-0 md:ml-0 md:mr-0 md:pr-0 md:overflow-hidden">
									<div className="min-w-0 w-[var(--tactic-col)] md:w-auto">
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
											"w-[var(--day-cell-width)] flex-shrink-0 flex justify-center p-0.5 md:w-auto md:p-1",
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
