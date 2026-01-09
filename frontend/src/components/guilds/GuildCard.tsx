import { useNavigate } from "react-router-dom";
import type { Guild } from "../../api/types";

interface GuildCardProps {
	guild: Guild;
}

export function GuildCard({ guild }: GuildCardProps) {
	const navigate = useNavigate();

	return (
		<button
			type="button"
			onClick={() => navigate(`/guilds/${guild.id}`)}
			className="w-full text-left bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors cursor-pointer"
		>
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<div className="font-medium text-white truncate">{guild.name}</div>
					{guild.description && (
						<div className="text-sm text-gray-400 truncate mt-1">
							{guild.description}
						</div>
					)}
				</div>
				<div className="ml-4 flex items-center gap-2">
					{guild.role === "admin" && (
						<span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
							管理員
						</span>
					)}
					<span className="text-gray-400">→</span>
				</div>
			</div>
		</button>
	);
}
