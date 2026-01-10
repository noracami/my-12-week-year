CREATE TABLE `share_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`share_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`share_id`) REFERENCES `public_shares`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `share_reactions_share_user_emoji_idx` ON `share_reactions` (`share_id`,`user_id`,`emoji`);