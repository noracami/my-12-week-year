import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { UpdateWeekSelectionParams, WeekTacticSelection } from "./types";

// Query Keys
export const weekSelectionsKeys = {
	all: ["weekSelections"] as const,
	byWeek: (weekStart: string) => ["weekSelections", weekStart] as const,
};

// 取得特定週的策略選擇（含沿用邏輯）
export function useWeekTacticSelection(weekStart: string) {
	return useQuery({
		queryKey: weekSelectionsKeys.byWeek(weekStart),
		queryFn: () =>
			apiClient<WeekTacticSelection>(
				`/api/week-selections?weekStart=${weekStart}`,
			),
		enabled: !!weekStart,
	});
}

// 更新特定週的策略選擇
export function useUpdateWeekSelection() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: UpdateWeekSelectionParams) =>
			apiClient<WeekTacticSelection>("/api/week-selections", {
				method: "PUT",
				body: JSON.stringify(params),
			}),
		onSuccess: (data) => {
			// 更新該週的快取
			queryClient.setQueryData(weekSelectionsKeys.byWeek(data.weekStart), data);
			// 使相關的 score 查詢失效
			queryClient.invalidateQueries({ queryKey: ["records", "score"] });
		},
	});
}

// 清除特定週的自訂選擇（沿用上週）
export function useDeleteWeekSelection() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (weekStart: string) =>
			apiClient<{ success: boolean }>(
				`/api/week-selections?weekStart=${weekStart}`,
				{
					method: "DELETE",
				},
			),
		onSuccess: (_data, weekStart) => {
			// 使該週的快取失效，讓它重新取得（會沿用上週）
			queryClient.invalidateQueries({
				queryKey: weekSelectionsKeys.byWeek(weekStart),
			});
			// 使相關的 score 查詢失效
			queryClient.invalidateQueries({ queryKey: ["records", "score"] });
		},
	});
}
