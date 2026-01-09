import { useState } from "react";
import { useAcceptInvite, useInviteInfo } from "../../api/guilds";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface JoinGuildDialogProps {
	onSuccess: () => void;
	onCancel: () => void;
}

export function JoinGuildDialog({ onSuccess, onCancel }: JoinGuildDialogProps) {
	const [code, setCode] = useState("");
	const [step, setStep] = useState<"input" | "confirm">("input");

	const {
		data: inviteInfo,
		isLoading: isLoadingInfo,
		error,
	} = useInviteInfo(step === "confirm" ? code : "");
	const acceptInvite = useAcceptInvite();

	const handleCheckCode = (e: React.FormEvent) => {
		e.preventDefault();
		if (!code.trim()) return;
		setStep("confirm");
	};

	const handleAccept = async () => {
		try {
			await acceptInvite.mutateAsync(code);
			onSuccess();
		} catch {
			// 錯誤會由 mutation 處理
		}
	};

	if (step === "confirm") {
		if (isLoadingInfo) {
			return (
				<div className="text-center py-8">
					<div className="text-gray-400">驗證邀請碼中...</div>
				</div>
			);
		}

		if (error || !inviteInfo) {
			return (
				<div className="space-y-4">
					<div className="text-center py-4">
						<div className="text-red-400">邀請碼無效或已過期</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button variant="secondary" onClick={() => setStep("input")}>
							重新輸入
						</Button>
					</div>
				</div>
			);
		}

		return (
			<div className="space-y-4">
				<div className="bg-gray-700 rounded-lg p-4 space-y-2">
					<div className="text-lg font-medium text-white">
						{inviteInfo.guild.name}
					</div>
					{inviteInfo.guild.description && (
						<div className="text-sm text-gray-400">
							{inviteInfo.guild.description}
						</div>
					)}
				</div>
				<p className="text-gray-300">確定要加入這個群組嗎？</p>
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={() => setStep("input")}>
						取消
					</Button>
					<Button onClick={handleAccept} disabled={acceptInvite.isPending}>
						{acceptInvite.isPending ? "加入中..." : "確定加入"}
					</Button>
				</div>
				{acceptInvite.error && (
					<p className="text-red-400 text-sm">
						{acceptInvite.error instanceof Error
							? acceptInvite.error.message
							: "加入失敗"}
					</p>
				)}
			</div>
		);
	}

	return (
		<form onSubmit={handleCheckCode} className="space-y-4">
			<Input
				label="邀請碼"
				value={code}
				onChange={(e) => setCode(e.target.value)}
				placeholder="輸入邀請碼"
				required
			/>
			<div className="flex justify-end gap-2">
				<Button variant="secondary" type="button" onClick={onCancel}>
					取消
				</Button>
				<Button type="submit" disabled={!code.trim()}>
					驗證
				</Button>
			</div>
		</form>
	);
}
