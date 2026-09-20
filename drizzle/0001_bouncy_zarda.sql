ALTER TABLE "activity_allocations" ALTER COLUMN "allocatedHours" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "actualStartAt" bigint;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "actualEndAt" bigint;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "nextStep" text;--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD COLUMN "approvalStatus" varchar(64) DEFAULT 'aprovado' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD COLUMN "requiresGeneralCoordinationApproval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD COLUMN "approvedBy" integer;--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD COLUMN "approvedAt" bigint;--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD COLUMN "rejectionReason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "passwordHash" varchar(255);--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD CONSTRAINT "activity_allocations_approvedBy_users_id_fk" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_allocations_approval_idx" ON "activity_allocations" USING btree ("approvalStatus");