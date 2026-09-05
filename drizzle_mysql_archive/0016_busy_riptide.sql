CREATE TABLE `interface_ai_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interfaceId` int NOT NULL,
	`model` varchar(120) NOT NULL,
	`status` enum('concluída','falhou') NOT NULL,
	`resultJson` text,
	`errorMessage` text,
	`requestedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interface_ai_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interface_evidence_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interfaceId` int NOT NULL,
	`activityId` int,
	`fileName` varchar(320) NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`fileSize` int NOT NULL,
	`storageKey` text NOT NULL,
	`storageUrl` text NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interface_evidence_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `interface_ai_analyses` ADD CONSTRAINT `interface_ai_analyses_interfaceId_coordination_interfaces_id_fk` FOREIGN KEY (`interfaceId`) REFERENCES `coordination_interfaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_ai_analyses` ADD CONSTRAINT `interface_ai_analyses_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_evidence_files` ADD CONSTRAINT `interface_evidence_files_interfaceId_coordination_interfaces_id_fk` FOREIGN KEY (`interfaceId`) REFERENCES `coordination_interfaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_evidence_files` ADD CONSTRAINT `interface_evidence_files_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_evidence_files` ADD CONSTRAINT `interface_evidence_files_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `interface_ai_analyses_interface_idx` ON `interface_ai_analyses` (`interfaceId`);--> statement-breakpoint
CREATE INDEX `interface_evidence_files_interface_idx` ON `interface_evidence_files` (`interfaceId`);--> statement-breakpoint
CREATE INDEX `interface_evidence_files_activity_idx` ON `interface_evidence_files` (`activityId`);