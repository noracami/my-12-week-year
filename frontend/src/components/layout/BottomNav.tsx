import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

const navItems = [
	{ path: "/", label: "今日", icon: "CheckIcon" },
	{ path: "/tactics", label: "戰術", icon: "TargetIcon" },
	{ path: "/score", label: "得分", icon: "ChartIcon" },
];

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	);
}

function TargetIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
			/>
		</svg>
	);
}

function ChartIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
			/>
		</svg>
	);
}

const iconComponents = {
	CheckIcon,
	TargetIcon,
	ChartIcon,
};

export function BottomNav() {
	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-30">
			<div className="flex justify-around items-center h-16">
				{navItems.map((item) => {
					const Icon = iconComponents[item.icon as keyof typeof iconComponents];
					return (
						<NavLink
							key={item.path}
							to={item.path}
							className={({ isActive }) =>
								cn(
									"flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[64px]",
									isActive ? "text-indigo-400" : "text-gray-400",
								)
							}
						>
							<Icon className="w-6 h-6" />
							<span className="text-xs">{item.label}</span>
						</NavLink>
					);
				})}
			</div>
		</nav>
	);
}
