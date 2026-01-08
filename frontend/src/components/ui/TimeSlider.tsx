import { useMemo } from "react";

interface TimeSliderProps {
	value: number | null; // 時間數值 (如 1.5 = 01:30)
	onChange: (value: number) => void;
	startHour?: number; // 起始小時 (預設 20 = 晚上 8 點)
	endHour?: number; // 結束小時 (預設 28 = 凌晨 4 點，用 24+ 表示隔天)
	step?: number; // 分鐘間隔 (預設 15)
}

export function TimeSlider({
	value,
	onChange,
	startHour = 20,
	endHour = 28,
	step = 15,
}: TimeSliderProps) {
	const stepsPerHour = 60 / step;
	const totalSteps = (endHour - startHour) * stepsPerHour;

	// 將時間數值轉為 slider 位置
	const sliderValue = useMemo(() => {
		if (value === null) return 0;
		// 處理跨午夜：如果值 < startHour，加 24
		const adjustedValue = value < startHour ? value + 24 : value;
		return Math.round((adjustedValue - startHour) * stepsPerHour);
	}, [value, startHour, stepsPerHour]);

	// 將 slider 位置轉為時間數值
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const pos = Number(e.target.value);
		let timeValue = startHour + pos / stepsPerHour;
		// 轉回 0-24 範圍
		if (timeValue >= 24) {
			timeValue -= 24;
		}
		onChange(timeValue);
	};

	// 格式化顯示時間
	const formatTime = (val: number | null): string => {
		if (val === null) return "--:--";
		const hours = Math.floor(val) % 24;
		const minutes = Math.round((val - Math.floor(val)) * 60);
		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
	};

	// 產生刻度標籤
	const ticks = useMemo(() => {
		const labels: { pos: number; label: string }[] = [];
		for (let h = startHour; h <= endHour; h += 2) {
			const displayHour = h % 24;
			labels.push({
				pos: (h - startHour) * stepsPerHour,
				label: `${displayHour.toString().padStart(2, "0")}`,
			});
		}
		return labels;
	}, [startHour, endHour, stepsPerHour]);

	return (
		<div className="space-y-2">
			<div className="text-center text-2xl font-mono text-white">
				{formatTime(value)}
			</div>
			<input
				type="range"
				min={0}
				max={totalSteps}
				step={1}
				value={sliderValue}
				onChange={handleChange}
				className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
			/>
			<div className="flex justify-between text-xs text-gray-500 px-1">
				{ticks.map((tick) => (
					<span key={tick.pos}>{tick.label}</span>
				))}
			</div>
		</div>
	);
}
