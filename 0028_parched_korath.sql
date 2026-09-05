CREATE TABLE `team_group_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`teamMemberId` int NOT NULL,
	`membershipSource` varchar(64) NOT NULL,
	`sourceDocument` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_group_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_group_memberships_unique_idx` UNIQUE(`groupId`,`teamMemberId`)
);
--> statement-breakpoint
ALTER TABLE `team_group_memberships` ADD CONSTRAINT `team_group_memberships_groupId_team_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `team_groups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_group_memberships` ADD CONSTRAINT `team_group_memberships_teamMemberId_team_members_id_fk` FOREIGN KEY (`teamMemberId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `team_group_memberships_group_idx` ON `team_group_memberships` (`groupId`);--> statement-breakpoint
CREATE INDEX `team_group_memberships_member_idx` ON `team_group_memberships` (`teamMemberId`);