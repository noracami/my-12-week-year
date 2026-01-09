import { useNavigate } from "react-router-dom";
import type { Group, GuildMember } from "../../api/types";

interface MemberCardProps {
	member: GuildMember;
	guildId: string;
	groups: Group[];
}

export function MemberCard({ member, guildId, groups }: MemberCardProps) {
	const navigate = useNavigate();
	const group = groups.find((g) => g.id === member.groupId);

	return (
		<button
			type="button"
			onClick={() => navigate(`/guilds/${guildId}/members/${member.userId}`)}
			className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
		>
			{member.userImage ? (
				<img
					src={member.userImage}
					alt={member.userName}
					className="w-10 h-10 rounded-full"
				/>
			) : (
				<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
					<span className="text-sm text-white">{member.userName[0]}</span>
				</div>
			)}
			<div className="flex-1 text-left min-w-0">
				<div className="font-medium text-white truncate">{member.userName}</div>
				{group && (
					<div className="text-xs text-gray-400 truncate">{group.name}</div>
				)}
			</div>
			<div className="flex items-center gap-2">
				{member.role === "admin" && (
					<span className="text-xs bg-indigo-600/50 text-indigo-300 px-2 py-0.5 rounded">
						管理
					</span>
				)}
				<span className="text-gray-400">→</span>
			</div>
		</button>
	);
}
