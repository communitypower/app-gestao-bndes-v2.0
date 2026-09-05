ALTER TABLE `review_checklist_events` DROP FOREIGN KEY `review_checklist_events_checklistItemId_review_checklist_items_id_fk`;
--> statement-breakpoint
ALTER TABLE `review_checklist_events` ADD CONSTRAINT `rce_item_fk` FOREIGN KEY (`checklistItemId`) REFERENCES `review_checklist_items`(`id`) ON DELETE no action ON UPDATE no action;