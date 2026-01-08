import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
	variant?: "primary" | "secondary" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
}

const variants = {
	primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800",
	secondary: "bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-500",
	danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
	ghost: "bg-transparent text-gray-300 hover:bg-gray-700 active:bg-gray-600",
};

const sizes = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-base",
	lg: "px-6 py-3 text-lg",
};

export function Button({
	variant = "primary",
	size = "md",
	className,
	...props
}: ButtonProps) {
	return (
		<button
			type="button"
			className={cn(
				"rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
				variants[variant],
				sizes[size],
				className,
			)}
			{...props}
		/>
	);
}
