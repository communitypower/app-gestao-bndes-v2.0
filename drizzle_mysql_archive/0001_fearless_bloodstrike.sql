CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(260) NOT NULL,
	`description` text NOT NULL,
	`sectionId` int NOT NULL,
	`responsibleId` int NOT NULL,
	`dueAt` bigint NOT NULL,
	`status` enum('pendente','em andamento','concluído','atrasado') NOT NULL DEFAULT 'pendente',
	`progress` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `library_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(320) NOT NULL,
	`description` text,
	`theme` varchar(180),
	`sectionId` int,
	`itemType` enum('arquivo','link') NOT NULL,
	`externalUrl` text,
	`fileName` varchar(320),
	`mimeType` varchar(160),
	`fileSize` int,
	`storageKey` text,
	`storageUrl` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `library_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`revisionId` int,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`resolvedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `material_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`revisionNumber` int NOT NULL,
	`notes` text,
	`fileName` varchar(320) NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`fileSize` int NOT NULL,
	`storageKey` text NOT NULL,
	`storageUrl` text NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `material_revisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `material_revisions_unique_idx` UNIQUE(`materialId`,`revisionNumber`)
);
--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`teamMemberId` int NOT NULL,
	`event` enum('atribuicao','prazo_3_dias','atraso') NOT NULL,
	`status` enum('pendente','enviado','falhou','ignorado') NOT NULL DEFAULT 'pendente',
	`recipientPhone` varchar(32),
	`idempotencyKey` varchar(190) NOT NULL,
	`providerMessageId` varchar(255),
	`errorMessage` text,
	`sentAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_logs_idempotency_idx` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `production_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(320) NOT NULL,
	`description` text,
	`sectionId` int NOT NULL,
	`reviewStatus` enum('em elaboração','em revisão','aprovado') NOT NULL DEFAULT 'em elaboração',
	`currentRevision` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `production_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(220) NOT NULL,
	`projectStartAt` bigint NOT NULL,
	`projectEndAt` bigint NOT NULL,
	`timezone` varchar(64) NOT NULL,
	`whatsappEnabled` boolean NOT NULL DEFAULT false,
	`whatsappTemplateName` varchar(128) NOT NULL DEFAULT 'estudo_bndes_alerta_atividade',
	`whatsappLanguageCode` varchar(12) NOT NULL DEFAULT 'pt_BR',
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(4) NOT NULL,
	`title` varchar(320) NOT NULL,
	`sortOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `study_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `study_sections_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(220) NOT NULL,
	`title` varchar(120) NOT NULL,
	`institution` varchar(160) NOT NULL,
	`whatsappPhone` varchar(32),
	`whatsappOptIn` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `appRole` enum('administrador','colaborador') DEFAULT 'colaborador' NOT NULL;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_sectionId_study_sections_id_fk` FOREIGN KEY (`sectionId`) REFERENCES `study_sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_responsibleId_team_members_id_fk` FOREIGN KEY (`responsibleId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library_items` ADD CONSTRAINT `library_items_sectionId_study_sections_id_fk` FOREIGN KEY (`sectionId`) REFERENCES `study_sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library_items` ADD CONSTRAINT `library_items_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_comments` ADD CONSTRAINT `material_comments_materialId_production_materials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `production_materials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_comments` ADD CONSTRAINT `material_comments_revisionId_material_revisions_id_fk` FOREIGN KEY (`revisionId`) REFERENCES `material_revisions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_comments` ADD CONSTRAINT `material_comments_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_revisions` ADD CONSTRAINT `material_revisions_materialId_production_materials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `production_materials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_revisions` ADD CONSTRAINT `material_revisions_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_teamMemberId_team_members_id_fk` FOREIGN KEY (`teamMemberId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_materials` ADD CONSTRAINT `production_materials_sectionId_study_sections_id_fk` FOREIGN KEY (`sectionId`) REFERENCES `study_sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_materials` ADD CONSTRAINT `production_materials_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activities_section_idx` ON `activities` (`sectionId`);--> statement-breakpoint
CREATE INDEX `activities_responsible_idx` ON `activities` (`responsibleId`);--> statement-breakpoint
CREATE INDEX `activities_due_idx` ON `activities` (`dueAt`);--> statement-breakpoint
CREATE INDEX `activities_status_idx` ON `activities` (`status`);--> statement-breakpoint
CREATE INDEX `library_items_section_idx` ON `library_items` (`sectionId`);--> statement-breakpoint
CREATE INDEX `library_items_type_idx` ON `library_items` (`itemType`);--> statement-breakpoint
CREATE INDEX `material_comments_material_idx` ON `material_comments` (`materialId`);--> statement-breakpoint
CREATE INDEX `material_comments_revision_idx` ON `material_comments` (`revisionId`);--> statement-breakpoint
CREATE INDEX `material_revisions_material_idx` ON `material_revisions` (`materialId`);--> statement-breakpoint
CREATE INDEX `notification_logs_activity_idx` ON `notification_logs` (`activityId`);--> statement-breakpoint
CREATE INDEX `notification_logs_event_idx` ON `notification_logs` (`event`);--> statement-breakpoint
CREATE INDEX `production_materials_section_idx` ON `production_materials` (`sectionId`);--> statement-breakpoint
CREATE INDEX `production_materials_status_idx` ON `production_materials` (`reviewStatus`);--> statement-breakpoint
CREATE INDEX `project_settings_cron_task_idx` ON `project_settings` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `study_sections_order_idx` ON `study_sections` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `team_members_user_idx` ON `team_members` (`userId`);--> statement-breakpoint
CREATE INDEX `team_members_name_idx` ON `team_members` (`name`);