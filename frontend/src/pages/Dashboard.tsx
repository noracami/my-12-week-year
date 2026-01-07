import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth";

export function Dashboard() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isPending && !session) {
			navigate("/login");
		}
	}, [session, isPending, navigate]);

	const handleSignOut = async () => {
		await signOut();
		navigate("/login");
	};

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-900">
				<div className="text-white">Loading...</div>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<header className="bg-gray-800 shadow">
				<div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
					<h1 className="text-xl font-bold">My 12-Week Year</h1>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							{session.user.image && (
								<img
									src={session.user.image}
									alt={session.user.name}
									className="w-8 h-8 rounded-full"
								/>
							)}
							<span className="text-sm">{session.user.name}</span>
						</div>
						<button
							type="button"
							onClick={handleSignOut}
							className="text-sm text-gray-400 hover:text-white transition-colors"
						>
							Sign out
						</button>
					</div>
				</div>
			</header>
			<main className="max-w-7xl mx-auto px-4 py-8">
				<div className="bg-gray-800 rounded-lg p-6">
					<h2 className="text-lg font-semibold mb-4">Welcome!</h2>
					<p className="text-gray-400">
						Your tactics dashboard will appear here.
					</p>
				</div>
			</main>
		</div>
	);
}
