import { useEffect, useState } from "react";
import { useActiveQuarter } from "../api/quarters";
import { usePrefetchAdjacentWeekScores, useWeeklyScore } from "../api/records";
import type { ScoreDetail as ScoreDetailType } from "../api/types";
import { ScoreDetail } from "../components/score/ScoreDetail";
import { ShareDialog } from "../components/share/ShareDialog";
import { useWeekRange } from "../hooks/useWeekRange";
import { cn } from "../lib/cn";
import { addDays } from "../lib/date";
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
	const { data: activeQuarterInfo } = useActiveQuarter();

	// 4 週資料（從 4 週前到本週結束）
	const fourWeekStart = addDays(startDate, -21); // 往前 3 週
	const { data: fourWeekData } = useWeeklyScore({
		startDate: fourWeekStart,
		endDate,
	});

	const [isShareOpen, setIsShareOpen] = useState(false);

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
						{/* 季度進度 */}
						{activeQuarterInfo?.quarter && activeQuarterInfo.weekNumber && (
							<div className="mt-4 pt-4 border-t border-gray-700">
								<p className="text-sm text-gray-400">
									{activeQuarterInfo.quarter.name}
								</p>
								<p className="text-xs text-indigo-400">
									第 {activeQuarterInfo.weekNumber} 週 / 12 週
								</p>
							</div>
						)}
					</>
				)}
			</div>

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
											<ScoreDetail
												key={detail.tacticId}
												detail={detail}
												weekStartDate={startDate}
												showDates={settings.showDateRange}
											/>
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

			{/* 分享按鈕 */}
			{!isLoading && data && data.details.length > 0 && (
				<div className="text-center">
					<button
						type="button"
						onClick={() => setIsShareOpen(true)}
						className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
							/>
						</svg>
						分享
					</button>
				</div>
			)}

			{/* 分享對話框 */}
			{data && (
				<ShareDialog
					open={isShareOpen}
					onOpenChange={setIsShareOpen}
					weekScore={{ score: data.score, details: data.details }}
					weekStart={startDate}
					weekEnd={endDate}
					fourWeekScore={
						fourWeekData
							? { score: fourWeekData.score, details: fourWeekData.details }
							: undefined
					}
					fourWeekStart={fourWeekStart}
					fourWeekEnd={endDate}
				/>
			)}
		</div>
	);
}
