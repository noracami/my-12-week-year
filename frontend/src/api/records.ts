import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
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

// 新增/更新記錄（Upsert）
export function useUpsertRecord() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: CreateRecordParams) =>
			apiClient<{ record: Record }>("/api/records", {
				method: "POST",
				body: JSON.stringify(params),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: recordsKeys.all });
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
