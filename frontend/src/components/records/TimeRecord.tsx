import { TimeSlider } from "../ui/TimeSlider";

interface TimeRecordProps {
	value: number | null;
	onChange: (value: number | null) => void;
}

export function TimeRecord({ value, onChange }: TimeRecordProps) {
	return (
		<div className="w-full">
			<TimeSlider value={value} onChange={(v) => onChange(v)} />
		</div>
	);
}
