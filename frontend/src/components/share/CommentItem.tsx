import { useMemo, useState } from "react";
import type { AnonymousShareComment, ShareComment } from "../../api/types";

// 收回訊息的隨機文案
const HIDDEN_MESSAGES = [
	"悄悄地收回了訊息",
	"收回了一則訊息",
	"把訊息吞了回去",
	"突然害羞了起來",
	"決定保持神秘",
	"話到嘴邊又收回去了",
	"默默地收回了這段話",
	"改變了主意",
];

interface CommentItemProps {
	comment: ShareComment | AnonymousShareComment;
	isAnonymized: boolean;
	onEdit?: (id: string, content: string) => void;
	onToggleHidden?: (id: string) => void;
	isTogglingHidden?: boolean;
	isUpdating?: boolean;
}

function formatRelativeTime(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "剛剛";
	if (diffMins < 60) return `${diffMins} 分鐘前`;
	if (diffHours < 24) return `${diffHours} 小時前`;
	if (diffDays < 7) return `${diffDays} 天前`;

	return date.toLocaleDateString("zh-TW", {
		month: "short",
		day: "numeric",
	});
}

function isAuthenticatedComment(
	comment: ShareComment | AnonymousShareComment,
): comment is ShareComment {
	return "userId" in comment;
}

// 根據留言 ID 產生一致的隨機索引
function getHiddenMessageIndex(commentId: string): number {
	let hash = 0;
	for (let i = 0; i < commentId.length; i++) {
		hash = (hash << 5) - hash + commentId.charCodeAt(i);
		hash = hash & hash;
	}
	return Math.abs(hash) % HIDDEN_MESSAGES.length;
}

export function CommentItem({
	comment,
	isAnonymized,
	onEdit,
	onToggleHidden,
	isTogglingHidden,
	isUpdating,
}: CommentItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(comment.content);

	const isOwn =
		!isAnonymized && isAuthenticatedComment(comment) && comment.isOwn;
	const wasEdited = comment.updatedAt !== comment.createdAt;
	const isHidden = comment.hidden;

	// 隨機收回訊息（基於留言 ID 保持一致性）
	const hiddenMessage = useMemo(
		() => HIDDEN_MESSAGES[getHiddenMessageIndex(comment.id)],
		[comment.id],
	);

	const handleSaveEdit = () => {
		if (editContent.trim() && onEdit) {
			onEdit(comment.id, editContent.trim());
			setIsEditing(false);
		}
	};

	const handleCancelEdit = () => {
		setEditContent(comment.content);
		setIsEditing(false);
	};

	const handleToggleHidden = () => {
		if (onToggleHidden) {
			onToggleHidden(comment.id);
		}
	};

	// 渲染頭像
	const renderAvatar = () => {
		if (isAnonymized && !isAuthenticatedComment(comment)) {
			// 匿名用戶：顯示動物 emoji
			return (
				<div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-lg">
					{comment.anonymousId.emoji}
				</div>
			);
		}

		// 已登入用戶看到的：真實頭像或名字首字
		if (isAuthenticatedComment(comment)) {
			if (comment.userImage) {
				return (
					<img
						src={comment.userImage}
						alt={comment.userName}
						className="w-8 h-8 rounded-full"
					/>
				);
			}
			return (
				<div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium text-white">
					{comment.userName.charAt(0).toUpperCase()}
				</div>
			);
		}

		return null;
	};

	// 渲染名稱
	const renderName = () => {
		if (isAnonymized && !isAuthenticatedComment(comment)) {
			return (
				<span className="text-gray-300">
					{comment.anonymousId.emoji} {comment.anonymousId.name}
				</span>
			);
		}

		if (isAuthenticatedComment(comment)) {
			return (
				<span className="text-gray-200">
					{comment.userName}
					{comment.isOwn && (
						<span className="ml-1 text-xs text-indigo-400">(你)</span>
					)}
				</span>
			);
		}

		return null;
	};

	// 已隱藏的留言顯示
	if (isHidden) {
		return (
			<div className="flex gap-3 py-3">
				{/* 頭像 */}
				<div className="flex-shrink-0">{renderAvatar()}</div>

				{/* 內容區 */}
				<div className="flex-1 min-w-0">
					{/* 名稱和時間 */}
					<div className="flex items-center gap-2 text-sm">
						{renderName()}
						<span className="text-gray-500">
							{formatRelativeTime(comment.createdAt)}
						</span>
					</div>

					{/* 收回訊息提示 */}
					<p className="mt-1 text-gray-500 text-sm italic">{hiddenMessage}</p>

					{/* 擁有者可以取消收回 */}
					{isOwn && (
						<div className="mt-2">
							<button
								type="button"
								onClick={handleToggleHidden}
								disabled={isTogglingHidden}
								className="text-xs text-gray-500 hover:text-indigo-400 cursor-pointer"
							>
								{isTogglingHidden ? "處理中..." : "取消收回"}
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex gap-3 py-3">
			{/* 頭像 */}
			<div className="flex-shrink-0">{renderAvatar()}</div>

			{/* 內容區 */}
			<div className="flex-1 min-w-0">
				{/* 名稱和時間 */}
				<div className="flex items-center gap-2 text-sm">
					{renderName()}
					<span className="text-gray-500">
						{formatRelativeTime(comment.createdAt)}
						{wasEdited && <span className="ml-1">(已編輯)</span>}
					</span>
				</div>

				{/* 留言內容 */}
				{isEditing ? (
					<div className="mt-2">
						<textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
							rows={3}
							maxLength={1000}
							disabled={isUpdating}
						/>
						<div className="mt-2 flex items-center justify-between">
							<span className="text-xs text-gray-500">
								{editContent.length} / 1000
							</span>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleCancelEdit}
									className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200 cursor-pointer"
									disabled={isUpdating}
								>
									取消
								</button>
								<button
									type="button"
									onClick={handleSaveEdit}
									disabled={
										!editContent.trim() ||
										editContent === comment.content ||
										isUpdating
									}
									className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
								>
									{isUpdating ? "儲存中..." : "儲存"}
								</button>
							</div>
						</div>
					</div>
				) : (
					<p className="mt-1 text-gray-300 text-sm whitespace-pre-wrap break-words">
						{comment.content}
					</p>
				)}

				{/* 編輯/收回按鈕 */}
				{isOwn && !isEditing && (
					<div className="mt-2 flex gap-3">
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
						>
							編輯
						</button>
						<button
							type="button"
							onClick={handleToggleHidden}
							disabled={isTogglingHidden}
							className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
						>
							{isTogglingHidden ? "處理中..." : "收回"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
