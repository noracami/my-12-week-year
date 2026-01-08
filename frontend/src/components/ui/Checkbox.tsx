import { Checkbox as BaseCheckbox } from "@base-ui-components/react/checkbox";
import { cn } from "../../lib/cn";

interface CheckboxProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	size?: "md" | "lg";
}

export function Checkbox({
	checked,
	onChange,
	disabled,
	size = "lg",
}: CheckboxProps) {
	const sizeClasses = size === "lg" ? "w-11 h-11" : "w-6 h-6";
	const iconSize = size === "lg" ? "w-6 h-6" : "w-4 h-4";

	return (
		<BaseCheckbox.Root
			checked={checked}
			onCheckedChange={onChange}
			disabled={disabled}
			className={cn(
				"rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer",
				sizeClasses,
				checked
					? "bg-green-500 border-green-500"
					: "bg-gray-700 border-gray-600 hover:border-gray-500",
				disabled && "opacity-50 cursor-not-allowed",
			)}
		>
			<BaseCheckbox.Indicator>
				<svg
					className={cn("text-white", iconSize)}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={3}
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</BaseCheckbox.Indicator>
		</BaseCheckbox.Root>
	);
}
