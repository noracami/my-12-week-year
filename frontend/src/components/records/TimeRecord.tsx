interface TimeRecordProps {
	value: number | null;
	onChange: (value: number | null) => void;
}

// 將時間數值轉為 HH:MM 格式
function timeValueToString(value: number | null): string {
	if (value === null) return "";
	const hours = Math.floor(value);
	const minutes = Math.round((value - hours) * 60);
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// 將 HH:MM 格式轉為數值
function timeStringToValue(timeStr: string): number {
	const [hours, minutes] = timeStr.split(":").map(Number);
	return hours + minutes / 60;
}

export function TimeRecord({ value, onChange }: TimeRecordProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const timeStr = e.target.value;
		if (timeStr) {
			onChange(timeStringToValue(timeStr));
		} else {
			onChange(null);
		}
	};

	return (
		<input
			type="time"
			value={timeValueToString(value)}
			onChange={handleChange}
			className="w-24 rounded-lg border border-gray-700 bg-gray-900 px-2 py-1 text-white text-center focus:border-blue-500 focus:outline-none cursor-pointer"
		/>
	);
}
