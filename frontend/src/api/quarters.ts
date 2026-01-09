import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
	ActiveQuarterInfo,
	CreateQuarterParams,
	Quarter,
	Tactic,
	UpdateQuarterParams,
} from "./types";

// Query Keys
export const quartersKeys = {
	all: ["quarters"] as const,
	detail: (id: string) => ["quarters", id] as const,
	active: ["quarters", "active"] as const,
};

// 取得所有季度
export function useQuarters() {
	return useQuery({
		queryKey: quartersKeys.all,
		queryFn: () => apiClient<{ quarters: Quarter[] }>("/api/quarters"),
		select: (data) => data.quarters,
	});
}

// 取得當前進行中的季度
export function useActiveQuarter() {
	return useQuery({
		queryKey: quartersKeys.active,
		queryFn: () => apiClient<ActiveQuarterInfo>("/api/quarters/active"),
	});
}

// 取得單一季度詳情（含關聯策略）
export function useQuarter(id: string | null) {
	return useQuery({
		queryKey: quartersKeys.detail(id ?? ""),
		queryFn: () =>
			apiClient<{ quarter: Quarter; tactics: Tactic[] }>(`/api/quarters/${id}`),
		enabled: !!id,
	});
}

// 新增季度
export function useCreateQuarter() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: CreateQuarterParams) =>
			apiClient<{ quarter: Quarter }>("/api/quarters", {
				method: "POST",
				body: JSON.stringify(params),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: quartersKeys.all });
			queryClient.invalidateQueries({ queryKey: quartersKeys.active });
		},
	});
}

// 更新季度
export function useUpdateQuarter() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...params }: UpdateQuarterParams & { id: string }) =>
			apiClient<{ quarter: Quarter }>(`/api/quarters/${id}`, {
				method: "PUT",
				body: JSON.stringify(params),
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: quartersKeys.all });
			queryClient.invalidateQueries({
				queryKey: quartersKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: quartersKeys.active });
		},
	});
}

// 刪除季度
export function useDeleteQuarter() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			apiClient<{ success: boolean }>(`/api/quarters/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: quartersKeys.all });
			queryClient.invalidateQueries({ queryKey: quartersKeys.active });
		},
	});
}
