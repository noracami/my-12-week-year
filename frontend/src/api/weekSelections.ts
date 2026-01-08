import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "./client";
import { queryClient } from "./queryClient";
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
		staleTime: 1000 * 60 * 5, // 5 分鐘（週選擇不常變動）
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

// 預取特定週的選擇
export function prefetchWeekSelection(weekStart: string) {
	return queryClient.prefetchQuery({
		queryKey: weekSelectionsKeys.byWeek(weekStart),
		queryFn: () =>
			apiClient<WeekTacticSelection>(
				`/api/week-selections?weekStart=${weekStart}`,
			),
		staleTime: 1000 * 60 * 5, // 5 分鐘
	});
}

// 預取相鄰週的 hook
export function usePrefetchAdjacentWeeks(currentWeekStart: string) {
	const prefetchAdjacent = useCallback(() => {
		const current = new Date(currentWeekStart);

		// 預取前一週
		const prevWeek = new Date(current);
		prevWeek.setDate(prevWeek.getDate() - 7);
		prefetchWeekSelection(prevWeek.toISOString().split("T")[0]);

		// 預取後一週
		const nextWeek = new Date(current);
		nextWeek.setDate(nextWeek.getDate() + 7);
		prefetchWeekSelection(nextWeek.toISOString().split("T")[0]);
	}, [currentWeekStart]);

	return prefetchAdjacent;
}
