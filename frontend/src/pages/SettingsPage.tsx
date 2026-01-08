import { useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth";
import { useSettings, type WeekStartDay } from "../lib/settings";

export function SettingsPage() {
	const navigate = useNavigate();
	const { data: session } = useSession();
	const { settings, updateSettings } = useSettings();

	const handleSignOut = async () => {
		if (window.confirm("確定要登出嗎？")) {
			await signOut();
			navigate("/login");
		}
	};

	const handleWeekStartDayChange = (day: WeekStartDay) => {
		updateSettings({ weekStartDay: day });
	};

	return (
		<div className="space-y-6">
			<h1 className="text-xl font-bold">設定</h1>

			{/* 使用者資訊 */}
			<section className="bg-gray-800 rounded-lg p-4">
				<div className="flex items-center gap-4">
					{session?.user.image ? (
						<img
							src={session.user.image}
							alt={session.user.name || "使用者"}
							className="w-12 h-12 rounded-full"
						/>
					) : (
						<div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
							<span className="text-lg text-white">
								{session?.user.name?.[0] || "?"}
							</span>
						</div>
					)}
					<div>
						<div className="text-white font-medium">{session?.user.name}</div>
						<div className="text-sm text-gray-400">{session?.user.email}</div>
					</div>
				</div>
			</section>

			{/* 週起始日設定 */}
			<section className="bg-gray-800 rounded-lg p-4 space-y-3">
				<h2 className="text-sm font-medium text-gray-400">週起始日</h2>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => handleWeekStartDayChange(0)}
						className={`flex-1 py-2 px-4 rounded-lg transition-colors cursor-pointer ${
							settings.weekStartDay === 0
								? "bg-indigo-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}
					>
						週日
					</button>
					<button
						type="button"
						onClick={() => handleWeekStartDayChange(1)}
						className={`flex-1 py-2 px-4 rounded-lg transition-colors cursor-pointer ${
							settings.weekStartDay === 1
								? "bg-indigo-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}
					>
						週一
					</button>
				</div>
				<p className="text-xs text-gray-500">
					設定每週的起始日，影響週得分的計算週期
				</p>
			</section>

			{/* 得分頁日期區間 */}
			<section className="bg-gray-800 rounded-lg p-4 space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-medium text-gray-400">顯示日期區間</h2>
					<button
						type="button"
						onClick={() =>
							updateSettings({ showDateRange: !settings.showDateRange })
						}
						className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
							settings.showDateRange ? "bg-indigo-600" : "bg-gray-600"
						}`}
					>
						<span
							className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
								settings.showDateRange ? "translate-x-5" : "translate-x-0"
							}`}
						/>
					</button>
				</div>
				<p className="text-xs text-gray-500">
					在得分頁的週執行率下方顯示該週日期區間
				</p>
			</section>

			{/* 登出按鈕 */}
			<section>
				<button
					type="button"
					onClick={handleSignOut}
					className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
				>
					登出
				</button>
			</section>
		</div>
	);
}
