CREATE TABLE `user_access_provisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` text NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`appRole` enum('administrador','colaborador') NOT NULL DEFAULT 'colaborador',
	`status` enum('pendente','ativado','revogado') NOT NULL DEFAULT 'pendente',
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`activatedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_access_provisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_access_provisions_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `user_access_provisions_status_idx` ON `user_access_provisions` (`status`);