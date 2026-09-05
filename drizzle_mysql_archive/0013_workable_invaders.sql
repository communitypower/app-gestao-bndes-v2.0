CREATE TABLE `activity_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`dueAt` bigint NOT NULL,
	`status` enum('planejado','concluído') NOT NULL DEFAULT 'planejado',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_milestones_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_milestones_unique_title_idx` UNIQUE(`activityId`,`title`)
);
--> statement-breakpoint
CREATE TABLE `fieldwork_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`title` varchar(320) NOT NULL,
	`description` text NOT NULL,
	`category` enum('visita a estaleiro','coleta de fonte primária','entrevista estruturada','apresentação de relatório','apresentação para equipe','audiência pública') NOT NULL,
	`country` varchar(96),
	`location` varchar(180),
	`relatedActivityId` int,
	`responsibleId` int,
	`groupId` int,
	`startAt` bigint,
	`dueAt` bigint,
	`status` enum('pendente','em andamento','concluído','atrasado') NOT NULL DEFAULT 'pendente',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldwork_activities_id` PRIMARY KEY(`id`),
	CONSTRAINT `fieldwork_activities_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `interface_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interfaceId` int NOT NULL,
	`activityId` int NOT NULL,
	`role` enum('origem','relacionada') NOT NULL DEFAULT 'relacionada',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interface_activities_id` PRIMARY KEY(`id`),
	CONSTRAINT `interface_activities_unique_idx` UNIQUE(`interfaceId`,`activityId`)
);
--> statement-breakpoint
ALTER TABLE `activity_milestones` ADD CONSTRAINT `activity_milestones_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_milestones` ADD CONSTRAINT `activity_milestones_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fieldwork_activities` ADD CONSTRAINT `fieldwork_activities_relatedActivityId_activities_id_fk` FOREIGN KEY (`relatedActivityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fieldwork_activities` ADD CONSTRAINT `fieldwork_activities_responsibleId_team_members_id_fk` FOREIGN KEY (`responsibleId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fieldwork_activities` ADD CONSTRAINT `fieldwork_activities_groupId_team_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `team_groups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fieldwork_activities` ADD CONSTRAINT `fieldwork_activities_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_activities` ADD CONSTRAINT `interface_activities_interfaceId_coordination_interfaces_id_fk` FOREIGN KEY (`interfaceId`) REFERENCES `coordination_interfaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_activities` ADD CONSTRAINT `interface_activities_activityId_activities_id_fk` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_milestones_activity_idx` ON `activity_milestones` (`activityId`);--> statement-breakpoint
CREATE INDEX `activity_milestones_due_idx` ON `activity_milestones` (`dueAt`);--> statement-breakpoint
CREATE INDEX `fieldwork_activities_related_activity_idx` ON `fieldwork_activities` (`relatedActivityId`);--> statement-breakpoint
CREATE INDEX `fieldwork_activities_group_idx` ON `fieldwork_activities` (`groupId`);--> statement-breakpoint
CREATE INDEX `fieldwork_activities_due_idx` ON `fieldwork_activities` (`dueAt`);--> statement-breakpoint
CREATE INDEX `interface_activities_interface_idx` ON `interface_activities` (`interfaceId`);--> statement-breakpoint
CREATE INDEX `interface_activities_activity_idx` ON `interface_activities` (`activityId`);