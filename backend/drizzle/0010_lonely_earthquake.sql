-- Create new table with updated schema
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

-- Copy existing data, extracting period and range from JSON data
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
FROM `public_shares`;--> statement-breakpoint

-- Drop old table
DROP TABLE `public_shares`;--> statement-breakpoint

-- Rename new table to original name
ALTER TABLE `public_shares_new` RENAME TO `public_shares`;--> statement-breakpoint

-- Create unique index
CREATE UNIQUE INDEX `public_shares_user_period_range_idx` ON `public_shares` (`user_id`,`period`,`start_date`,`end_date`);
