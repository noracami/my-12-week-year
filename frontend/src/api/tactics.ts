import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { CreateTacticParams, Tactic, UpdateTacticParams } from "./types";

// Query Keys
export const tacticsKeys = {
	all: ["tactics"] as const,
	detail: (id: string) => ["tactics", id] as const,
	categories: ["tactics", "categories"] as const,
};

// 取得所有戰術
export function useTactics() {
	return useQuery({
		queryKey: tacticsKeys.all,
		queryFn: () => apiClient<{ tactics: Tactic[] }>("/api/tactics"),
		select: (data) => data.tactics,
	});
}

// 取得用戶已使用的 categories
export function useCategories() {
	return useQuery({
		queryKey: tacticsKeys.categories,
		queryFn: () =>
			apiClient<{ categories: string[] }>("/api/tactics/categories"),
		select: (data) => data.categories,
	});
}

// 新增戰術
export function useCreateTactic() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: CreateTacticParams) =>
			apiClient<{ tactic: Tactic }>("/api/tactics", {
				method: "POST",
				body: JSON.stringify(params),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tacticsKeys.all });
			queryClient.invalidateQueries({ queryKey: tacticsKeys.categories });
		},
	});
}

// 更新戰術 - 使用樂觀更新
export function useUpdateTactic() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...params }: UpdateTacticParams & { id: string }) =>
			apiClient<{ tactic: Tactic }>(`/api/tactics/${id}`, {
				method: "PUT",
				body: JSON.stringify(params),
			}),
		onMutate: async (updatedTactic) => {
			// 取消相關查詢
			await queryClient.cancelQueries({ queryKey: tacticsKeys.all });

			// 儲存之前的狀態
			const previousTactics = queryClient.getQueryData<{ tactics: Tactic[] }>(
				tacticsKeys.all,
			);

			// 樂觀更新
			queryClient.setQueryData<{ tactics: Tactic[] }>(
				tacticsKeys.all,
				(old) => {
					if (!old) return { tactics: [] };
					return {
						tactics: old.tactics.map((t) =>
							t.id === updatedTactic.id ? { ...t, ...updatedTactic } : t,
						),
					};
				},
			);

			return { previousTactics };
		},
		onError: (_err, _updatedTactic, context) => {
			// 發生錯誤時回滾
			if (context?.previousTactics) {
				queryClient.setQueryData(tacticsKeys.all, context.previousTactics);
			}
		},
		onSettled: () => {
			// 無論成功失敗，最後都重新取得資料確保同步
			queryClient.invalidateQueries({ queryKey: tacticsKeys.all });
			queryClient.invalidateQueries({ queryKey: tacticsKeys.categories });
		},
	});
}

// 刪除戰術
export function useDeleteTactic() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			apiClient<{ success: boolean }>(`/api/tactics/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tacticsKeys.all });
		},
	});
}

// 重新排序戰術 - 使用樂觀更新
export function useReorderTactics() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (orderedIds: string[]) =>
			apiClient<{ success: boolean }>("/api/tactics/reorder", {
				method: "PUT",
				body: JSON.stringify({ orderedIds }),
			}),
		onMutate: async (orderedIds) => {
			await queryClient.cancelQueries({ queryKey: tacticsKeys.all });

			const previousTactics = queryClient.getQueryData<{ tactics: Tactic[] }>(
				tacticsKeys.all,
			);

			// 樂觀更新：按新順序重新排列並更新 sortOrder
			queryClient.setQueryData<{ tactics: Tactic[] }>(
				tacticsKeys.all,
				(old) => {
					if (!old) return { tactics: [] };
					const tacticMap = new Map(old.tactics.map((t) => [t.id, t]));
					const reorderedTactics = orderedIds
						.map((id, index) => {
							const tactic = tacticMap.get(id);
							return tactic ? { ...tactic, sortOrder: index } : null;
						})
						.filter((t): t is Tactic => t !== null);

					// 加入不在 orderedIds 中的戰術（保持原順序）
					const orderedSet = new Set(orderedIds);
					const remaining = old.tactics.filter((t) => !orderedSet.has(t.id));

					return { tactics: [...reorderedTactics, ...remaining] };
				},
			);

			return { previousTactics };
		},
		onError: (_err, _orderedIds, context) => {
			if (context?.previousTactics) {
				queryClient.setQueryData(tacticsKeys.all, context.previousTactics);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: tacticsKeys.all });
		},
	});
}
