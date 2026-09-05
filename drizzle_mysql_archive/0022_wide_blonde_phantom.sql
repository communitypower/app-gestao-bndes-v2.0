CREATE TABLE `project_governance_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`decisionType` enum('implementacao_p0') NOT NULL,
	`decision` enum('aprovada') NOT NULL,
	`note` text,
	`decidedBy` int NOT NULL,
	`decidedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_governance_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_checklist_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistItemId` int NOT NULL,
	`activityId` int NOT NULL,
	`eventType` enum('status_alterado','responsável_alterado','prazo_alterado') NOT NULL,
	`summary` text NOT NULL,
	`actorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_checklist_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_checklist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`scope` enum('seção','capítulo') NOT NULL,
	`itemKey` varchar(80) NOT NULL,
	`title` varchar(320) NOT NULL,
	`responsibleId` int,
	`dueAt` bigint,
	`status` enum('pendente','em andamento','concluído','bloqueado') NOT NULL DEFAULT 'pendente',
	`completedAt` bigint,
	`completedBy` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_checklist_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_checklist_items_unique_idx` UNIQUE(`activityId`,`itemKey`)
);
--> statement-breakpoint
CREATE TABLE `tome_governance_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tome` enum('Apresentação','Tomo I','Tomo II','Tomo III','Tomo IV') NOT NULL,
	`coordinatorId` int,
	`substituteId` int,
	`assignedBy` int,
	`assignedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tome_governance_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `tome_governance_assignments_tome_idx` UNIQUE(`tome`)
);
--> statement-breakpoint
CREATE TABLE `tome_governance_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tome` enum('Apresentação','Tomo I','Tomo II','Tomo III','Tomo IV') NOT NULL,
	`previousCoordinatorId` int,
	`nextCoordinatorId` int,
	`previousSubstituteId` int,
	`nextSubstituteId` int,
	`justification` text NOT NULL,
	`assignedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tome_governance_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `project_governance_decisions` ADD CONSTRAINT `project_governance_decisions_decidedBy_users_id_fk` FOREIGN KEY (`decidedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_checklist_events` ADD CONSTRAINT `rce_item_fk` FOREIGN KEY (`checklistItemId`) REFERENCES `review_checklist_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_checklist_events` ADD CONSTRAINT `review_checklist_events_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_checklist_events` ADD CONSTRAINT `review_checklist_events_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_checklist_items` ADD CONSTRAINT `review_checklist_items_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_checklist_items` ADD CONSTRAINT `review_checklist_items_responsibleId_team_members_id_fk` FOREIGN KEY (`responsibleId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_checklist_items` ADD CONSTRAINT `review_checklist_items_completedBy_users_id_fk` FOREIGN KEY (`completedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_checklist_items` ADD CONSTRAINT `review_checklist_items_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tome_governance_assignments` ADD CONSTRAINT `tome_governance_assignments_coordinatorId_team_members_id_fk` FOREIGN KEY (`coordinatorId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tome_governance_assignments` ADD CONSTRAINT `tome_governance_assignments_substituteId_team_members_id_fk` FOREIGN KEY (`substituteId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tome_governance_assignments` ADD CONSTRAINT `tome_governance_assignments_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tome_governance_events` ADD CONSTRAINT `tome_governance_events_previousCoordinatorId_team_members_id_fk` FOREIGN KEY (`previousCoordinatorId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tome_governance_events` ADD CONSTRAINT `tome_governance_events_nextCoordinatorId_team_members_id_fk` FOREIGN KEY (`nextCoordinatorId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tome_governance_events` ADD CONSTRAINT `tome_governance_events_previousSubstituteId_team_members_id_fk` FOREIGN KEY (`previousSubstituteId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tome_governance_events` ADD CONSTRAINT `tome_governance_events_nextSubstituteId_team_members_id_fk` FOREIGN KEY (`nextSubstituteId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tome_governance_events` ADD CONSTRAINT `tome_governance_events_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `project_governance_decisions_type_idx` ON `project_governance_decisions` (`decisionType`,`decidedAt`);--> statement-breakpoint
CREATE INDEX `review_checklist_events_item_idx` ON `review_checklist_events` (`checklistItemId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `review_checklist_events_activity_idx` ON `review_checklist_events` (`activityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `review_checklist_items_activity_idx` ON `review_checklist_items` (`activityId`,`scope`,`status`);--> statement-breakpoint
CREATE INDEX `review_checklist_items_responsible_idx` ON `review_checklist_items` (`responsibleId`);--> statement-breakpoint
CREATE INDEX `tome_governance_assignments_coordinator_idx` ON `tome_governance_assignments` (`coordinatorId`);--> statement-breakpoint
CREATE INDEX `tome_governance_assignments_substitute_idx` ON `tome_governance_assignments` (`substituteId`);--> statement-breakpoint
CREATE INDEX `tome_governance_events_tome_idx` ON `tome_governance_events` (`tome`,`createdAt`);
