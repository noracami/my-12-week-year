import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	useCreateGroup,
	useCreateInvite,
	useDeleteGroup,
	useDeleteGuild,
	useDeleteInvite,
	useGuild,
	useGuildInvites,
	useGuildMembers,
	useRemoveMember,
	useUpdateGuild,
	useUpdateMember,
} from "../api/guilds";
import type { GuildMember } from "../api/types";
import { MemberCard } from "../components/guilds/MemberCard";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { useSession } from "../lib/auth";

export function GuildPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: session } = useSession();

	const { data: guild, isLoading } = useGuild(id || "");
	const { data: members } = useGuildMembers(id || "");
	const { data: invites } = useGuildInvites(id || "", guild?.role === "admin");

	const updateGuild = useUpdateGuild();
	const deleteGuild = useDeleteGuild();
	const createGroup = useCreateGroup();
	const deleteGroup = useDeleteGroup();
	const updateMember = useUpdateMember();
	const removeMember = useRemoveMember();
	const createInvite = useCreateInvite();
	const deleteInvite = useDeleteInvite();

	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
	const [isMemberManageOpen, setIsMemberManageOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<GuildMember | null>(
		null,
	);

	const [editName, setEditName] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [newGroupName, setNewGroupName] = useState("");

	const isAdmin = guild?.role === "admin";
	const isCreator = guild?.createdBy === session?.user?.id;

	if (isLoading) {
		return <div className="text-center py-8 text-gray-400">載入中...</div>;
	}

	if (!guild || !id) {
		return <div className="text-center py-8 text-gray-400">找不到群組</div>;
	}

	const groups = guild.groups || [];

	// 按 Group 分組成員
	const membersByGroup = new Map<string | null, GuildMember[]>();
	membersByGroup.set(null, []); // 未分組
	for (const group of groups) {
		membersByGroup.set(group.id, []);
	}
	for (const member of members || []) {
		const list = membersByGroup.get(member.groupId) || [];
		list.push(member);
		membersByGroup.set(member.groupId, list);
	}

	const handleEditGuild = async () => {
		await updateGuild.mutateAsync({
			id,
			name: editName,
			description: editDescription || null,
		});
		setIsEditOpen(false);
	};

	const handleDeleteGuild = async () => {
		if (window.confirm("確定要刪除這個群組嗎？此操作無法復原。")) {
			await deleteGuild.mutateAsync(id);
			navigate("/settings");
		}
	};

	const handleCreateGroup = async () => {
		if (!newGroupName.trim()) return;
		await createGroup.mutateAsync({ guildId: id, name: newGroupName.trim() });
		setNewGroupName("");
		setIsGroupFormOpen(false);
	};

	const handleDeleteGroup = async (groupId: string) => {
		if (window.confirm("確定要刪除這個分組嗎？成員將變為未分組。")) {
			await deleteGroup.mutateAsync({ id: groupId, guildId: id });
		}
	};

	const handleCreateInvite = async () => {
		await createInvite.mutateAsync({ guildId: id });
	};

	const handleCopyInvite = (code: string) => {
		const url = `${window.location.origin}/settings?invite=${code}`;
		navigator.clipboard.writeText(url);
		alert("邀請連結已複製");
	};

	const handleDeleteInvite = async (inviteId: string) => {
		await deleteInvite.mutateAsync({ id: inviteId, guildId: id });
	};

	const handleOpenMemberManage = (member: GuildMember) => {
		setSelectedMember(member);
		setIsMemberManageOpen(true);
	};

	const handleUpdateMemberGroup = async (groupId: string | null) => {
		if (!selectedMember) return;
		await updateMember.mutateAsync({
			id: selectedMember.id,
			guildId: id,
			groupId,
		});
		setIsMemberManageOpen(false);
	};

	const handleToggleMemberRole = async () => {
		if (!selectedMember) return;
		const newRole = selectedMember.role === "admin" ? "member" : "admin";
		await updateMember.mutateAsync({
			id: selectedMember.id,
			guildId: id,
			role: newRole,
		});
		setIsMemberManageOpen(false);
	};

	const handleRemoveMember = async () => {
		if (!selectedMember) return;
		if (window.confirm(`確定要移除 ${selectedMember.userName} 嗎？`)) {
			await removeMember.mutateAsync({ id: selectedMember.id, guildId: id });
			setIsMemberManageOpen(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-3">
				{/* 返回按鈕 */}
				<div className="flex justify-start">
					<Button variant="ghost" onClick={() => navigate("/settings")}>
						← 返回
					</Button>
				</div>

				{/* 群組名稱與描述 */}
				<div className="text-center">
					<h1 className="text-xl font-bold text-white">{guild.name}</h1>
					{guild.description && (
						<p className="text-gray-400 mt-1">{guild.description}</p>
					)}
				</div>

				{/* 成員數 */}
				<div className="text-center">
					<span className="text-sm text-gray-500">
						{members?.length || 0} 位成員
					</span>
				</div>

				{/* 身份標籤 */}
				{isAdmin && (
					<div className="flex justify-start">
						<span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
							管理員
						</span>
					</div>
				)}
			</div>

			{/* 成員列表 */}
			<section className="space-y-4">
				<h2 className="text-sm font-medium text-gray-400">成員</h2>

				{/* 各 Group 的成員 */}
				{groups.map((group) => {
					const groupMembers = membersByGroup.get(group.id) || [];
					if (groupMembers.length === 0) return null;
					return (
						<div key={group.id} className="space-y-2">
							<h3 className="text-sm text-gray-300">{group.name}</h3>
							<div className="space-y-1">
								{groupMembers.map((member) => (
									<div key={member.id} className="flex items-center gap-2">
										<div className="flex-1">
											<MemberCard
												member={member}
												guildId={id}
												groups={groups}
											/>
										</div>
										{isAdmin && (
											<button
												type="button"
												onClick={() => handleOpenMemberManage(member)}
												className="p-2 text-gray-400 hover:text-white cursor-pointer"
											>
												⚙
											</button>
										)}
									</div>
								))}
							</div>
						</div>
					);
				})}

				{/* 未分組成員 */}
				{(() => {
					const ungroupedMembers = membersByGroup.get(null) || [];
					if (ungroupedMembers.length === 0 && groups.length > 0) return null;
					return (
						<div className="space-y-2">
							{groups.length > 0 && (
								<h3 className="text-sm text-gray-500">未分組</h3>
							)}
							<div className="space-y-1">
								{ungroupedMembers.map((member) => (
									<div key={member.id} className="flex items-center gap-2">
										<div className="flex-1">
											<MemberCard
												member={member}
												guildId={id}
												groups={groups}
											/>
										</div>
										{isAdmin && (
											<button
												type="button"
												onClick={() => handleOpenMemberManage(member)}
												className="p-2 text-gray-400 hover:text-white cursor-pointer"
											>
												⚙
											</button>
										)}
									</div>
								))}
							</div>
						</div>
					);
				})()}
			</section>

			{/* Admin 區塊 */}
			{isAdmin && (
				<section className="space-y-4 pt-4 border-t border-gray-700">
					<h2 className="text-sm font-medium text-gray-400">管理</h2>

					{/* 分組管理 */}
					<div className="bg-gray-800 rounded-lg p-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-300">分組</span>
							<Button size="sm" onClick={() => setIsGroupFormOpen(true)}>
								新增分組
							</Button>
						</div>
						{groups.length > 0 && (
							<div className="space-y-1">
								{groups.map((group) => (
									<div
										key={group.id}
										className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded"
									>
										<span className="text-white">{group.name}</span>
										<button
											type="button"
											onClick={() => handleDeleteGroup(group.id)}
											className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
										>
											刪除
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* 邀請連結 */}
					<div className="bg-gray-800 rounded-lg p-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-300">邀請連結</span>
							<Button size="sm" onClick={handleCreateInvite}>
								產生連結
							</Button>
						</div>
						{invites && invites.length > 0 && (
							<div className="space-y-2">
								{invites.map((invite) => (
									<div
										key={invite.id}
										className="flex items-center justify-between bg-gray-700 rounded p-2"
									>
										<code className="text-sm text-indigo-300">
											{invite.code}
										</code>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => handleCopyInvite(invite.code)}
												className="text-xs text-gray-400 hover:text-white cursor-pointer"
											>
												複製
											</button>
											<button
												type="button"
												onClick={() => handleDeleteInvite(invite.id)}
												className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
											>
												刪除
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* 編輯/刪除群組 */}
					<div className="bg-gray-800 rounded-lg p-4 space-y-3">
						<div className="flex gap-2">
							<Button
								variant="secondary"
								className="flex-1"
								onClick={() => {
									setEditName(guild.name);
									setEditDescription(guild.description || "");
									setIsEditOpen(true);
								}}
							>
								編輯群組
							</Button>
							{isCreator && (
								<Button
									variant="danger"
									className="flex-1"
									onClick={handleDeleteGuild}
								>
									刪除群組
								</Button>
							)}
						</div>
					</div>
				</section>
			)}

			{/* 編輯群組 Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen} title="編輯群組">
				<div className="space-y-4">
					<Input
						label="群組名稱"
						value={editName}
						onChange={(e) => setEditName(e.target.value)}
					/>
					<div className="space-y-1">
						<label
							htmlFor="edit-guild-description"
							className="block text-sm font-medium text-gray-300"
						>
							描述
						</label>
						<textarea
							id="edit-guild-description"
							value={editDescription}
							onChange={(e) => setEditDescription(e.target.value)}
							rows={3}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
						/>
					</div>
					<div className="flex justify-end">
						<Button onClick={handleEditGuild} disabled={!editName.trim()}>
							儲存
						</Button>
					</div>
				</div>
			</Dialog>

			{/* 新增分組 Dialog */}
			<Dialog
				open={isGroupFormOpen}
				onOpenChange={setIsGroupFormOpen}
				title="新增分組"
			>
				<div className="space-y-4">
					<Input
						label="分組名稱"
						value={newGroupName}
						onChange={(e) => setNewGroupName(e.target.value)}
						placeholder="輸入分組名稱"
					/>
					<div className="flex justify-end">
						<Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
							建立
						</Button>
					</div>
				</div>
			</Dialog>

			{/* 成員管理 Dialog */}
			<Dialog
				open={isMemberManageOpen}
				onOpenChange={setIsMemberManageOpen}
				title={`管理 ${selectedMember?.userName || ""}`}
			>
				{selectedMember && (
					<div className="space-y-4">
						{/* 分組選擇 */}
						<div className="space-y-2">
							<span className="block text-sm font-medium text-gray-300">
								分組
							</span>
							<div className="space-y-1">
								<button
									type="button"
									onClick={() => handleUpdateMemberGroup(null)}
									className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer ${
										selectedMember.groupId === null
											? "bg-indigo-600 text-white"
											: "bg-gray-700 text-gray-300 hover:bg-gray-600"
									}`}
								>
									未分組
								</button>
								{groups.map((group) => (
									<button
										key={group.id}
										type="button"
										onClick={() => handleUpdateMemberGroup(group.id)}
										className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer ${
											selectedMember.groupId === group.id
												? "bg-indigo-600 text-white"
												: "bg-gray-700 text-gray-300 hover:bg-gray-600"
										}`}
									>
										{group.name}
									</button>
								))}
							</div>
						</div>

						{/* 角色切換 */}
						{selectedMember.userId !== guild.createdBy && (
							<div className="pt-2 border-t border-gray-700">
								<Button
									variant="secondary"
									className="w-full"
									onClick={handleToggleMemberRole}
								>
									{selectedMember.role === "admin"
										? "降為一般成員"
										: "升為管理員"}
								</Button>
							</div>
						)}

						{/* 移除成員 */}
						{selectedMember.userId !== guild.createdBy && (
							<Button
								variant="danger"
								className="w-full"
								onClick={handleRemoveMember}
							>
								移除成員
							</Button>
						)}
					</div>
				)}
			</Dialog>
		</div>
	);
}
