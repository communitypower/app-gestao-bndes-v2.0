CREATE TABLE IF NOT EXISTS `participant_notifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `recipientUserId` int NOT NULL,
  `recipientMemberId` int,
  `actorUserId` int,
  `activityId` int,
  `materialId` int,
  `type` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `actionUrl` varchar(255),
  `read` boolean NOT NULL DEFAULT false,
  `readAt` bigint,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `participant_notifications_id` PRIMARY KEY(`id`),
  INDEX `participant_notifications_recipientUser_idx` (`recipientUserId`),
  INDEX `participant_notifications_read_idx` (`read`),
  INDEX `participant_notifications_activity_idx` (`activityId`)
);
