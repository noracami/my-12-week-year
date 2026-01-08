import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

interface SelectOption {
	value: string;
	label: string;
}

interface SelectProps
	extends Omit<ComponentPropsWithoutRef<"select">, "children"> {
	label?: string;
	options: SelectOption[];
	error?: string;
	placeholder?: string;
}

export function Select({
	label,
	options,
	error,
	placeholder,
	className,
	id,
	...props
}: SelectProps) {
	const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

	return (
		<div className="space-y-1">
			{label && (
				<label
					htmlFor={selectId}
					className="block text-sm font-medium text-gray-300"
				>
					{label}
				</label>
			)}
			<select
				id={selectId}
				className={cn(
					"w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600",
					"focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
					error && "border-red-500 focus:border-red-500 focus:ring-red-500",
					className,
				)}
				{...props}
			>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{error && <p className="text-sm text-red-400">{error}</p>}
		</div>
	);
}
