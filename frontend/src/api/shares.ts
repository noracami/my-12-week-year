import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
	CreatePublicShareParams,
	CreatePublicShareResponse,
	PublicShare,
	ShareReactions,
	ShareReactionsResponse,
} from "./types";

// Query Keys
export const sharesKeys = {
	all: ["shares"] as const,
	detail: (id: string) => ["shares", id] as const,
	reactions: (id: string) => ["shares", id, "reactions"] as const,
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

// 取得分享的表情回應
export function useShareReactions(shareId: string | undefined) {
	return useQuery({
		queryKey: sharesKeys.reactions(shareId || ""),
		queryFn: () =>
			apiClient<ShareReactionsResponse>(`/api/shares/${shareId}/reactions`),
		enabled: Boolean(shareId),
	});
}

// 新增表情回應
export function useAddReaction(shareId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (emoji: string) =>
			apiClient<{ success: boolean }>(`/api/shares/${shareId}/reactions`, {
				method: "POST",
				body: JSON.stringify({ emoji }),
			}),
		onMutate: async (emoji) => {
			// Cancel outgoing queries
			await queryClient.cancelQueries({
				queryKey: sharesKeys.reactions(shareId),
			});

			// Snapshot previous value
			const previousReactions =
				queryClient.getQueryData<ShareReactionsResponse>(
					sharesKeys.reactions(shareId),
				);

			// Optimistically update
			if (previousReactions) {
				const newReactions: ShareReactions = { ...previousReactions.reactions };
				if (newReactions[emoji]) {
					newReactions[emoji] = {
						count: newReactions[emoji].count + 1,
						reacted: true,
					};
				}
				queryClient.setQueryData<ShareReactionsResponse>(
					sharesKeys.reactions(shareId),
					{ reactions: newReactions },
				);
			}

			return { previousReactions };
		},
		onError: (_err, _emoji, context) => {
			// Rollback on error
			if (context?.previousReactions) {
				queryClient.setQueryData(
					sharesKeys.reactions(shareId),
					context.previousReactions,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: sharesKeys.reactions(shareId),
			});
		},
	});
}

// 移除表情回應
export function useRemoveReaction(shareId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (emoji: string) =>
			apiClient<{ success: boolean }>(
				`/api/shares/${shareId}/reactions/${encodeURIComponent(emoji)}`,
				{ method: "DELETE" },
			),
		onMutate: async (emoji) => {
			// Cancel outgoing queries
			await queryClient.cancelQueries({
				queryKey: sharesKeys.reactions(shareId),
			});

			// Snapshot previous value
			const previousReactions =
				queryClient.getQueryData<ShareReactionsResponse>(
					sharesKeys.reactions(shareId),
				);

			// Optimistically update
			if (previousReactions) {
				const newReactions: ShareReactions = { ...previousReactions.reactions };
				if (newReactions[emoji]) {
					newReactions[emoji] = {
						count: Math.max(0, newReactions[emoji].count - 1),
						reacted: false,
					};
				}
				queryClient.setQueryData<ShareReactionsResponse>(
					sharesKeys.reactions(shareId),
					{ reactions: newReactions },
				);
			}

			return { previousReactions };
		},
		onError: (_err, _emoji, context) => {
			// Rollback on error
			if (context?.previousReactions) {
				queryClient.setQueryData(
					sharesKeys.reactions(shareId),
					context.previousReactions,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: sharesKeys.reactions(shareId),
			});
		},
	});
}
