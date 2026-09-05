CREATE TABLE `scope_migration_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`migrationKey` varchar(96) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(80) NOT NULL,
	`snapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scope_migration_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `scope_migration_history_unique_idx` UNIQUE(`migrationKey`,`entityType`,`entityId`)
);
--> statement-breakpoint
CREATE INDEX `scope_migration_history_migration_idx` ON `scope_migration_history` (`migrationKey`);--> statement-breakpoint
CREATE INDEX `scope_migration_history_entity_idx` ON `scope_migration_history` (`entityType`,`entityId`);