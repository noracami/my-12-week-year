import { useEffect } from "react";
import { usePrefetchAdjacentWeekScores, useWeeklyScore } from "../api/records";
import type { ScoreDetail as ScoreDetailType } from "../api/types";
import { ScoreDetail } from "../components/score/ScoreDetail";
import { useWeekRange } from "../hooks/useWeekRange";
import { cn } from "../lib/cn";
import { useSettings } from "../lib/settings";

// 按領域分組
function groupByCategory(
	details: ScoreDetailType[],
): Map<string, ScoreDetailType[]> {
	const groups = new Map<string, ScoreDetailType[]>();
	const uncategorizedKey = "";

	for (const detail of details) {
		const key = detail.category || uncategorizedKey;
		const existing = groups.get(key) || [];
		groups.set(key, [...existing, detail]);
	}

	// 排序：有領域的在前（按字母），無領域的在後
	const sortedGroups = new Map<string, ScoreDetailType[]>();
	const keys = Array.from(groups.keys()).sort((a, b) => {
		if (a === uncategorizedKey) return 1;
		if (b === uncategorizedKey) return -1;
		return a.localeCompare(b, "zh-TW");
	});

	for (const key of keys) {
		const value = groups.get(key);
		if (value) {
			sortedGroups.set(key, value);
		}
	}

	return sortedGroups;
}

// 格式化日期區間顯示
function formatDateRange(startDate: string, endDate: string): string {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const startMonth = start.getMonth() + 1;
	const startDay = start.getDate();
	const endMonth = end.getMonth() + 1;
	const endDay = end.getDate();

	if (startMonth === endMonth) {
		return `${startMonth}/${startDay} - ${endDay}`;
	}
	return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
}

export function ScorePage() {
	const {
		startDate,
		endDate,
		weekLabel,
		goToPrevWeek,
		goToNextWeek,
		isCurrentWeek,
	} = useWeekRange();

	const { settings } = useSettings();
	const { data, isLoading } = useWeeklyScore({ startDate, endDate });

	// 預取前一週分數
	const prefetchAdjacentWeekScores = usePrefetchAdjacentWeekScores(
		startDate,
		endDate,
	);
	useEffect(() => {
		prefetchAdjacentWeekScores();
	}, [prefetchAdjacentWeekScores]);

	return (
		<div className="space-y-6">
			{/* 週切換器 */}
			<div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
				<button
					type="button"
					onClick={goToPrevWeek}
					className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
					aria-label="上週"
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

				<div className="text-center">
					<span className="text-white font-medium">{weekLabel}</span>
					{isCurrentWeek && (
						<span className="block text-xs text-indigo-400">本週</span>
					)}
				</div>

				<button
					type="button"
					onClick={goToNextWeek}
					disabled={isCurrentWeek}
					className={cn(
						"p-2 transition-colors",
						isCurrentWeek
							? "text-gray-600 cursor-not-allowed"
							: "text-gray-400 hover:text-white cursor-pointer",
					)}
					aria-label="下週"
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

			{/* 總得分 */}
			<div className="bg-gray-800 rounded-xl p-8 text-center">
				{isLoading ? (
					<div className="text-gray-400">計算中...</div>
				) : (
					<>
						<p className="text-gray-400 text-sm mb-2">週執行率</p>
						<p className="text-5xl font-bold text-white">
							{data?.score ?? 0}
							<span className="text-2xl text-gray-400">%</span>
						</p>
					</>
				)}
			</div>

			{/* 日期區間 */}
			{settings.showDateRange && (
				<div className="text-center text-sm text-gray-500">
					{formatDateRange(startDate, endDate)}
				</div>
			)}

			{/* 詳細列表（按領域分組） */}
			{!isLoading && data?.details && data.details.length > 0 && (
				<section>
					<h3 className="text-sm font-medium text-gray-400 mb-3">
						各策略執行狀況
					</h3>
					<div className="space-y-4">
						{Array.from(groupByCategory(data.details).entries()).map(
							([category, groupDetails]) => (
								<div
									key={category || "__uncategorized__"}
									className="space-y-2"
								>
									{category && (
										<div className="text-sm font-medium text-indigo-400 px-1">
											{category}
										</div>
									)}
									<div className="space-y-2">
										{groupDetails.map((detail) => (
											<ScoreDetail key={detail.tacticId} detail={detail} />
										))}
									</div>
								</div>
							),
						)}
					</div>
				</section>
			)}

			{/* 無資料提示 */}
			{!isLoading && (!data?.details || data.details.length === 0) && (
				<div className="text-center py-8 text-gray-400">本週尚無記錄</div>
			)}
		</div>
	);
}
