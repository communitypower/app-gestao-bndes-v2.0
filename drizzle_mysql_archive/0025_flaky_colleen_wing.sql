ALTER TABLE `activity_structure_reconciliations` DROP FOREIGN KEY `activity_structure_reconciliations_supersededActivityId_activities_id_fk`;
--> statement-breakpoint
ALTER TABLE `activity_structure_reconciliations` DROP FOREIGN KEY `activity_structure_reconciliations_canonicalActivityId_activities_id_fk`;
--> statement-breakpoint
ALTER TABLE `activity_structure_reconciliations` ADD CONSTRAINT `asr_superseded_activity_fk` FOREIGN KEY (`supersededActivityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_structure_reconciliations` ADD CONSTRAINT `asr_canonical_activity_fk` FOREIGN KEY (`canonicalActivityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;