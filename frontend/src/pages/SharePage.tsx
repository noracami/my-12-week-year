import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { usePublicShare } from "../api/shares";
import type { ShareData, ShareTactic } from "../lib/share";
import { decodeShareData, formatShareRange } from "../lib/share";

// 按領域分組
function groupByCategory(tactics: ShareTactic[]): Map<string, ShareTactic[]> {
	const groups = new Map<string, ShareTactic[]>();
	const uncategorizedKey = "";

	for (const tactic of tactics) {
		const key = tactic.category || uncategorizedKey;
		const existing = groups.get(key) || [];
		groups.set(key, [...existing, tactic]);
	}

	// 排序：有領域的在前（按字母），無領域的在後
	const sortedGroups = new Map<string, ShareTactic[]>();
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

function TacticItem({ tactic }: { tactic: ShareTactic }) {
	const formatProgress = () => {
		if (tactic.type === "daily_check") {
			return `${tactic.current}/${tactic.target} 天`;
		}
		if (tactic.type === "daily_time") {
			return `${tactic.current}/${tactic.target} 天`;
		}
		if (tactic.type === "daily_number") {
			return `${tactic.current}/${tactic.target} 天`;
		}
		if (tactic.type === "weekly_count") {
			return `${tactic.current}/${tactic.target} 次`;
		}
		// weekly_number
		return `${tactic.current}/${tactic.target}`;
	};

	return (
		<div className="flex items-center justify-between py-2 px-3 bg-gray-700/50 rounded-lg">
			<div className="flex items-center gap-2">
				<span className={tactic.achieved ? "text-green-400" : "text-gray-500"}>
					{tactic.achieved ? "✓" : "○"}
				</span>
				<span className="text-white">{tactic.name}</span>
			</div>
			<span className="text-sm text-gray-400">{formatProgress()}</span>
		</div>
	);
}

function ShareContent({
	data,
	isPublic = false,
	shareId,
}: {
	data: ShareData;
	isPublic?: boolean;
	shareId?: string;
}) {
	const groupedTactics = useMemo(
		() => groupByCategory(data.tactics),
		[data.tactics],
	);

	const periodLabel = data.period === "week" ? "週" : "4 週";
	const generatedDate = new Date(data.generatedAt).toLocaleDateString("zh-TW", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	return (
		<div className="min-h-screen bg-gray-900 text-white p-4">
			<div className="max-w-md mx-auto space-y-6 py-8">
				{/* 品牌標識 */}
				<div className="text-center">
					<h1 className="text-xl font-bold text-indigo-400">My 12-Week Year</h1>
				</div>

				{/* 日期區間 */}
				<div className="text-center">
					<p className="text-2xl font-medium">
						{formatShareRange(data.range.start, data.range.end)}
					</p>
					<p className="text-sm text-gray-400">{periodLabel}摘要</p>
				</div>

				{/* 執行率 */}
				<div className="bg-gray-800 rounded-xl p-8 text-center">
					<p className="text-gray-400 text-sm mb-2">執行率</p>
					<p className="text-5xl font-bold text-white">
						{data.score}
						<span className="text-2xl text-gray-400">%</span>
					</p>
				</div>

				{/* 策略列表 */}
				{data.tactics.length > 0 && (
					<div className="space-y-4">
						{Array.from(groupedTactics.entries()).map(([category, tactics]) => (
							<div key={category || "__uncategorized__"} className="space-y-2">
								{category && (
									<div className="text-sm font-medium text-indigo-400 px-1">
										{category}
									</div>
								)}
								<div className="space-y-1">
									{tactics.map((tactic) => (
										<TacticItem key={tactic.name} tactic={tactic} />
									))}
								</div>
							</div>
						))}
					</div>
				)}

				{/* 公開分享 CTA */}
				{isPublic && shareId && (
					<Link
						to={`/login?returnTo=/share/${shareId}`}
						className="block bg-gray-800/50 rounded-xl p-4 text-center hover:bg-gray-700/50 transition-colors"
					>
						<p className="text-gray-400 text-sm">💬 登入以留言</p>
					</Link>
				)}

				{/* 底部資訊 */}
				<div className="text-center space-y-4 pt-4 border-t border-gray-700">
					<p className="text-xs text-gray-500">產生於 {generatedDate}</p>
					<Link
						to="/"
						className="inline-block text-sm text-indigo-400 hover:text-indigo-300"
					>
						開始追蹤你的 12 週年目標 →
					</Link>
				</div>
			</div>
		</div>
	);
}

function ErrorState() {
	return (
		<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
			<div className="text-center space-y-4">
				<p className="text-xl text-gray-400">無法載入分享內容</p>
				<p className="text-sm text-gray-500">連結可能已過期或無效</p>
				<Link
					to="/"
					className="inline-block mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
				>
					返回首頁
				</Link>
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
			<div className="text-center">
				<p className="text-gray-400">載入中...</p>
			</div>
		</div>
	);
}

export function SharePage() {
	const { id } = useParams<{ id?: string }>();
	const location = useLocation();
	const hash = location.hash.slice(1); // 移除開頭的 #

	// 公開分享：從 API 取得
	const { data: publicShare, isLoading, error } = usePublicShare(id);

	// 私人分享：從 URL hash 解碼
	const privateShareData = useMemo(() => {
		if (id || !hash) return null;
		return decodeShareData(hash);
	}, [id, hash]);

	// 公開分享：API 載入中
	if (id && isLoading) {
		return <LoadingState />;
	}

	// 公開分享：API 回傳結果
	if (id) {
		if (error || !publicShare) {
			return <ErrorState />;
		}
		return <ShareContent data={publicShare.data} isPublic shareId={id} />;
	}

	// 私人分享：hash 解碼結果
	if (!privateShareData) {
		return <ErrorState />;
	}

	return <ShareContent data={privateShareData} />;
}
