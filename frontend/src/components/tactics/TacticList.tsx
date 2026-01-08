import type { Tactic } from "../../api/types";
import { TacticItem } from "./TacticItem";

interface TacticListProps {
	tactics: Tactic[];
	selectedTacticIds: Set<string>;
	onEdit: (tactic: Tactic) => void;
	onDelete: (id: string) => void;
	onToggleActive: (tactic: Tactic) => void;
	onToggleWeekSelection: (tacticId: string) => void;
}

export function TacticList({
	tactics,
	selectedTacticIds,
	onEdit,
	onDelete,
	onToggleActive,
	onToggleWeekSelection,
}: TacticListProps) {
	if (tactics.length === 0) {
		return (
			<div className="text-center py-12 text-gray-400">
				尚無策略，點擊上方按鈕新增
			</div>
		);
	}

	// 將戰術分組：啟用的在前，停用的在後
	const activeTactics = tactics.filter((t) => t.active);
	const inactiveTactics = tactics.filter((t) => !t.active);

	return (
		<div className="space-y-3">
			{activeTactics.map((tactic) => (
				<TacticItem
					key={tactic.id}
					tactic={tactic}
					isSelected={selectedTacticIds.has(tactic.id)}
					onEdit={onEdit}
					onDelete={onDelete}
					onToggleActive={onToggleActive}
					onToggleWeekSelection={onToggleWeekSelection}
				/>
			))}
			{inactiveTactics.length > 0 && activeTactics.length > 0 && (
				<div className="text-sm text-gray-500 pt-2">已停用</div>
			)}
			{inactiveTactics.map((tactic) => (
				<TacticItem
					key={tactic.id}
					tactic={tactic}
					isSelected={selectedTacticIds.has(tactic.id)}
					onEdit={onEdit}
					onDelete={onDelete}
					onToggleActive={onToggleActive}
					onToggleWeekSelection={onToggleWeekSelection}
				/>
			))}
		</div>
	);
}
