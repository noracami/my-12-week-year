import { useState } from "react";
import { useCategories } from "../../api/tactics";
import type {
	CreateTacticParams,
	Tactic,
	TacticType,
	TargetDirection,
} from "../../api/types";
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
	{ value: "daily_time", label: "每日時間" },
	{ value: "weekly_count", label: "每週次數" },
	{ value: "weekly_number", label: "每週數值" },
];

const directionOptions = [
	{ value: "gte", label: "至少" },
	{ value: "lte", label: "不超過" },
];

// 將時間數值轉為 HH:MM 格式
function timeValueToString(value: number | null): string {
	if (value === null) return "00:00";
	const hours = Math.floor(value);
	const minutes = Math.round((value - hours) * 60);
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// 將 HH:MM 格式轉為數值
function timeStringToValue(timeStr: string): number {
	const [hours, minutes] = timeStr.split(":").map(Number);
	return hours + minutes / 60;
}

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
	const [targetDirection, setTargetDirection] = useState<TargetDirection>(
		initialValues?.targetDirection || "gte",
	);
	const [targetTime, setTargetTime] = useState(
		initialValues?.type === "daily_time"
			? timeValueToString(initialValues?.targetValue)
			: "00:00",
	);
	const [unit, setUnit] = useState(initialValues?.unit || "");
	const [category, setCategory] = useState(initialValues?.category || "");

	const needsTarget = type !== "daily_check";
	const isTimeType = type === "daily_time";

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		const params: CreateTacticParams = {
			name: name.trim(),
			type,
		};

		if (needsTarget) {
			// 時間類型使用 targetTime，其他類型使用 targetValue
			if (isTimeType) {
				params.targetValue = timeStringToValue(targetTime);
			} else if (targetValue) {
				params.targetValue = Number.parseFloat(targetValue);
			}
			params.targetDirection = targetDirection;
		}
		if (needsTarget && !isTimeType && unit.trim()) {
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
					<Select
						label="目標方向"
						value={targetDirection}
						onChange={(e) =>
							setTargetDirection(e.target.value as TargetDirection)
						}
						options={directionOptions}
					/>

					{isTimeType ? (
						<div className="space-y-1">
							<label
								htmlFor="target-time"
								className="block text-sm font-medium text-gray-300"
							>
								目標時間
							</label>
							<input
								id="target-time"
								type="time"
								value={targetTime}
								onChange={(e) => setTargetTime(e.target.value)}
								className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
							/>
							<p className="text-xs text-gray-500">
								例如：01:00 表示凌晨 1 點前
							</p>
						</div>
					) : (
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
