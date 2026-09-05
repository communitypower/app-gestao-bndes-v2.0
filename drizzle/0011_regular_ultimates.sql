ALTER TABLE `activities` ADD `planCode` varchar(8);--> statement-breakpoint
ALTER TABLE `activities` ADD `planSortOrder` int;--> statement-breakpoint
ALTER TABLE `activities` ADD `planningSummary` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `planningResponsible` varchar(16);--> statement-breakpoint
ALTER TABLE `activities` ADD `planningSupport` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `portalDeliverable` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `dependencies` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `keywords` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `planningStatus` varchar(40);--> statement-breakpoint
ALTER TABLE `activities` ADD `contentType` varchar(160);--> statement-breakpoint
ALTER TABLE `activities` ADD `visibility` varchar(160);--> statement-breakpoint
ALTER TABLE `activities` ADD `acceptanceCriteria` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `sourceBase` varchar(320);--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_plan_code_idx` UNIQUE(`planCode`);--> statement-breakpoint
CREATE INDEX `activities_plan_order_idx` ON `activities` (`planSortOrder`);