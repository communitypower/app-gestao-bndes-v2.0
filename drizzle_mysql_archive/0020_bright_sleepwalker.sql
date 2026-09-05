CREATE TABLE `activity_leadership_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`previousTeamMemberId` int,
	`nextTeamMemberId` int NOT NULL,
	`justification` text NOT NULL,
	`assignedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_leadership_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activity_leadership_events` ADD CONSTRAINT `activity_leadership_events_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_leadership_events` ADD CONSTRAINT `activity_leadership_events_previousTeamMemberId_team_members_id_fk` FOREIGN KEY (`previousTeamMemberId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_leadership_events` ADD CONSTRAINT `activity_leadership_events_nextTeamMemberId_team_members_id_fk` FOREIGN KEY (`nextTeamMemberId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_leadership_events` ADD CONSTRAINT `activity_leadership_events_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_leadership_events_activity_idx` ON `activity_leadership_events` (`activityId`);--> statement-breakpoint
CREATE INDEX `activity_leadership_events_created_idx` ON `activity_leadership_events` (`createdAt`);