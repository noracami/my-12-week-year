import { useState } from "react";
import { useCategories } from "../../api/tactics";
import type { CreateTacticParams, Tactic, TacticType } from "../../api/types";
import { Button } from "../ui/Button";
import { Combobox } from "../ui/Combobox";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

interface TacticFormProps {
	initialValues?: Tactic;
	onSubmit: (params: CreateTacticParams) => void;
	isLoading?: boolean;
}

const typeOptions = [
	{ value: "daily_check", label: "每日勾選" },
	{ value: "daily_number", label: "每日數值" },
	{ value: "weekly_count", label: "每週次數" },
	{ value: "weekly_number", label: "每週數值" },
];

export function TacticForm({
	initialValues,
	onSubmit,
	isLoading,
}: TacticFormProps) {
	const { data: categories = [] } = useCategories();
	const [name, setName] = useState(initialValues?.name || "");
	const [type, setType] = useState<TacticType>(
		initialValues?.type || "daily_check",
	);
	const [targetValue, setTargetValue] = useState(
		initialValues?.targetValue?.toString() || "",
	);
	const [unit, setUnit] = useState(initialValues?.unit || "");
	const [category, setCategory] = useState(initialValues?.category || "");

	const needsTarget = type !== "daily_check";

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		const params: CreateTacticParams = {
			name: name.trim(),
			type,
		};

		if (needsTarget && targetValue) {
			params.targetValue = Number.parseFloat(targetValue);
		}
		if (needsTarget && unit.trim()) {
			params.unit = unit.trim();
		}
		if (category.trim()) {
			params.category = category.trim();
		}

		onSubmit(params);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<Input
				label="戰術名稱"
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="例如：晨跑"
				required
			/>

			<Select
				label="類型"
				value={type}
				onChange={(e) => setType(e.target.value as TacticType)}
				options={typeOptions}
			/>

			<Combobox
				label="領域"
				value={category}
				onChange={setCategory}
				options={categories}
				placeholder="例如：技術、健康"
			/>

			{needsTarget && (
				<>
					<Input
						label="目標值"
						type="number"
						value={targetValue}
						onChange={(e) => setTargetValue(e.target.value)}
						placeholder="例如：5"
						step="any"
					/>

					<Input
						label="單位"
						value={unit}
						onChange={(e) => setUnit(e.target.value)}
						placeholder="例如：次、公里、kg"
					/>
				</>
			)}

			<div className="pt-2">
				<Button
					type="submit"
					className="w-full"
					disabled={isLoading || !name.trim()}
				>
					{isLoading ? "處理中..." : initialValues ? "儲存" : "新增"}
				</Button>
			</div>
		</form>
	);
}
