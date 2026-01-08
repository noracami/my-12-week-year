import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { signOut, useSession } from "../../lib/auth";
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

	const handleSignOut = async () => {
		await signOut();
		navigate("/login");
	};

	return (
		<div className="min-h-screen bg-gray-900 text-white pb-20">
			<header className="sticky top-0 z-20 bg-gray-800/95 backdrop-blur border-b border-gray-700">
				<div className="px-4 py-3 flex justify-between items-center">
					<h1 className="text-lg font-bold">My 12-Week Year</h1>
					<div className="flex items-center gap-3">
						{session.user.image && (
							<img
								src={session.user.image}
								alt={session.user.name || "使用者"}
								className="w-8 h-8 rounded-full"
							/>
						)}
						<button
							type="button"
							onClick={handleSignOut}
							className="text-sm text-gray-400 hover:text-white transition-colors"
						>
							登出
						</button>
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
