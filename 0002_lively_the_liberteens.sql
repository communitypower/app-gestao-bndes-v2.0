ALTER TABLE `notification_logs` ADD `attempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD `nextAttemptAt` bigint;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD `lastAttemptAt` bigint;--> statement-breakpoint
CREATE INDEX `notification_logs_queue_idx` ON `notification_logs` (`status`,`nextAttemptAt`);