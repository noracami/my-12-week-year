import { NumberInput } from "../ui/NumberInput";

interface NumberRecordProps {
	value: number | null;
	onChange: (value: number | null) => void;
	unit?: string | null;
	disabled?: boolean;
}

export function NumberRecord({
	value,
	onChange,
	unit,
	disabled,
}: NumberRecordProps) {
	return (
		<NumberInput
			value={value}
			onChange={onChange}
			unit={unit}
			disabled={disabled}
		/>
	);
}
