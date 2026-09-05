ALTER TABLE `activities` ADD `startAt` bigint;--> statement-breakpoint
CREATE INDEX `activities_start_idx` ON `activities` (`startAt`);