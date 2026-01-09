import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface GuildFormProps {
	initialValues?: {
		name: string;
		description: string | null;
	};
	onSubmit: (values: { name: string; description?: string }) => void;
	isLoading?: boolean;
}

export function GuildForm({
	initialValues,
	onSubmit,
	isLoading,
}: GuildFormProps) {
	const [name, setName] = useState(initialValues?.name || "");
	const [description, setDescription] = useState(
		initialValues?.description || "",
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		onSubmit({
			name: name.trim(),
			description: description.trim() || undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<Input
				label="群組名稱"
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="輸入群組名稱"
				required
			/>
			<div className="space-y-1">
				<label
					htmlFor="guild-description"
					className="block text-sm font-medium text-gray-300"
				>
					描述（選填）
				</label>
				<textarea
					id="guild-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="輸入群組描述"
					rows={3}
					className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
				/>
			</div>
			<div className="flex justify-end gap-2 pt-2">
				<Button type="submit" disabled={!name.trim() || isLoading}>
					{isLoading ? "處理中..." : initialValues ? "儲存" : "建立"}
				</Button>
			</div>
		</form>
	);
}
