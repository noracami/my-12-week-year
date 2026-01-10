import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
	useAddComment,
	useShareComments,
	useToggleCommentHidden,
	useUpdateComment,
} from "../../api/shares";
import type { AnonymousShareComment, ShareComment } from "../../api/types";
import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
	shareId: string;
	isLoggedIn: boolean;
}

export function CommentSection({ shareId, isLoggedIn }: CommentSectionProps) {
	const location = useLocation();
	const [newComment, setNewComment] = useState("");

	const { data: commentsData, isLoading, error } = useShareComments(shareId);
	const addComment = useAddComment(shareId);
	const updateComment = useUpdateComment(shareId);
	const toggleHidden = useToggleCommentHidden(shareId);

	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newComment.trim() || addComment.isPending) return;

		try {
			await addComment.mutateAsync(newComment.trim());
			setNewComment("");
		} catch {
			// Error handled by React Query
		}
	};

	const handleEdit = async (commentId: string, content: string) => {
		setUpdatingId(commentId);
		try {
			await updateComment.mutateAsync({ commentId, content });
		} catch {
			// Error handled by React Query
		} finally {
			setUpdatingId(null);
		}
	};

	const handleToggleHidden = async (commentId: string) => {
		setTogglingId(commentId);
		try {
			await toggleHidden.mutateAsync(commentId);
		} catch {
			// Error handled by React Query
		} finally {
			setTogglingId(null);
		}
	};

	const comments = commentsData?.comments ?? [];
	const isAnonymized = commentsData?.isAnonymized ?? true;

	return (
		<div className="mt-6 border-t border-gray-700 pt-6">
			<h3 className="text-lg font-medium text-gray-200 mb-4">
				留言 {comments.length > 0 && `(${comments.length})`}
			</h3>

			{/* 載入中 */}
			{isLoading && (
				<div className="text-center py-4 text-gray-500">載入中...</div>
			)}

			{/* 錯誤 */}
			{error && (
				<div className="text-center py-4 text-red-400">
					載入留言失敗，請稍後再試
				</div>
			)}

			{/* 留言列表 */}
			{!isLoading && !error && (
				<div className="divide-y divide-gray-800">
					{comments.length === 0 ? (
						<div className="text-center py-6 text-gray-500">
							還沒有留言，來當第一個留言的人吧！
						</div>
					) : (
						comments.map((comment) => (
							<CommentItem
								key={comment.id}
								comment={comment as ShareComment | AnonymousShareComment}
								isAnonymized={isAnonymized}
								onEdit={isLoggedIn ? handleEdit : undefined}
								onToggleHidden={isLoggedIn ? handleToggleHidden : undefined}
								isTogglingHidden={togglingId === comment.id}
								isUpdating={updatingId === comment.id}
							/>
						))
					)}
				</div>
			)}

			{/* 新增留言表單 */}
			{isLoggedIn ? (
				<form onSubmit={handleSubmit} className="mt-4">
					<textarea
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						placeholder="寫下你的留言..."
						className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
						rows={3}
						maxLength={1000}
						disabled={addComment.isPending}
					/>
					<div className="mt-2 flex items-center justify-between">
						<span className="text-xs text-gray-500">
							{newComment.length} / 1000
						</span>
						<button
							type="submit"
							disabled={!newComment.trim() || addComment.isPending}
							className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							{addComment.isPending ? "發送中..." : "發送留言"}
						</button>
					</div>
				</form>
			) : (
				<div className="mt-4 p-4 bg-gray-800/50 rounded-lg text-center">
					<p className="text-gray-400 mb-3">登入後即可留言</p>
					<a
						href={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
						className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
					>
						登入
					</a>
				</div>
			)}
		</div>
	);
}
