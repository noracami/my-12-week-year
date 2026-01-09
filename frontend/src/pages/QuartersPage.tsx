import { useState } from "react";
import {
	useCreateQuarter,
	useDeleteQuarter,
	useQuarters,
	useUpdateQuarter,
} from "../api/quarters";
import type { CreateQuarterParams, Quarter, QuarterGoal } from "../api/types";
import { QuarterCard } from "../components/quarters/QuarterCard";
import { QuarterForm } from "../components/quarters/QuarterForm";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";

export function QuartersPage() {
	const { data: quarters, isLoading } = useQuarters();
	const createQuarter = useCreateQuarter();
	const updateQuarter = useUpdateQuarter();
	const deleteQuarter = useDeleteQuarter();

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingQuarter, setEditingQuarter] = useState<Quarter | null>(null);

	const handleCreate = (params: CreateQuarterParams) => {
		createQuarter.mutate(params, {
			onSuccess: () => setIsFormOpen(false),
		});
	};

	const handleUpdate = (params: CreateQuarterParams) => {
		if (!editingQuarter) return;
		updateQuarter.mutate(
			{ id: editingQuarter.id, ...params },
			{
				onSuccess: () => setEditingQuarter(null),
			},
		);
	};

	const handleDelete = (id: string) => {
		if (window.confirm("確定要刪除這個季度嗎？")) {
			deleteQuarter.mutate(id);
		}
	};

	const handleStatusChange = (
		quarter: Quarter,
		status: "planning" | "active" | "completed",
	) => {
		updateQuarter.mutate({ id: quarter.id, status });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-gray-400">載入中...</div>
			</div>
		);
	}

	// 解析 goals JSON
	const parseGoals = (goalsStr: string | null): QuarterGoal[] => {
		if (!goalsStr) return [];
		try {
			return JSON.parse(goalsStr);
		} catch {
			return [];
		}
	};

	return (
		<div className="space-y-4">
			{/* 標題與新增按鈕 */}
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-semibold">季度管理</h2>
				<Button onClick={() => setIsFormOpen(true)} size="sm">
					新增季度
				</Button>
			</div>

			{/* 季度列表 */}
			{quarters && quarters.length > 0 ? (
				<div className="space-y-3">
					{quarters.map((quarter) => (
						<QuarterCard
							key={quarter.id}
							quarter={quarter}
							goals={parseGoals(quarter.goals)}
							onEdit={() => setEditingQuarter(quarter)}
							onDelete={() => handleDelete(quarter.id)}
							onStatusChange={(status) => handleStatusChange(quarter, status)}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-12 text-gray-400">
					<p>尚無季度資料</p>
					<p className="text-sm mt-2">點擊上方按鈕建立第一個季度</p>
				</div>
			)}

			{/* 新增對話框 */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen} title="新增季度">
				<QuarterForm
					onSubmit={handleCreate}
					isLoading={createQuarter.isPending}
				/>
			</Dialog>

			{/* 編輯對話框 */}
			<Dialog
				open={editingQuarter !== null}
				onOpenChange={(open) => !open && setEditingQuarter(null)}
				title="編輯季度"
			>
				{editingQuarter && (
					<QuarterForm
						initialValues={{
							name: editingQuarter.name,
							startDate: editingQuarter.startDate,
							goals: parseGoals(editingQuarter.goals),
						}}
						onSubmit={handleUpdate}
						isLoading={updateQuarter.isPending}
					/>
				)}
			</Dialog>
		</div>
	);
}
