CREATE TABLE `user_access_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`provisionId` int,
	`actorUserId` int NOT NULL,
	`eventType` enum('perfil_alterado','acesso_revogado','acesso_reativado','pre_cadastro_atualizado') NOT NULL,
	`previousAppRole` enum('administrador','colaborador'),
	`nextAppRole` enum('administrador','colaborador'),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_access_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_access_events_user_idx` ON `user_access_events` (`userId`);--> statement-breakpoint
CREATE INDEX `user_access_events_provision_idx` ON `user_access_events` (`provisionId`);--> statement-breakpoint
CREATE INDEX `user_access_events_created_idx` ON `user_access_events` (`createdAt`);