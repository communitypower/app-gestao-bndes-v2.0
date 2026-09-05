ALTER TABLE `users` MODIFY COLUMN `appRole` enum('administrador','coordenador','executor') NOT NULL DEFAULT 'executor';
--> statement-breakpoint
ALTER TABLE `user_access_provisions` MODIFY COLUMN `appRole` enum('administrador','coordenador','executor') NOT NULL DEFAULT 'executor';
