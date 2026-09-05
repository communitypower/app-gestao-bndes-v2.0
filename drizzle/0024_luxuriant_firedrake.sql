CREATE TABLE `activity_structure_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supersededActivityId` int NOT NULL,
	`canonicalActivityId` int,
	`action` enum('consolidada','arquivada') NOT NULL,
	`sourceReference` varchar(320) NOT NULL,
	`snapshot` text NOT NULL,
	`reason` text NOT NULL,
	`performedAt` bigint NOT NULL,
	CONSTRAINT `activity_structure_reconciliations_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_structure_reconciliation_superseded_idx` UNIQUE(`supersededActivityId`)
);
--> statement-breakpoint
ALTER TABLE `activities` ADD `structureStatus` enum('canonica','arquivada') DEFAULT 'canonica' NOT NULL;--> statement-breakpoint
ALTER TABLE `activity_structure_reconciliations` ADD CONSTRAINT `activity_structure_reconciliations_supersededActivityId_activities_id_fk` FOREIGN KEY (`supersededActivityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_structure_reconciliations` ADD CONSTRAINT `activity_structure_reconciliations_canonicalActivityId_activities_id_fk` FOREIGN KEY (`canonicalActivityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_structure_reconciliation_canonical_idx` ON `activity_structure_reconciliations` (`canonicalActivityId`);--> statement-breakpoint
CREATE INDEX `activities_structure_status_idx` ON `activities` (`structureStatus`);