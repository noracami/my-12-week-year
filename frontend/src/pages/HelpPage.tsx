import { useState } from "react";
import { Link } from "react-router-dom";
import type { ShareReactions } from "../api/types";
import { Checkbox } from "../components/ui/Checkbox";
import { NumberInput } from "../components/ui/NumberInput";
import { TimeSlider } from "../components/ui/TimeSlider";
import { useSession } from "../lib/auth";

// Mock 表情回應組件
function MockReactionBar() {
	const [reactions, setReactions] = useState<ShareReactions>({
		"👍": { count: 3, reacted: false },
		"❤️": { count: 1, reacted: false },
		"🔥": { count: 0, reacted: false },
		"👏": { count: 2, reacted: false },
		"💪": { count: 0, reacted: false },
		"🎉": { count: 0, reacted: false },
	});

	const handleReact = (emoji: string) => {
		setReactions((prev) => {
			const current = prev[emoji];
			return {
				...prev,
				[emoji]: {
					count: current.reacted ? current.count - 1 : current.count + 1,
					reacted: !current.reacted,
				},
			};
		});
	};

	const EMOJIS = ["👍", "❤️", "🔥", "👏", "💪", "🎉"];

	return (
		<div className="bg-gray-800 rounded-xl p-4">
			<div className="flex justify-center gap-3">
				{EMOJIS.map((emoji) => {
					const reaction = reactions[emoji];
					const count = reaction?.count || 0;
					const reacted = reaction?.reacted || false;

					return (
						<button
							key={emoji}
							type="button"
							onClick={() => handleReact(emoji)}
							className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${
								reacted
									? "bg-indigo-600/30 ring-1 ring-indigo-500"
									: "hover:bg-gray-700/50"
							}`}
						>
							<span className="text-2xl">{emoji}</span>
							<span
								className={`text-xs ${reacted ? "text-indigo-400" : "text-gray-400"}`}
							>
								{count}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

// Mock 留言組件
function MockCommentSection() {
	const [comments, setComments] = useState([
		{
			id: "1",
			name: "小明",
			content: "太厲害了！繼續加油！",
			time: "2 小時前",
			hidden: false,
		},
		{
			id: "2",
			name: "你",
			content: "謝謝大家的鼓勵 😊",
			time: "1 小時前",
			isOwn: true,
			hidden: false,
		},
	]);
	const [newComment, setNewComment] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newComment.trim()) return;
		setComments((prev) => [
			...prev,
			{
				id: Date.now().toString(),
				name: "你",
				content: newComment.trim(),
				time: "剛剛",
				isOwn: true,
				hidden: false,
			},
		]);
		setNewComment("");
	};

	const handleToggleHidden = (id: string) => {
		setComments((prev) =>
			prev.map((c) => (c.id === id ? { ...c, hidden: !c.hidden } : c)),
		);
	};

	const hiddenMessages = [
		"悄悄地收回了訊息",
		"收回了一則訊息",
		"突然害羞了起來",
	];

	return (
		<div className="space-y-4">
			{/* 留言列表 */}
			<div className="space-y-3">
				{comments.map((comment) => (
					<div key={comment.id} className="flex gap-3">
						<div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
							{comment.name.charAt(0)}
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2 text-sm">
								<span className="text-gray-200">
									{comment.name}
									{comment.isOwn && (
										<span className="ml-1 text-xs text-indigo-400">(你)</span>
									)}
								</span>
								<span className="text-gray-500">{comment.time}</span>
							</div>
							{comment.hidden ? (
								<p className="mt-1 text-gray-500 text-sm italic">
									{hiddenMessages[Number(comment.id) % hiddenMessages.length]}
								</p>
							) : (
								<p className="mt-1 text-gray-300 text-sm">{comment.content}</p>
							)}
							{comment.isOwn && (
								<button
									type="button"
									onClick={() => handleToggleHidden(comment.id)}
									className="mt-1 text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
								>
									{comment.hidden ? "取消收回" : "收回"}
								</button>
							)}
						</div>
					</div>
				))}
			</div>

			{/* 新增留言 */}
			<form onSubmit={handleSubmit} className="space-y-2">
				<textarea
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
					placeholder="試著留下一則留言..."
					className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
					rows={2}
				/>
				<button
					type="submit"
					disabled={!newComment.trim()}
					className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				>
					發送留言
				</button>
			</form>
		</div>
	);
}

// 示範區塊組件
function DemoSection({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
			<div>
				<h3 className="text-lg font-medium text-white">{title}</h3>
				<p className="text-sm text-gray-400">{description}</p>
			</div>
			<div className="bg-gray-900/50 rounded-lg p-4">{children}</div>
		</div>
	);
}

export function HelpPage() {
	const { data: session, isPending } = useSession();

	// Mock 資料狀態
	const [checkValue, setCheckValue] = useState(false);
	const [numberValue, setNumberValue] = useState<number | null>(70.5);
	const [countValue, setCountValue] = useState<number | null>(2);
	const [timeValue, setTimeValue] = useState<number | null>(23.5);

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			{/* Header */}
			<header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
				<div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
					<Link to="/" className="text-xl font-bold text-indigo-400">
						My 12-Week Year
					</Link>
					{isPending ? (
						<span className="px-4 py-2 text-gray-400 text-sm">載入中...</span>
					) : session ? (
						<Link
							to="/"
							className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
						>
							返回首頁
						</Link>
					) : (
						<Link
							to="/login"
							className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
						>
							登入
						</Link>
					)}
				</div>
			</header>

			{/* Content */}
			<main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
				{/* 介紹 */}
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-bold">操作說明</h1>
					<p className="text-gray-400">
						透過下方的互動示範，了解如何使用各項功能
					</p>
				</div>

				{/* 每日記錄 */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold border-b border-gray-700 pb-2">
						每日記錄
					</h2>

					<DemoSection
						title="每日勾選"
						description="點擊勾選框標記今日是否完成，適合「有做/沒做」的習慣追蹤"
					>
						<div className="flex items-center justify-between">
							<span className="text-gray-300">閱讀 30 分鐘</span>
							<Checkbox checked={checkValue} onChange={setCheckValue} />
						</div>
						<p className="mt-2 text-xs text-gray-500">
							目前狀態：{checkValue ? "已完成 ✓" : "未完成"}
						</p>
					</DemoSection>

					<DemoSection
						title="每日數值"
						description="輸入數字或使用 +/- 按鈕調整，適合追蹤體重、步數等數值"
					>
						<div className="flex items-center justify-between">
							<span className="text-gray-300">體重</span>
							<NumberInput
								value={numberValue}
								onChange={setNumberValue}
								unit="kg"
							/>
						</div>
					</DemoSection>

					<DemoSection
						title="每日時間"
						description="拖動滑桿選擇時間，適合追蹤睡眠時間等"
					>
						<div className="space-y-2">
							<span className="text-gray-300">就寢時間</span>
							<TimeSlider value={timeValue} onChange={setTimeValue} />
						</div>
					</DemoSection>
				</section>

				{/* 每週記錄 */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold border-b border-gray-700 pb-2">
						每週記錄
					</h2>

					<DemoSection
						title="每週次數"
						description="記錄本週完成幾次，適合「每週運動 3 次」這類目標"
					>
						<div className="flex items-center justify-between">
							<span className="text-gray-300">運動</span>
							<NumberInput
								value={countValue}
								onChange={setCountValue}
								unit="次"
							/>
						</div>
						<p className="mt-2 text-xs text-gray-500">
							目標：每週至少 3 次 → 目前 {countValue ?? 0}/3 次
						</p>
					</DemoSection>
				</section>

				{/* 分享互動 */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold border-b border-gray-700 pb-2">
						分享互動
					</h2>

					<DemoSection
						title="表情回應"
						description="點擊表情符號為分享內容按讚，再次點擊可取消"
					>
						<MockReactionBar />
					</DemoSection>

					<DemoSection
						title="留言功能"
						description="在公開分享頁面留言互動，可以收回自己的留言"
					>
						<MockCommentSection />
					</DemoSection>
				</section>

				{/* 功能說明 */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold border-b border-gray-700 pb-2">
						功能說明
					</h2>

					<div className="grid gap-4">
						<div className="bg-gray-800/50 rounded-xl p-4">
							<h3 className="font-medium text-indigo-400 mb-2">📅 今日頁面</h3>
							<p className="text-sm text-gray-400">
								記錄每日完成狀況。可切換單日模式或週視圖模式，系統會自動儲存。
							</p>
						</div>

						<div className="bg-gray-800/50 rounded-xl p-4">
							<h3 className="font-medium text-indigo-400 mb-2">📋 策略頁面</h3>
							<p className="text-sm text-gray-400">
								管理你的策略（習慣/目標）。可以設定目標值、單位、領域分類，並選擇每週要追蹤的策略。
							</p>
						</div>

						<div className="bg-gray-800/50 rounded-xl p-4">
							<h3 className="font-medium text-indigo-400 mb-2">📊 得分頁面</h3>
							<p className="text-sm text-gray-400">
								查看週執行率（完成度 %），並可分享成績給朋友。支援 1 週或 4
								週的摘要分享。
							</p>
						</div>

						<div className="bg-gray-800/50 rounded-xl p-4">
							<h3 className="font-medium text-indigo-400 mb-2">👥 群組功能</h3>
							<p className="text-sm text-gray-400">
								建立或加入群組，與夥伴互相督責。可以查看群組成員的週執行率。
							</p>
						</div>
					</div>
				</section>

				{/* 策略類型說明 */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold border-b border-gray-700 pb-2">
						策略類型
					</h2>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-700">
									<th className="text-left py-2 text-gray-400">類型</th>
									<th className="text-left py-2 text-gray-400">說明</th>
									<th className="text-left py-2 text-gray-400">範例</th>
								</tr>
							</thead>
							<tbody className="text-gray-300">
								<tr className="border-b border-gray-800">
									<td className="py-2">每日勾選</td>
									<td className="py-2">每天是否完成</td>
									<td className="py-2 text-gray-500">閱讀 30 分鐘</td>
								</tr>
								<tr className="border-b border-gray-800">
									<td className="py-2">每日數值</td>
									<td className="py-2">每天記錄數字</td>
									<td className="py-2 text-gray-500">體重 kg</td>
								</tr>
								<tr className="border-b border-gray-800">
									<td className="py-2">每日時間</td>
									<td className="py-2">每天記錄時間</td>
									<td className="py-2 text-gray-500">就寢時間</td>
								</tr>
								<tr className="border-b border-gray-800">
									<td className="py-2">每週次數</td>
									<td className="py-2">每週完成幾次</td>
									<td className="py-2 text-gray-500">運動 3 次/週</td>
								</tr>
								<tr>
									<td className="py-2">每週數值</td>
									<td className="py-2">每週累計數字</td>
									<td className="py-2 text-gray-500">跑步公里數</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				{/* 開始使用 */}
				<section className="text-center py-8">
					<p className="text-gray-400 mb-4">
						準備好開始追蹤你的 12 週目標了嗎？
					</p>
					<Link
						to="/login"
						className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
					>
						立即開始
					</Link>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
				<p>My 12-Week Year - 12 週年目標追蹤系統</p>
			</footer>
		</div>
	);
}
