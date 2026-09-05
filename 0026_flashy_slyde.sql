CREATE TABLE `activity_document_workflow_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`previousStatus` enum('planejada','em elaboração','submetida à revisão da seção','em revisão da seção','ajustes solicitados','revisada pela seção','consolidada no capítulo','em revisão do tomo','aprovada no tomo','em revisão do projeto','aprovada para documentação final'),
	`nextStatus` enum('planejada','em elaboração','submetida à revisão da seção','em revisão da seção','ajustes solicitados','revisada pela seção','consolidada no capítulo','em revisão do tomo','aprovada no tomo','em revisão do projeto','aprovada para documentação final') NOT NULL,
	`actorId` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_document_workflow_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_editorial_governance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coordinatorId` int NOT NULL,
	`substituteId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_editorial_governance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_editorial_governance_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`previousCoordinatorId` int,
	`nextCoordinatorId` int NOT NULL,
	`previousSubstituteId` int,
	`nextSubstituteId` int NOT NULL,
	`justification` text NOT NULL,
	`assignedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_editorial_governance_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activities` ADD `editorialDeliveryAt` bigint;--> statement-breakpoint
ALTER TABLE `activities` ADD `bndesDeliveryAt` bigint;--> statement-breakpoint
ALTER TABLE `activities` ADD `documentStatus` enum('planejada','em elaboração','submetida à revisão da seção','em revisão da seção','ajustes solicitados','revisada pela seção','consolidada no capítulo','em revisão do tomo','aprovada no tomo','em revisão do projeto','aprovada para documentação final') DEFAULT 'planejada' NOT NULL;--> statement-breakpoint
ALTER TABLE `coordination_interfaces` ADD `blockingClass` enum('prioritária','não prioritária') DEFAULT 'não prioritária' NOT NULL;--> statement-breakpoint
ALTER TABLE `activity_document_workflow_events` ADD CONSTRAINT `adwe_activity_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_document_workflow_events` ADD CONSTRAINT `adwe_actor_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_editorial_governance` ADD CONSTRAINT `peg_coord_fk` FOREIGN KEY (`coordinatorId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_editorial_governance` ADD CONSTRAINT `peg_sub_fk` FOREIGN KEY (`substituteId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_editorial_governance` ADD CONSTRAINT `peg_actor_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_editorial_governance_events` ADD CONSTRAINT `pege_prev_coord_fk` FOREIGN KEY (`previousCoordinatorId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_editorial_governance_events` ADD CONSTRAINT `pege_next_coord_fk` FOREIGN KEY (`nextCoordinatorId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_editorial_governance_events` ADD CONSTRAINT `pege_prev_sub_fk` FOREIGN KEY (`previousSubstituteId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_editorial_governance_events` ADD CONSTRAINT `pege_next_sub_fk` FOREIGN KEY (`nextSubstituteId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_editorial_governance_events` ADD CONSTRAINT `pege_actor_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_document_workflow_events_activity_idx` ON `activity_document_workflow_events` (`activityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `project_editorial_governance_coordinator_idx` ON `project_editorial_governance` (`coordinatorId`);--> statement-breakpoint
CREATE INDEX `project_editorial_governance_substitute_idx` ON `project_editorial_governance` (`substituteId`);--> statement-breakpoint
CREATE INDEX `project_editorial_governance_events_created_idx` ON `project_editorial_governance_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `activities_editorial_delivery_idx` ON `activities` (`editorialDeliveryAt`);--> statement-breakpoint
CREATE INDEX `activities_document_status_idx` ON `activities` (`documentStatus`);--> statement-breakpoint
CREATE INDEX `coordination_interfaces_blocking_class_idx` ON `coordination_interfaces` (`blockingClass`);
