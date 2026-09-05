CREATE TABLE `interface_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interfaceId` int NOT NULL,
	`actorId` int NOT NULL,
	`eventType` enum('criada','atualizada','status alterado','resolvida','reaberta') NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interface_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`decision` enum('em revisão','ajustes solicitados','aprovado') NOT NULL,
	`note` text,
	`decidedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_decisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_decisions_unique_idx` UNIQUE(`submissionId`,`reviewerId`)
);
--> statement-breakpoint
ALTER TABLE `interface_events` ADD CONSTRAINT `interface_events_interfaceId_coordination_interfaces_id_fk` FOREIGN KEY (`interfaceId`) REFERENCES `coordination_interfaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interface_events` ADD CONSTRAINT `interface_events_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_decisions` ADD CONSTRAINT `review_decisions_submissionId_review_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `review_submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_decisions` ADD CONSTRAINT `review_decisions_reviewerId_team_members_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `interface_events_interface_idx` ON `interface_events` (`interfaceId`);--> statement-breakpoint
CREATE INDEX `review_decisions_submission_idx` ON `review_decisions` (`submissionId`);--> statement-breakpoint
CREATE INDEX `review_decisions_reviewer_idx` ON `review_decisions` (`reviewerId`);