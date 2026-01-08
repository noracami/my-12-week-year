import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { CreateTacticParams, Tactic, UpdateTacticParams } from "./types";

// Query Keys
export const tacticsKeys = {
	all: ["tactics"] as const,
	detail: (id: string) => ["tactics", id] as const,
};

// 取得所有戰術
export function useTactics() {
	return useQuery({
		queryKey: tacticsKeys.all,
		queryFn: () => apiClient<{ tactics: Tactic[] }>("/api/tactics"),
		select: (data) => data.tactics,
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
		},
	});
}

// 更新戰術
export function useUpdateTactic() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...params }: UpdateTacticParams & { id: string }) =>
			apiClient<{ tactic: Tactic }>(`/api/tactics/${id}`, {
				method: "PUT",
				body: JSON.stringify(params),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tacticsKeys.all });
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
