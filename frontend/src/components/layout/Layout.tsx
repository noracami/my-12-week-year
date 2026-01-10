import { useEffect, useState } from "react";
import { Link, Outlet, useMatch, useNavigate } from "react-router-dom";
import { useGuild } from "../../api/guilds";
import { useCurrentGuild } from "../../hooks/useCurrentGuild";
import { useSession } from "../../lib/auth";
import { BottomNav } from "./BottomNav";

export function Layout() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const [isGuildSelectorOpen, setIsGuildSelectorOpen] = useState(false);

	// Current guild from user selection
	const { currentGuild, guilds, guildsLoading, selectGuild, hasGuilds } =
		useCurrentGuild();

	// Detect guild context from route (for guild pages)
	const guildMatch = useMatch("/guilds/:id");
	const memberMatch = useMatch("/guilds/:guildId/members/:userId");
	const routeGuildId =
		guildMatch?.params.id || memberMatch?.params.guildId || "";
	const { data: routeGuild } = useGuild(routeGuildId);

	// Use route guild if on guild page, otherwise use current selection
	const displayGuild = routeGuild || currentGuild;
	const isOnGuildPage = !!routeGuildId;

	useEffect(() => {
		if (!isPending && !session) {
			navigate("/login");
		}
	}, [session, isPending, navigate]);

	// Close selector when clicking outside
	useEffect(() => {
		const handleClickOutside = () => setIsGuildSelectorOpen(false);
		if (isGuildSelectorOpen) {
			document.addEventListener("click", handleClickOutside);
			return () => document.removeEventListener("click", handleClickOutside);
		}
	}, [isGuildSelectorOpen]);

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-900">
				<div className="text-white">載入中...</div>
			</div>
		);
	}

	if (!session) return null;

	const renderGuildBar = () => {
		// Loading state
		if (guildsLoading) {
			return (
				<div className="px-4 py-2 bg-gray-700/50 border-t border-gray-600/50">
					<span className="text-sm text-gray-400">載入群組中...</span>
				</div>
			);
		}

		// No guilds joined
		if (!hasGuilds) {
			return (
				<div className="px-4 py-2 bg-gray-700/50 border-t border-gray-600/50">
					<Link
						to="/settings"
						className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-2"
					>
						<span className="text-gray-500">○</span>
						尚未加入群組
					</Link>
				</div>
			);
		}

		// On guild page - show route guild (non-interactive)
		if (isOnGuildPage && routeGuild) {
			return (
				<div className="px-4 py-2 bg-indigo-900/50 border-t border-indigo-800/50">
					<Link
						to={`/guilds/${routeGuild.id}`}
						className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-2"
					>
						<span className="text-indigo-400">●</span>
						{routeGuild.name}
					</Link>
				</div>
			);
		}

		// On other pages - show selector
		return (
			<div className="px-4 py-2 bg-indigo-900/50 border-t border-indigo-800/50 relative">
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setIsGuildSelectorOpen(!isGuildSelectorOpen);
					}}
					className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-2 cursor-pointer w-full"
				>
					<span className="text-indigo-400">●</span>
					<span className="flex-1 text-left">{displayGuild?.name}</span>
					<span className="text-indigo-400 text-xs">
						{isGuildSelectorOpen ? "▲" : "▼"}
					</span>
				</button>

				{/* Dropdown */}
				{isGuildSelectorOpen && (
					<div className="absolute left-0 right-0 top-full bg-gray-800 border border-gray-700 rounded-b-lg shadow-lg z-30">
						{guilds.map((guild) => (
							<button
								key={guild.id}
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									selectGuild(guild.id);
									setIsGuildSelectorOpen(false);
								}}
								className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-2 ${
									guild.id === currentGuild?.id
										? "text-indigo-300 bg-indigo-900/30"
										: "text-gray-300"
								}`}
							>
								<span
									className={
										guild.id === currentGuild?.id
											? "text-indigo-400"
											: "text-gray-500"
									}
								>
									{guild.id === currentGuild?.id ? "●" : "○"}
								</span>
								{guild.name}
							</button>
						))}
						<Link
							to="/settings"
							onClick={() => setIsGuildSelectorOpen(false)}
							className="w-full px-4 py-2 text-sm text-left text-gray-500 hover:bg-gray-700 hover:text-gray-300 transition-colors flex items-center gap-2 border-t border-gray-700"
						>
							<span>+</span>
							管理群組
						</Link>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-gray-900 text-white pb-20">
			<header className="sticky top-0 z-20 bg-gray-800/95 backdrop-blur border-b border-gray-700">
				<div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
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
				<div className="max-w-3xl mx-auto">{renderGuildBar()}</div>
			</header>
			<main className="max-w-3xl mx-auto px-4 py-4">
				<Outlet />
			</main>
			<BottomNav />
		</div>
	);
}
