import { Link, useSearchParams } from "react-router-dom";
import { useRecords, useUpsertRecord } from "../api/records";
import { useTactics } from "../api/tactics";
import { useWeekTacticSelection } from "../api/weekSelections";
import { CheckRecord } from "../components/records/CheckRecord";
import { DatePicker } from "../components/records/DatePicker";
import { NumberRecord } from "../components/records/NumberRecord";
import { TimeRecord } from "../components/records/TimeRecord";
import { getToday, getWeekStart } from "../lib/date";

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
	const [searchParams, setSearchParams] = useSearchParams();
	const selectedDate = searchParams.get("date") || getToday();

	const setSelectedDate = (date: string) => {
		if (date === getToday()) {
			// 如果是今天，移除 URL 參數
			setSearchParams({});
		} else {
			setSearchParams({ date });
		}
	};

	// 計算該日期所屬的週起始日
	const weekStart = getWeekStart(selectedDate);

	const { data: tactics, isLoading: tacticsLoading } = useTactics();
	const { data: records, isLoading: recordsLoading } = useRecords({
		startDate: selectedDate,
		endDate: selectedDate,
	});
	const { data: weekSelection, isLoading: weekSelectionLoading } =
		useWeekTacticSelection(weekStart);
	const upsertRecord = useUpsertRecord();

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
