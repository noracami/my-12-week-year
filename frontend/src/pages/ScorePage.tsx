import { useWeeklyScore } from "../api/records";
import { ScoreDetail } from "../components/score/ScoreDetail";
import { useWeekRange } from "../hooks/useWeekRange";
import { cn } from "../lib/cn";

export function ScorePage() {
	const {
		startDate,
		endDate,
		weekLabel,
		goToPrevWeek,
		goToNextWeek,
		isCurrentWeek,
	} = useWeekRange();

	const { data, isLoading } = useWeeklyScore({ startDate, endDate });

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

			{/* 詳細列表 */}
			{!isLoading && data?.details && data.details.length > 0 && (
				<section>
					<h3 className="text-sm font-medium text-gray-400 mb-3">
						各戰術執行狀況
					</h3>
					<div className="space-y-3">
						{data.details.map((detail) => (
							<ScoreDetail key={detail.tacticId} detail={detail} />
						))}
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
