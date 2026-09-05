ALTER TABLE `activity_allocations` ADD `responsibility` text;--> statement-breakpoint
ALTER TABLE `activity_allocations` ADD `isExecutionLead` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `activity_allocations` ADD `assignedBy` int;--> statement-breakpoint
ALTER TABLE `activity_allocations` ADD CONSTRAINT `activity_allocations_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_allocations_execution_lead_idx` ON `activity_allocations` (`activityId`,`allocationType`,`isExecutionLead`);