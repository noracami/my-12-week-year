import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Tactic } from "../../api/types";
import { SortableTacticItem } from "./SortableTacticItem";
import { TacticItem } from "./TacticItem";

interface TacticListProps {
	tactics: Tactic[];
	selectedTacticIds: Set<string>;
	onEdit: (tactic: Tactic) => void;
	onDelete: (id: string) => void;
	onToggleActive: (tactic: Tactic) => void;
	onToggleWeekSelection: (tacticId: string) => void;
	onReorder?: (orderedIds: string[]) => void;
}

// 按領域分組
function groupByCategory(tactics: Tactic[]): Map<string, Tactic[]> {
	const groups = new Map<string, Tactic[]>();
	const uncategorizedKey = "";

	for (const tactic of tactics) {
		const key = tactic.category || uncategorizedKey;
		const existing = groups.get(key) || [];
		groups.set(key, [...existing, tactic]);
	}

	// 排序：有領域的在前（按字母），無領域的在後
	const sortedGroups = new Map<string, Tactic[]>();
	const keys = Array.from(groups.keys()).sort((a, b) => {
		if (a === uncategorizedKey) return 1;
		if (b === uncategorizedKey) return -1;
		return a.localeCompare(b, "zh-TW");
	});

	for (const key of keys) {
		const value = groups.get(key);
		if (value) {
			sortedGroups.set(key, value);
		}
	}

	return sortedGroups;
}

export function TacticList({
	tactics,
	selectedTacticIds,
	onEdit,
	onDelete,
	onToggleActive,
	onToggleWeekSelection,
	onReorder,
}: TacticListProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	if (tactics.length === 0) {
		return (
			<div className="text-center py-12 text-gray-400">
				尚無策略，點擊上方按鈕新增
			</div>
		);
	}

	// 先分成啟用/停用
	const activeTactics = tactics.filter((t) => t.active);
	const inactiveTactics = tactics.filter((t) => !t.active);

	// 啟用的按領域分組，並保持 sortOrder 順序
	const activeGroups = groupByCategory(
		activeTactics.sort((a, b) => a.sortOrder - b.sortOrder),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id && onReorder) {
			// 找出被拖曳的項目和目標位置
			const allActiveIds = activeTactics
				.sort((a, b) => a.sortOrder - b.sortOrder)
				.map((t) => t.id);

			const oldIndex = allActiveIds.indexOf(active.id as string);
			const newIndex = allActiveIds.indexOf(over.id as string);

			if (oldIndex !== -1 && newIndex !== -1) {
				const newOrder = [...allActiveIds];
				newOrder.splice(oldIndex, 1);
				newOrder.splice(newIndex, 0, active.id as string);

				// 加上停用的項目（保持在最後）
				const inactiveIds = inactiveTactics.map((t) => t.id);
				onReorder([...newOrder, ...inactiveIds]);
			}
		}
	};

	// 所有啟用策略的 ID（用於 SortableContext）
	const activeIds = activeTactics
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((t) => t.id);

	return (
		<div className="space-y-4">
			{/* 啟用的策略（支援拖放排序） */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={activeIds}
					strategy={verticalListSortingStrategy}
				>
					{Array.from(activeGroups.entries()).map(
						([category, groupTactics]) => (
							<div key={category || "__uncategorized__"} className="space-y-2">
								{category && (
									<div className="text-sm font-medium text-indigo-400 px-1">
										{category}
									</div>
								)}
								<div className="space-y-2">
									{groupTactics.map((tactic) => (
										<SortableTacticItem
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
							</div>
						),
					)}
				</SortableContext>
			</DndContext>

			{/* 停用的策略（不支援拖放） */}
			{inactiveTactics.length > 0 && activeTactics.length > 0 && (
				<div className="text-sm text-gray-500 pt-2 border-t border-gray-700">
					已停用
				</div>
			)}
			{inactiveTactics.length > 0 && (
				<div className="space-y-2">
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
			)}
		</div>
	);
}
