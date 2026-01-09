import { useEffect } from "react";
import { Link, Outlet, useMatch, useNavigate } from "react-router-dom";
import { useGuild } from "../../api/guilds";
import { useSession } from "../../lib/auth";
import { BottomNav } from "./BottomNav";

export function Layout() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();

	// Detect guild context from route
	const guildMatch = useMatch("/guilds/:id");
	const memberMatch = useMatch("/guilds/:guildId/members/:userId");
	const guildId = guildMatch?.params.id || memberMatch?.params.guildId || "";

	const { data: guild } = useGuild(guildId);

	useEffect(() => {
		if (!isPending && !session) {
			navigate("/login");
		}
	}, [session, isPending, navigate]);

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-900">
				<div className="text-white">載入中...</div>
			</div>
		);
	}

	if (!session) return null;

	return (
		<div className="min-h-screen bg-gray-900 text-white pb-20">
			<header className="sticky top-0 z-20 bg-gray-800/95 backdrop-blur border-b border-gray-700">
				<div className="px-4 py-3 flex justify-between items-center">
					<Link
						to="/"
						className="text-lg font-bold hover:text-indigo-400 transition-colors"
					>
						My 12-Week Year
					</Link>
					<div className="flex items-center gap-3">
						<Link to="/settings" className="cursor-pointer">
							{session.user.image ? (
								<img
									src={session.user.image}
									alt={session.user.name || "使用者"}
									className="w-8 h-8 rounded-full hover:ring-2 hover:ring-indigo-400 transition-all"
								/>
							) : (
								<div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center hover:ring-2 hover:ring-indigo-400 transition-all">
									<span className="text-sm text-white">
										{session.user.name?.[0] || "?"}
									</span>
								</div>
							)}
						</Link>
					</div>
				</div>
				{guild && (
					<div className="px-4 py-2 bg-indigo-900/50 border-t border-indigo-800/50">
						<Link
							to={`/guilds/${guild.id}`}
							className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-2"
						>
							<span className="text-indigo-400">●</span>
							{guild.name}
						</Link>
					</div>
				)}
			</header>
			<main className="px-4 py-4">
				<Outlet />
			</main>
			<BottomNav />
		</div>
	);
}
