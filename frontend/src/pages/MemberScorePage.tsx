import { useNavigate, useParams } from "react-router-dom";
import { useMemberScore } from "../api/guilds";
import type { ScoreDetail as ScoreDetailType } from "../api/types";
import { ScoreDetail } from "../components/score/ScoreDetail";
import { Button } from "../components/ui/Button";
import { useWeekRange } from "../hooks/useWeekRange";
import { cn } from "../lib/cn";
import { useSettings } from "../lib/settings";

// 按領域分組（複製自 ScorePage）
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

export function MemberScorePage() {
	const { guildId, userId } = useParams<{ guildId: string; userId: string }>();
	const navigate = useNavigate();
	const { settings } = useSettings();

	const {
		startDate,
		endDate,
		weekLabel,
		goToPrevWeek,
		goToNextWeek,
		isCurrentWeek,
	} = useWeekRange();

	const { data, isLoading } = useMemberScore(
		guildId || "",
		userId || "",
		startDate,
		endDate,
	);

	if (!guildId || !userId) {
		return <div className="text-center py-8 text-gray-400">參數錯誤</div>;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					{data?.user.image ? (
						<img
							src={data.user.image}
							alt={data.user.name}
							className="w-12 h-12 rounded-full"
						/>
					) : (
						<div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
							<span className="text-lg text-white">
								{data?.user.name?.[0] || "?"}
							</span>
						</div>
					)}
					<div>
						<h1 className="text-xl font-bold text-white">
							{data?.user.name || "載入中..."}
						</h1>
						<p className="text-sm text-gray-400">週執行率</p>
					</div>
				</div>
				<Button variant="ghost" onClick={() => navigate(`/guilds/${guildId}`)}>
					← 返回
				</Button>
			</div>

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
		</div>
	);
}
