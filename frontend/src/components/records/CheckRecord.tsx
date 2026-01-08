import { Checkbox } from "../ui/Checkbox";

interface CheckRecordProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}

export function CheckRecord({ checked, onChange, disabled }: CheckRecordProps) {
	return <Checkbox checked={checked} onChange={onChange} disabled={disabled} />;
}
