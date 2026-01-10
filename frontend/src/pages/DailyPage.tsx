import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	usePrefetchAdjacentDays,
	useRecords,
	useUpsertRecord,
} from "../api/records";
import { useTactics } from "../api/tactics";
import { useWeekTacticSelection } from "../api/weekSelections";
import { CheckRecord } from "../components/records/CheckRecord";
import { DatePicker } from "../components/records/DatePicker";
import { NumberRecord } from "../components/records/NumberRecord";
import { TimeRecord } from "../components/records/TimeRecord";
import { WeekViewGrid } from "../components/records/WeekViewGrid";
import { useWeekRange } from "../hooks/useWeekRange";
import { getToday, getWeekEnd, getWeekStart } from "../lib/date";
import { useSettings } from "../lib/settings";

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

export function DailyPage() {
	const { settings } = useSettings();
	const isWeekView = settings.entryMode === "week";

	// 單日模式的狀態
	const [searchParams, setSearchParams] = useSearchParams();
	const selectedDate = searchParams.get("date") || getToday();

	const setSelectedDate = (date: string) => {
		if (date === getToday()) {
			setSearchParams({});
		} else {
			setSearchParams({ date });
		}
	};

	// 週視圖模式的狀態
	const weekRange = useWeekRange({ allowFutureWeeks: 1 });

	// 根據模式決定 weekStart
	const weekStart = isWeekView
		? weekRange.startDate
		: getWeekStart(selectedDate);
	const weekEnd = isWeekView ? weekRange.endDate : getWeekEnd(selectedDate);

	// 資料獲取
	const { data: tactics, isLoading: tacticsLoading } = useTactics();
	const { data: weekSelection, isLoading: weekSelectionLoading } =
		useWeekTacticSelection(weekStart);

	// 單日模式：只獲取當天
	// 週視圖模式：獲取整週
	const { data: records, isLoading: recordsLoading } = useRecords(
		isWeekView
			? { startDate: weekStart, endDate: weekEnd }
			: { startDate: selectedDate, endDate: selectedDate },
	);

	const upsertRecord = useUpsertRecord();

	// 預取相鄰日期（僅單日模式）
	const prefetchAdjacentDays = usePrefetchAdjacentDays(selectedDate);
	useEffect(() => {
		if (!isWeekView) {
			prefetchAdjacentDays();
		}
	}, [prefetchAdjacentDays, isWeekView]);

	// 該週選中的策略 ID
	const selectedTacticIds = new Set(weekSelection?.tacticIds ?? []);

	// 篩選出每日類型的戰術（只顯示該週選中的）
	const dailyTactics = tactics?.filter(
		(t) =>
			t.active &&
			selectedTacticIds.has(t.id) &&
			(t.type === "daily_check" ||
				t.type === "daily_number" ||
				t.type === "daily_time"),
	);

	// 每週類型的戰術（只顯示該週選中的）
	const weeklyTactics = tactics?.filter(
		(t) =>
			t.active &&
			selectedTacticIds.has(t.id) &&
			(t.type === "weekly_count" || t.type === "weekly_number"),
	);

	// 合併所有策略（週視圖用）
	const allSelectedTactics = [
		...(dailyTactics || []),
		...(weeklyTactics || []),
	];

	const getRecordValue = (tacticId: string) => {
		return records?.find((r) => r.tacticId === tacticId)?.value ?? null;
	};

	const handleRecordChange = (tacticId: string, value: number) => {
		upsertRecord.mutate({
			tacticId,
			date: selectedDate,
			value,
		});
	};

	// 週視圖的記錄變更處理
	const handleWeekRecordChange = (
		tacticId: string,
		date: string,
		value: number,
	) => {
		upsertRecord.mutate({
			tacticId,
			date,
			value,
		});
	};

	if (tacticsLoading || recordsLoading || weekSelectionLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-gray-400">載入中...</div>
			</div>
		);
	}

	const hasActiveTactics =
		(dailyTactics && dailyTactics.length > 0) ||
		(weeklyTactics && weeklyTactics.length > 0);

	// 週視圖模式
	if (isWeekView) {
		return (
			<div className="space-y-6">
				{/* 週選擇器 */}
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={weekRange.goToPrevWeek}
						className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
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
						onClick={weekRange.goToCurrentWeek}
						className="text-center cursor-pointer hover:text-indigo-400 transition-colors"
					>
						<div className="text-lg font-medium text-white">
							{weekRange.weekLabel}
						</div>
						{!weekRange.isCurrentWeek && (
							<div className="text-xs text-gray-500">點擊回到本週</div>
						)}
					</button>

					<button
						type="button"
						onClick={weekRange.goToNextWeek}
						disabled={!weekRange.canGoNext}
						className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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

				{/* 週視圖格子 */}
				{hasActiveTactics ? (
					<WeekViewGrid
						weekStart={weekStart}
						tactics={allSelectedTactics}
						records={records || []}
						onRecordChange={handleWeekRecordChange}
					/>
				) : (
					<div className="text-center py-12">
						<p className="text-gray-400 mb-4">尚未設定任何策略</p>
						<Link
							to="/tactics"
							className="text-indigo-400 hover:text-indigo-300 hover:underline"
						>
							前往設定策略
						</Link>
					</div>
				)}
			</div>
		);
	}

	// 單日模式（原始實作）
	return (
		<div className="space-y-6">
			{/* 日期選擇器 */}
			<DatePicker value={selectedDate} onChange={setSelectedDate} />

			{/* 每日戰術 */}
			{dailyTactics && dailyTactics.length > 0 && (
				<section>
					<h2 className="text-sm font-medium text-gray-400 mb-3">每日任務</h2>
					<div className="space-y-3">
						{dailyTactics.map((tactic) =>
							tactic.type === "daily_time" ? (
								<div
									key={tactic.id}
									className="bg-gray-800 rounded-lg p-4 space-y-3"
								>
									<div className="flex items-center justify-between">
										<span className="text-white truncate">{tactic.name}</span>
										{tactic.targetValue && (
											<span className="text-xs text-gray-500">
												目標: {directionLabels[tactic.targetDirection || "lte"]}{" "}
												{formatTimeValue(tactic.targetValue)}
											</span>
										)}
									</div>
									<TimeRecord
										value={getRecordValue(tactic.id)}
										onChange={(value) =>
											handleRecordChange(tactic.id, value ?? 0)
										}
									/>
								</div>
							) : (
								<div
									key={tactic.id}
									className="bg-gray-800 rounded-lg p-4 flex items-center justify-between gap-4"
								>
									<div className="flex-1 min-w-0">
										<span className="text-white block truncate">
											{tactic.name}
										</span>
										{tactic.type === "daily_number" && tactic.targetValue && (
											<span className="text-xs text-gray-500">
												目標: {directionLabels[tactic.targetDirection || "gte"]}{" "}
												{tactic.targetValue} {tactic.unit}
											</span>
										)}
									</div>
									{tactic.type === "daily_check" ? (
										<CheckRecord
											checked={getRecordValue(tactic.id) === 1}
											onChange={(checked) =>
												handleRecordChange(tactic.id, checked ? 1 : 0)
											}
										/>
									) : (
										<NumberRecord
											value={getRecordValue(tactic.id)}
											onChange={(value) =>
												handleRecordChange(tactic.id, value ?? 0)
											}
											unit={tactic.unit}
										/>
									)}
								</div>
							),
						)}
					</div>
				</section>
			)}

			{/* 每週戰術（快速記錄今日完成） */}
			{weeklyTactics && weeklyTactics.length > 0 && (
				<section>
					<h2 className="text-sm font-medium text-gray-400 mb-3">本週任務</h2>
					<div className="space-y-3">
						{weeklyTactics.map((tactic) => (
							<div
								key={tactic.id}
								className="bg-gray-800 rounded-lg p-4 flex items-center justify-between gap-4"
							>
								<div className="flex-1 min-w-0">
									<span className="text-white block truncate">
										{tactic.name}
									</span>
									<span className="text-xs text-gray-500">
										目標: {directionLabels[tactic.targetDirection || "gte"]}{" "}
										{tactic.targetValue} {tactic.unit}
									</span>
								</div>
								{tactic.type === "weekly_count" ? (
									<CheckRecord
										checked={getRecordValue(tactic.id) === 1}
										onChange={(checked) =>
											handleRecordChange(tactic.id, checked ? 1 : 0)
										}
									/>
								) : (
									<NumberRecord
										value={getRecordValue(tactic.id)}
										onChange={(value) =>
											handleRecordChange(tactic.id, value ?? 0)
										}
										unit={tactic.unit}
									/>
								)}
							</div>
						))}
					</div>
				</section>
			)}

			{/* 無策略提示 */}
			{!hasActiveTactics && (
				<div className="text-center py-12">
					<p className="text-gray-400 mb-4">尚未設定任何策略</p>
					<Link
						to="/tactics"
						className="text-indigo-400 hover:text-indigo-300 hover:underline"
					>
						前往設定策略
					</Link>
				</div>
			)}
		</div>
	);
}
