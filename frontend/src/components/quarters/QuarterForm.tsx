import { useState } from "react";
import type { CreateQuarterParams, QuarterGoal } from "../../api/types";
import { getToday, getWeekStart } from "../../lib/date";
import { Button } from "../ui/Button";

interface QuarterFormProps {
	initialValues?: {
		name: string;
		startDate: string;
		goals: QuarterGoal[];
	};
	onSubmit: (params: CreateQuarterParams) => void;
	isLoading: boolean;
}

export function QuarterForm({
	initialValues,
	onSubmit,
	isLoading,
}: QuarterFormProps) {
	// 預設起始日為本週一
	const defaultStartDate = getWeekStart(getToday());

	const [name, setName] = useState(initialValues?.name ?? "");
	const [startDate, setStartDate] = useState(
		initialValues?.startDate ?? defaultStartDate,
	);
	const [goals, setGoals] = useState<QuarterGoal[]>(
		initialValues?.goals ?? [{ title: "" }],
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !startDate) return;

		// 過濾空目標
		const validGoals = goals.filter((g) => g.title.trim());

		onSubmit({
			name: name.trim(),
			startDate,
			goals: validGoals.length > 0 ? validGoals : undefined,
		});
	};

	const handleAddGoal = () => {
		setGoals([...goals, { title: "" }]);
	};

	const handleRemoveGoal = (index: number) => {
		setGoals(goals.filter((_, i) => i !== index));
	};

	const handleGoalChange = (
		index: number,
		field: keyof QuarterGoal,
		value: string,
	) => {
		setGoals(goals.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
	};

	// 計算結束日期（起始日 + 83 天）
	const calculateEndDate = (start: string): string => {
		const date = new Date(start);
		date.setDate(date.getDate() + 83);
		return date.toISOString().split("T")[0];
	};

	const endDate = startDate ? calculateEndDate(startDate) : "";

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* 季度名稱 */}
			<div>
				<label
					htmlFor="quarter-name"
					className="block text-sm font-medium text-gray-300 mb-1"
				>
					名稱
				</label>
				<input
					id="quarter-name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="例如：Q1 2026"
					className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					required
				/>
			</div>

			{/* 起始日期 */}
			<div>
				<label
					htmlFor="quarter-start"
					className="block text-sm font-medium text-gray-300 mb-1"
				>
					起始日期
				</label>
				<input
					id="quarter-start"
					type="date"
					value={startDate}
					onChange={(e) => setStartDate(e.target.value)}
					className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
					required
				/>
				{endDate && (
					<p className="text-xs text-gray-400 mt-1">
						結束日期：{endDate}（共 12 週）
					</p>
				)}
			</div>

			{/* 目標 */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-gray-300">目標</span>
					<button
						type="button"
						onClick={handleAddGoal}
						className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
					>
						+ 新增目標
					</button>
				</div>
				<div className="space-y-3">
					{goals.map((goal, idx) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Goals don't have stable IDs during editing
						<div key={idx} className="space-y-2">
							<div className="flex gap-2">
								<input
									type="text"
									value={goal.title}
									onChange={(e) =>
										handleGoalChange(idx, "title", e.target.value)
									}
									placeholder={`目標 ${idx + 1}`}
									className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
								{goals.length > 1 && (
									<button
										type="button"
										onClick={() => handleRemoveGoal(idx)}
										className="px-2 text-red-400 hover:text-red-300 cursor-pointer"
										aria-label="移除目標"
									>
										<svg
											className="w-5 h-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								)}
							</div>
							<textarea
								value={goal.description ?? ""}
								onChange={(e) =>
									handleGoalChange(idx, "description", e.target.value)
								}
								placeholder="目標描述（選填）"
								rows={2}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
							/>
						</div>
					))}
				</div>
			</div>

			{/* 提交按鈕 */}
			<Button
				type="submit"
				disabled={isLoading || !name.trim()}
				className="w-full"
			>
				{isLoading ? "處理中..." : initialValues ? "更新" : "建立"}
			</Button>
		</form>
	);
}
