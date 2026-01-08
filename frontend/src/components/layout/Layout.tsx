import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../../lib/auth";
import { BottomNav } from "./BottomNav";

export function Layout() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();

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
			</header>
			<main className="px-4 py-4">
				<Outlet />
			</main>
			<BottomNav />
		</div>
	);
}
