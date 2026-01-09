import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
	CreateGroupParams,
	CreateGuildParams,
	CreateInviteParams,
	Group,
	Guild,
	GuildInvite,
	GuildMember,
	InviteInfo,
	MemberScoreResponse,
	UpdateGroupParams,
	UpdateGuildParams,
	UpdateMemberParams,
} from "./types";

// Query Keys
export const guildsKeys = {
	all: ["guilds"] as const,
	detail: (id: string) => ["guilds", id] as const,
	members: (guildId: string) => ["guilds", guildId, "members"] as const,
	memberScore: (
		guildId: string,
		userId: string,
		startDate: string,
		endDate: string,
	) =>
		[
			"guilds",
			guildId,
			"members",
			userId,
			"score",
			startDate,
			endDate,
		] as const,
	invites: (guildId: string) => ["guilds", guildId, "invites"] as const,
	inviteInfo: (code: string) => ["invites", code] as const,
};

// ============ Queries ============

// 取得我的所有 guilds
export function useGuilds() {
	return useQuery({
		queryKey: guildsKeys.all,
		queryFn: () => apiClient<{ guilds: Guild[] }>("/api/guilds"),
		select: (data) => data.guilds,
	});
}

// 取得 guild 詳情
export function useGuild(id: string) {
	return useQuery({
		queryKey: guildsKeys.detail(id),
		queryFn: () => apiClient<{ guild: Guild }>(`/api/guilds/${id}`),
		select: (data) => data.guild,
		enabled: !!id,
	});
}

// 取得 guild 成員列表
export function useGuildMembers(guildId: string) {
	return useQuery({
		queryKey: guildsKeys.members(guildId),
		queryFn: () =>
			apiClient<{ members: GuildMember[] }>(`/api/guilds/${guildId}/members`),
		select: (data) => data.members,
		enabled: !!guildId,
	});
}

// 取得成員得分
export function useMemberScore(
	guildId: string,
	userId: string,
	startDate: string,
	endDate: string,
) {
	return useQuery({
		queryKey: guildsKeys.memberScore(guildId, userId, startDate, endDate),
		queryFn: () =>
			apiClient<MemberScoreResponse>(
				`/api/guild-members/score/${guildId}/${userId}?startDate=${startDate}&endDate=${endDate}`,
			),
		enabled: !!guildId && !!userId && !!startDate && !!endDate,
	});
}

// 取得 guild 邀請列表（admin only）
export function useGuildInvites(guildId: string, enabled = true) {
	return useQuery({
		queryKey: guildsKeys.invites(guildId),
		queryFn: () =>
			apiClient<{ invites: GuildInvite[] }>(`/api/guilds/${guildId}/invites`),
		select: (data) => data.invites,
		enabled: !!guildId && enabled,
	});
}

// 取得邀請資訊（公開）
export function useInviteInfo(code: string) {
	return useQuery({
		queryKey: guildsKeys.inviteInfo(code),
		queryFn: () => apiClient<InviteInfo>(`/api/invites/code/${code}`),
		enabled: !!code,
		retry: false,
	});
}

// ============ Mutations ============

// 建立 guild
export function useCreateGuild() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: CreateGuildParams) =>
			apiClient<{ guild: Guild }>("/api/guilds", {
				method: "POST",
				body: JSON.stringify(params),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: guildsKeys.all });
		},
	});
}

// 更新 guild
export function useUpdateGuild() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...params }: UpdateGuildParams & { id: string }) =>
			apiClient<{ guild: Guild }>(`/api/guilds/${id}`, {
				method: "PUT",
				body: JSON.stringify(params),
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: guildsKeys.all });
			queryClient.invalidateQueries({
				queryKey: guildsKeys.detail(variables.id),
			});
		},
	});
}

// 刪除 guild
export function useDeleteGuild() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			apiClient<{ success: boolean }>(`/api/guilds/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: guildsKeys.all });
		},
	});
}

// 建立 group
export function useCreateGroup() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			guildId,
			...params
		}: CreateGroupParams & { guildId: string }) =>
			apiClient<{ group: Group }>(`/api/guilds/${guildId}/groups`, {
				method: "POST",
				body: JSON.stringify(params),
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: guildsKeys.detail(variables.guildId),
			});
		},
	});
}

// 更新 group
export function useUpdateGroup() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			guildId,
			...params
		}: UpdateGroupParams & { id: string; guildId: string }) =>
			apiClient<{ group: Group }>(`/api/groups/${id}`, {
				method: "PUT",
				body: JSON.stringify(params),
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: guildsKeys.detail(variables.guildId),
			});
		},
	});
}

// 刪除 group
export function useDeleteGroup() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, guildId: _guildId }: { id: string; guildId: string }) =>
			apiClient<{ success: boolean }>(`/api/groups/${id}`, {
				method: "DELETE",
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: guildsKeys.detail(variables.guildId),
			});
			queryClient.invalidateQueries({
				queryKey: guildsKeys.members(variables.guildId),
			});
		},
	});
}

// 更新成員（角色、分組）
export function useUpdateMember() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			guildId,
			...params
		}: UpdateMemberParams & { id: string; guildId: string }) =>
			apiClient<{ member: GuildMember }>(`/api/guild-members/${id}`, {
				method: "PUT",
				body: JSON.stringify(params),
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: guildsKeys.members(variables.guildId),
			});
		},
	});
}

// 移除成員/退出
export function useRemoveMember() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, guildId: _guildId }: { id: string; guildId: string }) =>
			apiClient<{ success: boolean }>(`/api/guild-members/${id}`, {
				method: "DELETE",
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: guildsKeys.all });
			queryClient.invalidateQueries({
				queryKey: guildsKeys.members(variables.guildId),
			});
		},
	});
}

// 建立邀請連結
export function useCreateInvite() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			guildId,
			...params
		}: CreateInviteParams & { guildId: string }) =>
			apiClient<{ invite: GuildInvite }>(`/api/guilds/${guildId}/invites`, {
				method: "POST",
				body: JSON.stringify(params),
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: guildsKeys.invites(variables.guildId),
			});
		},
	});
}

// 刪除邀請連結
export function useDeleteInvite() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, guildId: _guildId }: { id: string; guildId: string }) =>
			apiClient<{ success: boolean }>(`/api/invites/${id}`, {
				method: "DELETE",
			}),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: guildsKeys.invites(variables.guildId),
			});
		},
	});
}

// 接受邀請
export function useAcceptInvite() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (code: string) =>
			apiClient<{ guild: Guild }>(`/api/invites/code/${code}/accept`, {
				method: "POST",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: guildsKeys.all });
		},
	});
}
