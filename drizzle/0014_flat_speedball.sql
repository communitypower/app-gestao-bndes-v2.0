ALTER TABLE `activities` ADD `parentActivityId` int;--> statement-breakpoint
ALTER TABLE `activities` ADD `detailCode` varchar(24);--> statement-breakpoint
ALTER TABLE `activities` ADD `detailSortOrder` int;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_detail_code_idx` UNIQUE(`detailCode`);--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_parentActivityId_activities_id_fk` FOREIGN KEY (`parentActivityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activities_parent_activity_idx` ON `activities` (`parentActivityId`);--> statement-breakpoint
CREATE INDEX `activities_detail_order_idx` ON `activities` (`parentActivityId`,`detailSortOrder`);