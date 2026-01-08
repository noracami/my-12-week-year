import { useEffect, useState } from "react";
import {
	useCreateTactic,
	useDeleteTactic,
	useReorderTactics,
	useTactics,
	useUpdateTactic,
} from "../api/tactics";
import type { CreateTacticParams, Tactic } from "../api/types";
import {
	useDeleteWeekSelection,
	usePrefetchAdjacentWeeks,
	useUpdateWeekSelection,
	useWeekTacticSelection,
} from "../api/weekSelections";
import { TacticForm } from "../components/tactics/TacticForm";
import { TacticList } from "../components/tactics/TacticList";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { useWeekRange } from "../hooks/useWeekRange";
import { cn } from "../lib/cn";

export function TacticsPage() {
	// 週切換，允許前往下週（提前編輯）
	const {
		startDate: weekStart,
		weekLabel,
		goToPrevWeek,
		goToNextWeek,
		canGoNext,
		isCurrentWeek,
		isNextWeek,
	} = useWeekRange({ allowFutureWeeks: 1 });

	const { data: tactics, isLoading } = useTactics();
	const { data: weekSelection, isLoading: weekSelectionLoading } =
		useWeekTacticSelection(weekStart);

	const createTactic = useCreateTactic();
	const updateTactic = useUpdateTactic();
	const deleteTactic = useDeleteTactic();
	const reorderTactics = useReorderTactics();
	const updateWeekSelection = useUpdateWeekSelection();
	const deleteWeekSelection = useDeleteWeekSelection();

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingTactic, setEditingTactic] = useState<Tactic | null>(null);

	// 預取相鄰週
	const prefetchAdjacentWeeks = usePrefetchAdjacentWeeks(weekStart);
	useEffect(() => {
		prefetchAdjacentWeeks();
	}, [prefetchAdjacentWeeks]);

	// 當前週選中的策略 ID
	const selectedTacticIds = new Set(weekSelection?.tacticIds ?? []);

	const handleCreate = (params: CreateTacticParams) => {
		createTactic.mutate(params, {
			onSuccess: (data) => {
				setIsFormOpen(false);
				// 新策略自動加入當週選擇
				if (weekSelection) {
					updateWeekSelection.mutate({
						weekStart,
						tacticIds: [...weekSelection.tacticIds, data.tactic.id],
					});
				}
			},
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

	// 切換策略是否在本週計分
	const handleToggleWeekSelection = (tacticId: string) => {
		if (!weekSelection) return;

		const newTacticIds = selectedTacticIds.has(tacticId)
			? weekSelection.tacticIds.filter((id) => id !== tacticId)
			: [...weekSelection.tacticIds, tacticId];

		updateWeekSelection.mutate({
			weekStart,
			tacticIds: newTacticIds,
		});
	};

	// 沿用上週
	const handleResetToDefault = () => {
		if (window.confirm("確定要清除本週的自訂選擇，改為沿用上週嗎？")) {
			deleteWeekSelection.mutate(weekStart);
		}
	};

	// 處理拖放排序
	const handleReorder = (orderedIds: string[]) => {
		reorderTactics.mutate(orderedIds);
	};

	if (isLoading || weekSelectionLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-gray-400">載入中...</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* 週切換器 */}
			<div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
				<button
					type="button"
					onClick={goToPrevWeek}
					className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
					aria-label="上週"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				<div className="text-center">
					<span className="text-white font-medium">{weekLabel}</span>
					{isCurrentWeek && (
						<span className="block text-xs text-indigo-400">本週</span>
					)}
					{isNextWeek && (
						<span className="block text-xs text-green-400">下週</span>
					)}
				</div>

				<button
					type="button"
					onClick={goToNextWeek}
					disabled={!canGoNext}
					className={cn(
						"p-2 transition-colors",
						canGoNext
							? "text-gray-400 hover:text-white cursor-pointer"
							: "text-gray-600 cursor-not-allowed",
					)}
					aria-label="下週"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>

			{/* 自訂提示與沿用按鈕 */}
			{weekSelection?.isCustom && (
				<div className="flex items-center justify-between bg-indigo-900/30 rounded-lg px-4 py-2">
					<span className="text-sm text-indigo-300">已自訂本週計分策略</span>
					<button
						type="button"
						onClick={handleResetToDefault}
						className="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer"
					>
						沿用上週
					</button>
				</div>
			)}

			{/* 標題與新增按鈕 */}
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-semibold">策略管理</h2>
				<Button onClick={() => setIsFormOpen(true)} size="sm">
					新增策略
				</Button>
			</div>

			<TacticList
				tactics={tactics || []}
				selectedTacticIds={selectedTacticIds}
				onEdit={(tactic) => setEditingTactic(tactic)}
				onDelete={handleDelete}
				onToggleActive={handleToggleActive}
				onToggleWeekSelection={handleToggleWeekSelection}
				onReorder={handleReorder}
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
