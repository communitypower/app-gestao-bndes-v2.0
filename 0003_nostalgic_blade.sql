CREATE TABLE `activity_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`teamMemberId` int NOT NULL,
	`allocatedHours` decimal(8,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_allocations_unique_idx` UNIQUE(`activityId`,`teamMemberId`)
);
--> statement-breakpoint
CREATE TABLE `team_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`institution` varchar(160) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_groups_name_idx` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `team_members` ADD `groupId` int;--> statement-breakpoint
ALTER TABLE `team_members` ADD `groupRole` enum('coordenador','participante') DEFAULT 'participante' NOT NULL;--> statement-breakpoint
ALTER TABLE `activity_allocations` ADD CONSTRAINT `activity_allocations_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_allocations` ADD CONSTRAINT `activity_allocations_teamMemberId_team_members_id_fk` FOREIGN KEY (`teamMemberId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_allocations_activity_idx` ON `activity_allocations` (`activityId`);--> statement-breakpoint
CREATE INDEX `activity_allocations_member_idx` ON `activity_allocations` (`teamMemberId`);--> statement-breakpoint
CREATE INDEX `team_groups_institution_idx` ON `team_groups` (`institution`);--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_groupId_team_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `team_groups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `team_members_group_idx` ON `team_members` (`groupId`);--> statement-breakpoint
CREATE INDEX `team_members_group_role_idx` ON `team_members` (`groupId`,`groupRole`);