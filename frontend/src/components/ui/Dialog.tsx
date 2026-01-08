import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import type { ReactNode } from "react";

interface DialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
	return (
		<BaseDialog.Root open={open} onOpenChange={onOpenChange}>
			<BaseDialog.Portal>
				<BaseDialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
				<BaseDialog.Popup className="fixed inset-x-4 bottom-0 top-auto bg-gray-800 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full md:rounded-xl">
					<BaseDialog.Title className="text-xl font-bold text-white mb-4">
						{title}
					</BaseDialog.Title>
					{children}
					<BaseDialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-white p-2">
						<svg
							className="w-6 h-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</BaseDialog.Close>
				</BaseDialog.Popup>
			</BaseDialog.Portal>
		</BaseDialog.Root>
	);
}
