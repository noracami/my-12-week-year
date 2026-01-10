ALTER TABLE `public_shares` ADD `period` text NOT NULL;--> statement-breakpoint
ALTER TABLE `public_shares` ADD `start_date` text NOT NULL;--> statement-breakpoint
ALTER TABLE `public_shares` ADD `end_date` text NOT NULL;--> statement-breakpoint
ALTER TABLE `public_shares` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `public_shares_user_period_range_idx` ON `public_shares` (`user_id`,`period`,`start_date`,`end_date`);