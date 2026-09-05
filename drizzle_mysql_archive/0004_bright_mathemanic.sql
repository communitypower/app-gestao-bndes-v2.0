CREATE TABLE `activity_reviewers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`teamMemberId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`status` enum('pendente','em revisão','ajustes solicitados','aprovado') NOT NULL DEFAULT 'pendente',
	`decisionNote` text,
	`decidedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_reviewers_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_reviewers_unique_idx` UNIQUE(`activityId`,`teamMemberId`)
);
--> statement-breakpoint
CREATE TABLE `coordination_interfaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(320) NOT NULL,
	`description` text NOT NULL,
	`interfaceType` enum('interface','escopo sobreposto','dependência') NOT NULL,
	`responsibleId` int NOT NULL,
	`priority` enum('baixa','média','alta','crítica') NOT NULL DEFAULT 'média',
	`status` enum('identificada','em discussão','encaminhada','resolvida') NOT NULL DEFAULT 'identificada',
	`dueAt` bigint,
	`resolution` text,
	`createdBy` int NOT NULL,
	`resolvedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coordination_interfaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interface_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interfaceId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interface_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interface_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interfaceId` int NOT NULL,
	`groupId` int NOT NULL,
	`role` enum('responsável','envolvido') NOT NULL DEFAULT 'envolvido',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interface_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `interface_groups_unique_idx` UNIQUE(`interfaceId`,`groupId`)
);
--> statement-breakpoint
CREATE TABLE `interface_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interfaceId` int NOT NULL,
	`sectionId` int NOT NULL,
	`role` enum('origem','relacionada') NOT NULL DEFAULT 'relacionada',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interface_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `interface_sections_unique_idx` UNIQUE(`interfaceId`,`sectionId`)
);
--> statement-breakpoint
CREATE TABLE `review_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`materialId` int NOT NULL,
	`revisionId` int NOT NULL,
	`submittedBy` int NOT NULL,
	`status` enum('em revisão','ajustes solicitados','aprovado','substituído') NOT NULL DEFAULT 'em revisão',
	`message` text,
	`submittedAt` bigint NOT NULL,
	`completedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `material_comments` ADD `submissionId` int;--> statement-breakpoint
ALTER TABLE `material_comments` ADD `commentType` enum('comentário','solicitação de ajuste','resposta') DEFAULT 'comentário' NOT NULL;--> statement-breakpoint
ALTER TABLE `material_comments` ADD `resolvedBy` int;--> statement-breakpoint
ALTER TABLE `production_materials` ADD `activityId` int;--> statement-breakpoint
ALTER TABLE `activity_reviewers` ADD CONSTRAINT `activity_reviewers_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_reviewers` ADD CONSTRAINT `activity_reviewers_teamMemberId_team_members_id_fk` FOREIGN KEY (`teamMemberId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_reviewers` ADD CONSTRAINT `activity_reviewers_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coordination_interfaces` ADD CONSTRAINT `coordination_interfaces_responsibleId_team_members_id_fk` FOREIGN KEY (`responsibleId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coordination_interfaces` ADD CONSTRAINT `coordination_interfaces_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_comments` ADD CONSTRAINT `interface_comments_interfaceId_coordination_interfaces_id_fk` FOREIGN KEY (`interfaceId`) REFERENCES `coordination_interfaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_comments` ADD CONSTRAINT `interface_comments_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_groups` ADD CONSTRAINT `interface_groups_interfaceId_coordination_interfaces_id_fk` FOREIGN KEY (`interfaceId`) REFERENCES `coordination_interfaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_groups` ADD CONSTRAINT `interface_groups_groupId_team_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `team_groups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_sections` ADD CONSTRAINT `interface_sections_interfaceId_coordination_interfaces_id_fk` FOREIGN KEY (`interfaceId`) REFERENCES `coordination_interfaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_sections` ADD CONSTRAINT `interface_sections_sectionId_study_sections_id_fk` FOREIGN KEY (`sectionId`) REFERENCES `study_sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_submissions` ADD CONSTRAINT `review_submissions_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_submissions` ADD CONSTRAINT `review_submissions_materialId_production_materials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `production_materials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_submissions` ADD CONSTRAINT `review_submissions_revisionId_material_revisions_id_fk` FOREIGN KEY (`revisionId`) REFERENCES `material_revisions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_submissions` ADD CONSTRAINT `review_submissions_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_reviewers_activity_idx` ON `activity_reviewers` (`activityId`);--> statement-breakpoint
CREATE INDEX `activity_reviewers_member_idx` ON `activity_reviewers` (`teamMemberId`);--> statement-breakpoint
CREATE INDEX `activity_reviewers_status_idx` ON `activity_reviewers` (`status`);--> statement-breakpoint
CREATE INDEX `coordination_interfaces_responsible_idx` ON `coordination_interfaces` (`responsibleId`);--> statement-breakpoint
CREATE INDEX `coordination_interfaces_status_idx` ON `coordination_interfaces` (`status`);--> statement-breakpoint
CREATE INDEX `coordination_interfaces_priority_idx` ON `coordination_interfaces` (`priority`);--> statement-breakpoint
CREATE INDEX `coordination_interfaces_due_idx` ON `coordination_interfaces` (`dueAt`);--> statement-breakpoint
CREATE INDEX `interface_comments_interface_idx` ON `interface_comments` (`interfaceId`);--> statement-breakpoint
CREATE INDEX `interface_groups_interface_idx` ON `interface_groups` (`interfaceId`);--> statement-breakpoint
CREATE INDEX `interface_groups_group_idx` ON `interface_groups` (`groupId`);--> statement-breakpoint
CREATE INDEX `interface_sections_interface_idx` ON `interface_sections` (`interfaceId`);--> statement-breakpoint
CREATE INDEX `interface_sections_section_idx` ON `interface_sections` (`sectionId`);--> statement-breakpoint
CREATE INDEX `review_submissions_activity_idx` ON `review_submissions` (`activityId`);--> statement-breakpoint
CREATE INDEX `review_submissions_material_idx` ON `review_submissions` (`materialId`);--> statement-breakpoint
CREATE INDEX `review_submissions_revision_idx` ON `review_submissions` (`revisionId`);--> statement-breakpoint
CREATE INDEX `review_submissions_status_idx` ON `review_submissions` (`status`);--> statement-breakpoint
ALTER TABLE `material_comments` ADD CONSTRAINT `material_comments_submissionId_review_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `review_submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_comments` ADD CONSTRAINT `material_comments_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_materials` ADD CONSTRAINT `production_materials_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `material_comments_submission_idx` ON `material_comments` (`submissionId`);--> statement-breakpoint
CREATE INDEX `production_materials_activity_idx` ON `production_materials` (`activityId`);