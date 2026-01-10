-- Disable foreign key checks temporarily
PRAGMA foreign_keys = OFF;--> statement-breakpoint

-- Backup share_reactions data
CREATE TABLE `share_reactions_backup` AS SELECT * FROM `share_reactions`;--> statement-breakpoint

-- Drop share_reactions (has FK to public_shares)
DROP TABLE `share_reactions`;--> statement-breakpoint

-- Create new public_shares table with updated schema
CREATE TABLE `public_shares_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`period` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

-- Copy existing data, keeping only the latest record for each user+period+date combination
INSERT INTO `public_shares_new` (`id`, `user_id`, `period`, `start_date`, `end_date`, `data`, `created_at`, `updated_at`)
SELECT
	`id`,
	`user_id`,
	json_extract(`data`, '$.period') as `period`,
	json_extract(`data`, '$.range.start') as `start_date`,
	json_extract(`data`, '$.range.end') as `end_date`,
	`data`,
	`created_at`,
	`created_at` as `updated_at`
FROM `public_shares`
WHERE `id` IN (
	SELECT `id` FROM (
		SELECT `id`, ROW_NUMBER() OVER (
			PARTITION BY `user_id`, json_extract(`data`, '$.period'), json_extract(`data`, '$.range.start'), json_extract(`data`, '$.range.end')
			ORDER BY `created_at` DESC
		) as rn
		FROM `public_shares`
	) WHERE rn = 1
);--> statement-breakpoint

-- Drop old public_shares table
DROP TABLE `public_shares`;--> statement-breakpoint

-- Rename new table to original name
ALTER TABLE `public_shares_new` RENAME TO `public_shares`;--> statement-breakpoint

-- Create unique index on public_shares
CREATE UNIQUE INDEX `public_shares_user_period_range_idx` ON `public_shares` (`user_id`,`period`,`start_date`,`end_date`);--> statement-breakpoint

-- Recreate share_reactions table
CREATE TABLE `share_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`share_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`share_id`) REFERENCES `public_shares`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

-- Create unique index on share_reactions
CREATE UNIQUE INDEX `share_reactions_share_user_emoji_idx` ON `share_reactions` (`share_id`,`user_id`,`emoji`);--> statement-breakpoint

-- Restore share_reactions data (only for shares that still exist)
INSERT INTO `share_reactions`
SELECT b.* FROM `share_reactions_backup` b
WHERE EXISTS (SELECT 1 FROM `public_shares` p WHERE p.`id` = b.`share_id`);--> statement-breakpoint

-- Drop backup table
DROP TABLE `share_reactions_backup`;--> statement-breakpoint

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;
