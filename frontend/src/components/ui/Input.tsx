import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
	label?: string;
	error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
	const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

	return (
		<div className="space-y-1">
			{label && (
				<label
					htmlFor={inputId}
					className="block text-sm font-medium text-gray-300"
				>
					{label}
				</label>
			)}
			<input
				id={inputId}
				className={cn(
					"w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600",
					"focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
					"placeholder:text-gray-400",
					error && "border-red-500 focus:border-red-500 focus:ring-red-500",
					className,
				)}
				{...props}
			/>
			{error && <p className="text-sm text-red-400">{error}</p>}
		</div>
	);
}
