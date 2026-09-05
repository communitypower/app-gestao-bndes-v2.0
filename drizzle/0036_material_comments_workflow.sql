ALTER TABLE `material_comments` ADD COLUMN `status` enum('aberto','implementado','resolvido') NOT NULL DEFAULT 'aberto';
--> statement-breakpoint
ALTER TABLE `material_comments` ADD COLUMN `implementationNote` text;
--> statement-breakpoint
ALTER TABLE `material_comments` ADD COLUMN `implementedAt` bigint;
--> statement-breakpoint
ALTER TABLE `material_comments` ADD COLUMN `implementedBy` int;
