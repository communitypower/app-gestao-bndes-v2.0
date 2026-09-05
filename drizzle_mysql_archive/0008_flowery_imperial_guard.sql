ALTER TABLE `activity_allocations` ADD `allocationType` enum('vigente','histórica') DEFAULT 'vigente' NOT NULL;--> statement-breakpoint
ALTER TABLE `activity_allocations` ADD `note` text;