import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "./client";
import { queryClient } from "./queryClient";
import type {
	CreateRecordParams,
	GetRecordsParams,
	GetScoreParams,
	Record,
	ScoreDetail,
} from "./types";

// Query Keys
export const recordsKeys = {
	all: ["records"] as const,
	byDate: (startDate: string, endDate: string) =>
		["records", startDate, endDate] as const,
	byTactic: (tacticId: string) => ["records", "tactic", tacticId] as const,
	score: (startDate: string, endDate: string) =>
		["records", "score", startDate, endDate] as const,
};

// 取得記錄
export function useRecords(params: GetRecordsParams) {
	const queryParams = new URLSearchParams();
	if (params.startDate) queryParams.set("startDate", params.startDate);
	if (params.endDate) queryParams.set("endDate", params.endDate);
	if (params.tacticId) queryParams.set("tacticId", params.tacticId);

	return useQuery({
		queryKey: recordsKeys.byDate(params.startDate || "", params.endDate || ""),
		queryFn: () =>
			apiClient<{ records: Record[] }>(
				`/api/records?${queryParams.toString()}`,
			),
		select: (data) => data.records,
		enabled: Boolean(params.startDate && params.endDate),
	});
}

// 新增/更新記錄（Upsert）- 使用樂觀更新
export function useUpsertRecord() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: CreateRecordParams) =>
			apiClient<{ record: Record }>("/api/records", {
				method: "POST",
				body: JSON.stringify(params),
			}),
		onMutate: async (newRecord) => {
			// 取消相關查詢以避免覆蓋樂觀更新
			await queryClient.cancelQueries({
				queryKey: recordsKeys.byDate(newRecord.date, newRecord.date),
			});

			// 儲存之前的狀態
			const previousRecords = queryClient.getQueryData<{ records: Record[] }>(
				recordsKeys.byDate(newRecord.date, newRecord.date),
			);

			// 樂觀更新
			queryClient.setQueryData<{ records: Record[] }>(
				recordsKeys.byDate(newRecord.date, newRecord.date),
				(old) => {
					if (!old) return { records: [] };
					const existingIndex = old.records.findIndex(
						(r) => r.tacticId === newRecord.tacticId,
					);
					if (existingIndex >= 0) {
						// 更新現有記錄
						const updated = [...old.records];
						updated[existingIndex] = {
							...updated[existingIndex],
							value: newRecord.value,
						};
						return { records: updated };
					}
					// 新增記錄（使用臨時 ID）
					return {
						records: [
							...old.records,
							{
								id: `temp-${Date.now()}`,
								tacticId: newRecord.tacticId,
								date: newRecord.date,
								value: newRecord.value,
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							},
						],
					};
				},
			);

			return { previousRecords };
		},
		onError: (_err, newRecord, context) => {
			// 發生錯誤時回滾
			if (context?.previousRecords) {
				queryClient.setQueryData(
					recordsKeys.byDate(newRecord.date, newRecord.date),
					context.previousRecords,
				);
			}
		},
		onSettled: (_data, _error, variables) => {
			// 無論成功失敗，最後都重新取得資料確保同步
			queryClient.invalidateQueries({
				queryKey: recordsKeys.byDate(variables.date, variables.date),
			});
			queryClient.invalidateQueries({
				queryKey: ["records", "score"],
			});
		},
	});
}

// 刪除記錄
export function useDeleteRecord() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			apiClient<{ success: boolean }>(`/api/records/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: recordsKeys.all });
		},
	});
}

// 計算週執行率
export function useWeeklyScore(params: GetScoreParams) {
	return useQuery({
		queryKey: recordsKeys.score(params.startDate, params.endDate),
		queryFn: () =>
			apiClient<{ score: number; details: ScoreDetail[] }>(
				`/api/records/score?startDate=${params.startDate}&endDate=${params.endDate}`,
			),
		enabled: Boolean(params.startDate && params.endDate),
	});
}

// 預取特定日期的記錄
export function prefetchRecords(date: string) {
	return queryClient.prefetchQuery({
		queryKey: recordsKeys.byDate(date, date),
		queryFn: () =>
			apiClient<{ records: Record[] }>(
				`/api/records?startDate=${date}&endDate=${date}`,
			),
	});
}

// 預取相鄰日期的 hook
export function usePrefetchAdjacentDays(currentDate: string) {
	const prefetchAdjacent = useCallback(() => {
		const current = new Date(currentDate);

		// 預取前一天
		const prevDate = new Date(current);
		prevDate.setDate(prevDate.getDate() - 1);
		prefetchRecords(prevDate.toISOString().split("T")[0]);

		// 預取後一天
		const nextDate = new Date(current);
		nextDate.setDate(nextDate.getDate() + 1);
		prefetchRecords(nextDate.toISOString().split("T")[0]);
	}, [currentDate]);

	return prefetchAdjacent;
}

// 預取特定週的分數
export function prefetchWeeklyScore(startDate: string, endDate: string) {
	return queryClient.prefetchQuery({
		queryKey: recordsKeys.score(startDate, endDate),
		queryFn: () =>
			apiClient<{ score: number; details: ScoreDetail[] }>(
				`/api/records/score?startDate=${startDate}&endDate=${endDate}`,
			),
	});
}

// 預取相鄰週分數的 hook
export function usePrefetchAdjacentWeekScores(
	currentStartDate: string,
	currentEndDate: string,
) {
	const prefetchAdjacent = useCallback(() => {
		const start = new Date(currentStartDate);
		const end = new Date(currentEndDate);

		// 預取前一週
		const prevStart = new Date(start);
		prevStart.setDate(prevStart.getDate() - 7);
		const prevEnd = new Date(end);
		prevEnd.setDate(prevEnd.getDate() - 7);
		prefetchWeeklyScore(
			prevStart.toISOString().split("T")[0],
			prevEnd.toISOString().split("T")[0],
		);
	}, [currentStartDate, currentEndDate]);

	return prefetchAdjacent;
}
