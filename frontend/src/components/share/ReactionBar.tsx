import { Link } from "react-router-dom";
import type { ShareReactions } from "../../api/types";

const EMOJIS = ["👍", "❤️", "🔥", "👏", "💪", "🎉"];

interface ReactionBarProps {
	shareId: string;
	reactions: ShareReactions;
	isLoggedIn: boolean;
	onReact: (emoji: string) => void;
}

export function ReactionBar({
	shareId,
	reactions,
	isLoggedIn,
	onReact,
}: ReactionBarProps) {
	const handleClick = (emoji: string) => {
		if (isLoggedIn) {
			onReact(emoji);
		}
	};

	// 如果未登入，顯示登入提示
	if (!isLoggedIn) {
		return (
			<div className="bg-gray-800 rounded-xl p-4">
				<div className="flex justify-center gap-3 mb-3">
					{EMOJIS.map((emoji) => (
						<div key={emoji} className="flex flex-col items-center">
							<span className="text-2xl opacity-50">{emoji}</span>
							<span className="text-xs text-gray-500">
								{reactions[emoji]?.count || 0}
							</span>
						</div>
					))}
				</div>
				<Link
					to={`/login?returnTo=/share/${shareId}`}
					className="block text-center text-sm text-indigo-400 hover:text-indigo-300"
				>
					登入以留下回應
				</Link>
			</div>
		);
	}

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
							onClick={() => handleClick(emoji)}
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
