CREATE TABLE `activity_evidence_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`label` varchar(240) NOT NULL,
	`url` text NOT NULL,
	`linkType` enum('material','evidência de campo') NOT NULL DEFAULT 'material',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_evidence_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activity_evidence_links` ADD CONSTRAINT `activity_evidence_links_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_evidence_links` ADD CONSTRAINT `activity_evidence_links_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_evidence_links_activity_idx` ON `activity_evidence_links` (`activityId`);