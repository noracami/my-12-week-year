import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
	CreatePublicShareParams,
	CreatePublicShareResponse,
	PublicShare,
} from "./types";

// Query Keys
export const sharesKeys = {
	all: ["shares"] as const,
	detail: (id: string) => ["shares", id] as const,
};

// 取得公開分享
export function usePublicShare(id: string | undefined) {
	return useQuery({
		queryKey: sharesKeys.detail(id || ""),
		queryFn: () => apiClient<PublicShare>(`/api/shares/${id}`),
		enabled: Boolean(id),
	});
}

// 建立公開分享
export function useCreatePublicShare() {
	return useMutation({
		mutationFn: (params: CreatePublicShareParams) =>
			apiClient<CreatePublicShareResponse>("/api/shares", {
				method: "POST",
				body: JSON.stringify(params),
			}),
	});
}
