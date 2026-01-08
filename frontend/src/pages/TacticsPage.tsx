import { useState } from "react";
import {
	useCreateTactic,
	useDeleteTactic,
	useTactics,
	useUpdateTactic,
} from "../api/tactics";
import type { CreateTacticParams, Tactic } from "../api/types";
import { TacticForm } from "../components/tactics/TacticForm";
import { TacticList } from "../components/tactics/TacticList";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";

export function TacticsPage() {
	const { data: tactics, isLoading } = useTactics();
	const createTactic = useCreateTactic();
	const updateTactic = useUpdateTactic();
	const deleteTactic = useDeleteTactic();

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingTactic, setEditingTactic] = useState<Tactic | null>(null);

	const handleCreate = (params: CreateTacticParams) => {
		createTactic.mutate(params, {
			onSuccess: () => setIsFormOpen(false),
		});
	};

	const handleUpdate = (params: CreateTacticParams) => {
		if (!editingTactic) return;
		updateTactic.mutate(
			{ id: editingTactic.id, ...params },
			{
				onSuccess: () => setEditingTactic(null),
			},
		);
	};

	const handleDelete = (id: string) => {
		if (window.confirm("確定要刪除這個策略嗎？")) {
			deleteTactic.mutate(id);
		}
	};

	const handleToggleActive = (tactic: Tactic) => {
		updateTactic.mutate({ id: tactic.id, active: !tactic.active });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-gray-400">載入中...</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-semibold">策略管理</h2>
				<Button onClick={() => setIsFormOpen(true)} size="sm">
					新增策略
				</Button>
			</div>

			<TacticList
				tactics={tactics || []}
				onEdit={(tactic) => setEditingTactic(tactic)}
				onDelete={handleDelete}
				onToggleActive={handleToggleActive}
			/>

			{/* 新增對話框 */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen} title="新增策略">
				<TacticForm
					onSubmit={handleCreate}
					isLoading={createTactic.isPending}
				/>
			</Dialog>

			{/* 編輯對話框 */}
			<Dialog
				open={editingTactic !== null}
				onOpenChange={(open) => !open && setEditingTactic(null)}
				title="編輯策略"
			>
				{editingTactic && (
					<TacticForm
						initialValues={editingTactic}
						onSubmit={handleUpdate}
						isLoading={updateTactic.isPending}
					/>
				)}
			</Dialog>
		</div>
	);
}
