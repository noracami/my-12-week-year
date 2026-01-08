import { cn } from "../../lib/cn";

interface NumberInputProps {
	value: number | null;
	onChange: (value: number | null) => void;
	min?: number;
	max?: number;
	step?: number;
	unit?: string | null;
	disabled?: boolean;
}

export function NumberInput({
	value,
	onChange,
	min,
	max,
	step = 1,
	unit,
	disabled,
}: NumberInputProps) {
	const handleDecrement = () => {
		const newValue = (value ?? 0) - step;
		if (min !== undefined && newValue < min) return;
		onChange(newValue);
	};

	const handleIncrement = () => {
		const newValue = (value ?? 0) + step;
		if (max !== undefined && newValue > max) return;
		onChange(newValue);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;
		if (inputValue === "") {
			onChange(null);
			return;
		}
		const numValue = Number.parseFloat(inputValue);
		if (Number.isNaN(numValue)) return;
		if (min !== undefined && numValue < min) return;
		if (max !== undefined && numValue > max) return;
		onChange(numValue);
	};

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={handleDecrement}
				disabled={disabled || (min !== undefined && (value ?? 0) <= min)}
				className={cn(
					"w-10 h-10 rounded-lg bg-gray-700 text-white flex items-center justify-center text-xl font-bold",
					"hover:bg-gray-600 active:bg-gray-500 transition-colors",
					"disabled:opacity-50 disabled:cursor-not-allowed",
				)}
			>
				-
			</button>
			<input
				type="number"
				value={value ?? ""}
				onChange={handleInputChange}
				disabled={disabled}
				min={min}
				max={max}
				step={step}
				className={cn(
					"w-20 h-10 rounded-lg bg-gray-800 text-white text-center text-lg",
					"border border-gray-600 focus:border-indigo-500 focus:outline-none",
					"disabled:opacity-50 disabled:cursor-not-allowed",
					"[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
				)}
			/>
			<button
				type="button"
				onClick={handleIncrement}
				disabled={disabled || (max !== undefined && (value ?? 0) >= max)}
				className={cn(
					"w-10 h-10 rounded-lg bg-gray-700 text-white flex items-center justify-center text-xl font-bold",
					"hover:bg-gray-600 active:bg-gray-500 transition-colors",
					"disabled:opacity-50 disabled:cursor-not-allowed",
				)}
			>
				+
			</button>
			{unit && <span className="text-gray-400 text-sm">{unit}</span>}
		</div>
	);
}
