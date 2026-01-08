import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

interface ComboboxProps {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
	placeholder?: string;
	error?: string;
}

export function Combobox({
	label,
	value,
	onChange,
	options,
	placeholder,
	error,
}: ComboboxProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState(value);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// 過濾選項
	const filteredOptions = options.filter(
		(option) =>
			option.toLowerCase().includes(inputValue.toLowerCase()) &&
			option !== inputValue,
	);

	// 是否顯示「新增」選項
	const showAddOption =
		inputValue.trim() !== "" &&
		!options.some(
			(option) => option.toLowerCase() === inputValue.toLowerCase(),
		);

	// 同步外部 value 變更
	useEffect(() => {
		setInputValue(value);
	}, [value]);

	// 點擊外部關閉
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		setIsOpen(true);
	};

	const handleSelect = (option: string) => {
		setInputValue(option);
		onChange(option);
		setIsOpen(false);
	};

	const handleBlur = () => {
		// 延遲關閉以允許點擊選項
		setTimeout(() => {
			if (inputValue.trim() && inputValue !== value) {
				onChange(inputValue.trim());
			}
		}, 150);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (inputValue.trim()) {
				onChange(inputValue.trim());
				setIsOpen(false);
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
			inputRef.current?.blur();
		}
	};

	const inputId = label?.toLowerCase().replace(/\s+/g, "-");

	return (
		<div ref={containerRef} className="relative space-y-1">
			{label && (
				<label
					htmlFor={inputId}
					className="block text-sm font-medium text-gray-300"
				>
					{label}
				</label>
			)}
			<input
				ref={inputRef}
				id={inputId}
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				onFocus={() => setIsOpen(true)}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				className={cn(
					"w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600",
					"focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
					"placeholder:text-gray-400",
					error && "border-red-500 focus:border-red-500 focus:ring-red-500",
				)}
			/>

			{/* 下拉選單 */}
			{isOpen && (filteredOptions.length > 0 || showAddOption) && (
				<ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg bg-gray-700 border border-gray-600 shadow-lg">
					{filteredOptions.map((option) => (
						<li key={option}>
							<button
								type="button"
								onClick={() => handleSelect(option)}
								className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 focus:bg-gray-600 focus:outline-none"
							>
								{option}
							</button>
						</li>
					))}
					{showAddOption && (
						<li>
							<button
								type="button"
								onClick={() => handleSelect(inputValue.trim())}
								className="w-full px-3 py-2 text-left text-indigo-400 hover:bg-gray-600 focus:bg-gray-600 focus:outline-none"
							>
								新增「{inputValue.trim()}」
							</button>
						</li>
					)}
				</ul>
			)}

			{error && <p className="text-sm text-red-400">{error}</p>}
		</div>
	);
}
