import { useState } from "react";
import type { ScoreDetail } from "../../api/types";
import {
	formatShareRange,
	generateShareUrl,
	type ShareData,
} from "../../lib/share";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface ShareDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	weekScore: {
		score: number;
		details: ScoreDetail[];
	};
	weekStart: string;
	weekEnd: string;
	// 4 週資料（選填）
	fourWeekScore?: {
		score: number;
		details: ScoreDetail[];
	};
	fourWeekStart?: string;
	fourWeekEnd?: string;
}

export function ShareDialog({
	open,
	onOpenChange,
	weekScore,
	weekStart,
	weekEnd,
	fourWeekScore,
	fourWeekStart,
	fourWeekEnd,
}: ShareDialogProps) {
	const [period, setPeriod] = useState<"week" | "4week">("week");
	const [copied, setCopied] = useState(false);
	const [shareUrl, setShareUrl] = useState<string | null>(null);

	const hasFourWeekData = fourWeekScore && fourWeekStart && fourWeekEnd;

	const handleGenerate = () => {
		const isWeek = period === "week";
		const score = isWeek ? weekScore : fourWeekScore;
		const start = isWeek ? weekStart : fourWeekStart;
		const end = isWeek ? weekEnd : fourWeekEnd;

		if (!score || !start || !end) return;

		const data: ShareData = {
			v: 1,
			period,
			range: { start, end },
			score: score.score,
			tactics: score.details.map((d) => ({
				name: d.tacticName,
				type: d.type,
				target: d.target,
				current: d.current,
				achieved: d.achieved,
				category: d.category ?? undefined,
			})),
			generatedAt: new Date().toISOString(),
		};

		const url = generateShareUrl(data);
		setShareUrl(url);
	};

	const handleCopy = async () => {
		if (!shareUrl) return;

		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// 備用方案：使用舊版 API
			const textArea = document.createElement("textarea");
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleClose = () => {
		setShareUrl(null);
		setCopied(false);
		onOpenChange(false);
	};

	const currentScore = period === "week" ? weekScore : fourWeekScore;
	const currentStart = period === "week" ? weekStart : fourWeekStart;
	const currentEnd = period === "week" ? weekEnd : fourWeekEnd;

	return (
		<Dialog open={open} onOpenChange={handleClose} title="分享執行率">
			<div className="space-y-4">
				{/* 期間選擇 */}
				<div className="space-y-2">
					<span className="text-sm font-medium text-gray-300">選擇期間</span>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => {
								setPeriod("week");
								setShareUrl(null);
							}}
							className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
								period === "week"
									? "bg-indigo-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							}`}
						>
							本週
						</button>
						<button
							type="button"
							onClick={() => {
								setPeriod("4week");
								setShareUrl(null);
							}}
							disabled={!hasFourWeekData}
							className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
								period === "4week"
									? "bg-indigo-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							}`}
						>
							4 週
						</button>
					</div>
				</div>

				{/* 預覽 */}
				{currentScore && currentStart && currentEnd && (
					<div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-gray-400">期間</span>
							<span className="text-white">
								{formatShareRange(currentStart, currentEnd)}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-gray-400">執行率</span>
							<span className="text-white font-medium">
								{currentScore.score}%
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-gray-400">策略數</span>
							<span className="text-white">{currentScore.details.length}</span>
						</div>
					</div>
				)}

				{/* 產生連結 */}
				{!shareUrl ? (
					<Button onClick={handleGenerate} className="w-full">
						產生分享連結
					</Button>
				) : (
					<div className="space-y-3">
						<div className="bg-gray-700 rounded-lg p-3">
							<input
								type="text"
								readOnly
								value={shareUrl}
								className="w-full bg-transparent text-sm text-gray-300 outline-none"
							/>
						</div>
						<Button onClick={handleCopy} className="w-full">
							{copied ? "已複製！" : "複製連結"}
						</Button>
					</div>
				)}
			</div>
		</Dialog>
	);
}
