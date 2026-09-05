CREATE TYPE "public"."access_event_type" AS ENUM('perfil_alterado', 'acesso_revogado', 'acesso_reativado', 'pre_cadastro_atualizado', 'convite_enviado');--> statement-breakpoint
CREATE TYPE "public"."access_status" AS ENUM('ativo', 'revogado');--> statement-breakpoint
CREATE TYPE "public"."activity_status" AS ENUM('pendente', 'em andamento', 'concluído', 'atrasado');--> statement-breakpoint
CREATE TYPE "public"."allocation_type" AS ENUM('vigente', 'histórica');--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('administrador', 'coordenador', 'executor');--> statement-breakpoint
CREATE TYPE "public"."blocking_class" AS ENUM('prioritária', 'não prioritária');--> statement-breakpoint
CREATE TYPE "public"."checklist_event_type" AS ENUM('status_alterado', 'responsável_alterado', 'prazo_alterado');--> statement-breakpoint
CREATE TYPE "public"."checklist_scope" AS ENUM('seção', 'capítulo');--> statement-breakpoint
CREATE TYPE "public"."checklist_status" AS ENUM('pendente', 'em andamento', 'concluído', 'bloqueado');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('planejada', 'em elaboração', 'submetida à revisão da seção', 'em revisão da seção', 'ajustes solicitados', 'revisada pela seção', 'consolidada no capítulo', 'em revisão do tomo', 'aprovada no tomo', 'em revisão do projeto', 'aprovada para documentação final');--> statement-breakpoint
CREATE TYPE "public"."evidence_link_type" AS ENUM('material', 'evidência de campo');--> statement-breakpoint
CREATE TYPE "public"."fieldwork_category" AS ENUM('visita a estaleiro', 'coleta de fonte primária', 'entrevista estruturada', 'apresentação de relatório', 'apresentação para equipe', 'audiência pública');--> statement-breakpoint
CREATE TYPE "public"."governance_decision" AS ENUM('aprovada');--> statement-breakpoint
CREATE TYPE "public"."governance_decision_type" AS ENUM('implementacao_p0');--> statement-breakpoint
CREATE TYPE "public"."group_role" AS ENUM('coordenador', 'participante');--> statement-breakpoint
CREATE TYPE "public"."interface_ai_status" AS ENUM('concluída', 'falhou');--> statement-breakpoint
CREATE TYPE "public"."interface_event_type" AS ENUM('criada', 'atualizada', 'status alterado', 'resolvida', 'reaberta');--> statement-breakpoint
CREATE TYPE "public"."interface_group_role" AS ENUM('responsável', 'envolvido');--> statement-breakpoint
CREATE TYPE "public"."interface_priority" AS ENUM('baixa', 'média', 'alta', 'crítica');--> statement-breakpoint
CREATE TYPE "public"."interface_section_role" AS ENUM('origem', 'relacionada');--> statement-breakpoint
CREATE TYPE "public"."interface_status" AS ENUM('identificada', 'em discussão', 'encaminhada', 'resolvida');--> statement-breakpoint
CREATE TYPE "public"."interface_type" AS ENUM('interface', 'escopo sobreposto', 'dependência');--> statement-breakpoint
CREATE TYPE "public"."library_item_type" AS ENUM('arquivo', 'link');--> statement-breakpoint
CREATE TYPE "public"."material_comment_status" AS ENUM('aberto', 'implementado', 'resolvido');--> statement-breakpoint
CREATE TYPE "public"."material_comment_type" AS ENUM('comentário', 'solicitação de ajuste', 'resposta');--> statement-breakpoint
CREATE TYPE "public"."material_review_status" AS ENUM('em elaboração', 'em revisão', 'aprovado');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('planejado', 'concluído');--> statement-breakpoint
CREATE TYPE "public"."notification_log_event" AS ENUM('atribuicao', 'prazo_3_dias', 'atraso');--> statement-breakpoint
CREATE TYPE "public"."notification_log_status" AS ENUM('pendente', 'enviado', 'falhou', 'ignorado');--> statement-breakpoint
CREATE TYPE "public"."provision_status" AS ENUM('pendente', 'ativado', 'revogado');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_action" AS ENUM('consolidada', 'arquivada');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('em revisão', 'ajustes solicitados', 'aprovado');--> statement-breakpoint
CREATE TYPE "public"."review_submission_status" AS ENUM('em revisão', 'ajustes solicitados', 'aprovado', 'substituído');--> statement-breakpoint
CREATE TYPE "public"."reviewer_status" AS ENUM('pendente', 'em revisão', 'ajustes solicitados', 'aprovado');--> statement-breakpoint
CREATE TYPE "public"."structure_status" AS ENUM('canonica', 'arquivada');--> statement-breakpoint
CREATE TYPE "public"."tome_enum" AS ENUM('Apresentação', 'Tomo I', 'Tomo II', 'Tomo III', 'Tomo IV');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"planCode" varchar(8),
	"planSortOrder" integer,
	"parentActivityId" integer,
	"detailCode" varchar(24),
	"detailSortOrder" integer,
	"title" varchar(1000) NOT NULL,
	"description" text NOT NULL,
	"planningSummary" text,
	"planningResponsible" varchar(16),
	"planningSupport" text,
	"portalDeliverable" text,
	"dependencies" text,
	"keywords" text,
	"planningStatus" varchar(40),
	"contentType" varchar(160),
	"visibility" varchar(160),
	"acceptanceCriteria" text,
	"sourceBase" varchar(320),
	"structureStatus" "structure_status" DEFAULT 'canonica' NOT NULL,
	"sectionId" integer NOT NULL,
	"responsibleId" integer NOT NULL,
	"startAt" bigint,
	"dueAt" bigint NOT NULL,
	"editorialDeliveryAt" bigint,
	"bndesDeliveryAt" bigint,
	"documentStatus" "document_status" DEFAULT 'planejada' NOT NULL,
	"status" "activity_status" DEFAULT 'pendente' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"createdBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"teamMemberId" integer NOT NULL,
	"allocatedHours" numeric(8, 2) NOT NULL,
	"responsibility" text,
	"isExecutionLead" boolean DEFAULT false NOT NULL,
	"assignedBy" integer,
	"allocationType" "allocation_type" DEFAULT 'vigente' NOT NULL,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_document_workflow_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"previousStatus" "document_status",
	"nextStatus" "document_status" NOT NULL,
	"actorId" integer NOT NULL,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_evidence_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"label" varchar(240) NOT NULL,
	"url" text NOT NULL,
	"linkType" "evidence_link_type" DEFAULT 'material' NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_leadership_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"previousTeamMemberId" integer,
	"nextTeamMemberId" integer NOT NULL,
	"justification" text NOT NULL,
	"assignedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text,
	"dueAt" bigint NOT NULL,
	"status" "milestone_status" DEFAULT 'planejado' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_reviewers" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"teamMemberId" integer NOT NULL,
	"assignedBy" integer NOT NULL,
	"status" "reviewer_status" DEFAULT 'pendente' NOT NULL,
	"decisionNote" text,
	"decidedAt" bigint,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_structure_reconciliations" (
	"id" serial PRIMARY KEY NOT NULL,
	"supersededActivityId" integer NOT NULL,
	"canonicalActivityId" integer,
	"action" "reconciliation_action" NOT NULL,
	"sourceReference" varchar(320) NOT NULL,
	"snapshot" text NOT NULL,
	"reason" text NOT NULL,
	"performedAt" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coordination_interfaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(320) NOT NULL,
	"description" text NOT NULL,
	"interfaceType" "interface_type" NOT NULL,
	"responsibleId" integer NOT NULL,
	"priority" "interface_priority" DEFAULT 'média' NOT NULL,
	"blockingClass" "blocking_class" DEFAULT 'não prioritária' NOT NULL,
	"status" "interface_status" DEFAULT 'identificada' NOT NULL,
	"dueAt" bigint,
	"resolution" text,
	"createdBy" integer NOT NULL,
	"resolvedAt" bigint,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldwork_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"title" varchar(320) NOT NULL,
	"description" text NOT NULL,
	"category" "fieldwork_category" NOT NULL,
	"country" varchar(96),
	"location" varchar(180),
	"relatedActivityId" integer,
	"responsibleId" integer,
	"groupId" integer,
	"startAt" bigint,
	"dueAt" bigint,
	"status" "activity_status" DEFAULT 'pendente' NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interface_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"interfaceId" integer NOT NULL,
	"activityId" integer NOT NULL,
	"role" "interface_section_role" DEFAULT 'relacionada' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interface_ai_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"interfaceId" integer NOT NULL,
	"model" varchar(120) NOT NULL,
	"status" "interface_ai_status" NOT NULL,
	"resultJson" text,
	"errorMessage" text,
	"requestedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interface_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"interfaceId" integer NOT NULL,
	"authorId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interface_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"interfaceId" integer NOT NULL,
	"actorId" integer NOT NULL,
	"eventType" "interface_event_type" NOT NULL,
	"summary" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interface_evidence_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"interfaceId" integer NOT NULL,
	"activityId" integer,
	"fileName" varchar(320) NOT NULL,
	"mimeType" varchar(160) NOT NULL,
	"fileSize" integer NOT NULL,
	"storageKey" text NOT NULL,
	"storageUrl" text NOT NULL,
	"uploadedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interface_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"interfaceId" integer NOT NULL,
	"groupId" integer NOT NULL,
	"role" "interface_group_role" DEFAULT 'envolvido' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interface_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"interfaceId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"role" "interface_section_role" DEFAULT 'relacionada' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(320) NOT NULL,
	"description" text,
	"theme" varchar(180),
	"sectionId" integer,
	"itemType" "library_item_type" NOT NULL,
	"externalUrl" text,
	"fileName" varchar(320),
	"mimeType" varchar(160),
	"fileSize" integer,
	"storageKey" text,
	"storageUrl" text,
	"uploadedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"materialId" integer NOT NULL,
	"revisionId" integer,
	"submissionId" integer,
	"authorId" integer NOT NULL,
	"content" text NOT NULL,
	"commentType" "material_comment_type" DEFAULT 'comentário' NOT NULL,
	"resolvedAt" bigint,
	"resolvedBy" integer,
	"status" "material_comment_status" DEFAULT 'aberto' NOT NULL,
	"implementationNote" text,
	"implementedAt" bigint,
	"implementedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"materialId" integer NOT NULL,
	"revisionNumber" integer NOT NULL,
	"notes" text,
	"fileName" varchar(320) NOT NULL,
	"mimeType" varchar(160) NOT NULL,
	"fileSize" integer NOT NULL,
	"storageKey" text NOT NULL,
	"storageUrl" text NOT NULL,
	"uploadedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"teamMemberId" integer NOT NULL,
	"event" "notification_log_event" NOT NULL,
	"status" "notification_log_status" DEFAULT 'pendente' NOT NULL,
	"recipientPhone" varchar(32),
	"idempotencyKey" varchar(190) NOT NULL,
	"providerMessageId" varchar(255),
	"errorMessage" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"nextAttemptAt" bigint,
	"lastAttemptAt" bigint,
	"sentAt" bigint,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipientUserId" integer NOT NULL,
	"recipientMemberId" integer,
	"actorUserId" integer,
	"activityId" integer,
	"materialId" integer,
	"type" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"actionUrl" varchar(255),
	"read" boolean DEFAULT false NOT NULL,
	"readAt" bigint,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(320) NOT NULL,
	"description" text,
	"activityId" integer,
	"sectionId" integer NOT NULL,
	"reviewStatus" "material_review_status" DEFAULT 'em elaboração' NOT NULL,
	"currentRevision" integer DEFAULT 1 NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_editorial_governance" (
	"id" serial PRIMARY KEY NOT NULL,
	"coordinatorId" integer NOT NULL,
	"substituteId" integer NOT NULL,
	"assignedBy" integer NOT NULL,
	"assignedAt" bigint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_editorial_governance_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"previousCoordinatorId" integer,
	"nextCoordinatorId" integer NOT NULL,
	"previousSubstituteId" integer,
	"nextSubstituteId" integer NOT NULL,
	"justification" text NOT NULL,
	"assignedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_governance_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"decisionType" "governance_decision_type" NOT NULL,
	"decision" "governance_decision" NOT NULL,
	"note" text,
	"decidedBy" integer NOT NULL,
	"decidedAt" bigint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(220) NOT NULL,
	"projectStartAt" bigint NOT NULL,
	"projectEndAt" bigint NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"whatsappEnabled" boolean DEFAULT false NOT NULL,
	"whatsappTemplateName" varchar(128) DEFAULT 'estudo_bndes_alerta_atividade' NOT NULL,
	"whatsappLanguageCode" varchar(12) DEFAULT 'pt_BR' NOT NULL,
	"scheduleCronTaskUid" varchar(65),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_checklist_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklistItemId" integer NOT NULL,
	"activityId" integer NOT NULL,
	"eventType" "checklist_event_type" NOT NULL,
	"summary" text NOT NULL,
	"actorId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"scope" "checklist_scope" NOT NULL,
	"itemKey" varchar(80) NOT NULL,
	"title" varchar(320) NOT NULL,
	"responsibleId" integer,
	"dueAt" bigint,
	"status" "checklist_status" DEFAULT 'pendente' NOT NULL,
	"completedAt" bigint,
	"completedBy" integer,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"submissionId" integer NOT NULL,
	"reviewerId" integer NOT NULL,
	"decision" "review_decision" NOT NULL,
	"note" text,
	"decidedAt" bigint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"activityId" integer NOT NULL,
	"materialId" integer NOT NULL,
	"revisionId" integer NOT NULL,
	"submittedBy" integer NOT NULL,
	"status" "review_submission_status" DEFAULT 'em revisão' NOT NULL,
	"message" text,
	"submittedAt" bigint NOT NULL,
	"completedAt" bigint,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scope_migration_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"migrationKey" varchar(96) NOT NULL,
	"entityType" varchar(64) NOT NULL,
	"entityId" integer NOT NULL,
	"action" varchar(80) NOT NULL,
	"snapshot" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"title" varchar(320) NOT NULL,
	"officialDescription" text NOT NULL,
	"sortOrder" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_group_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"groupId" integer NOT NULL,
	"teamMemberId" integer NOT NULL,
	"membershipSource" varchar(64) NOT NULL,
	"sourceDocument" varchar(320) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(180) NOT NULL,
	"institution" varchar(160) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"groupId" integer,
	"groupRole" "group_role" DEFAULT 'participante' NOT NULL,
	"name" varchar(220) NOT NULL,
	"title" varchar(120) NOT NULL,
	"institution" varchar(160) NOT NULL,
	"email" varchar(320),
	"whatsappPhone" varchar(32),
	"whatsappOptIn" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tome_governance_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tome" "tome_enum" NOT NULL,
	"coordinatorId" integer,
	"substituteId" integer,
	"assignedBy" integer,
	"assignedAt" bigint,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tome_governance_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"tome" "tome_enum" NOT NULL,
	"previousCoordinatorId" integer,
	"nextCoordinatorId" integer,
	"previousSubstituteId" integer,
	"nextSubstituteId" integer,
	"justification" text NOT NULL,
	"assignedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_access_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"provisionId" integer,
	"actorUserId" integer NOT NULL,
	"eventType" "access_event_type" NOT NULL,
	"previousAppRole" "app_role",
	"nextAppRole" "app_role",
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_access_provisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"appRole" "app_role" DEFAULT 'executor' NOT NULL,
	"status" "provision_status" DEFAULT 'pendente' NOT NULL,
	"userId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"activatedAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordHash" varchar(255),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"appRole" "app_role" DEFAULT 'executor' NOT NULL,
	"accessStatus" "access_status" DEFAULT 'ativo' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_sectionId_study_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."study_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_responsibleId_team_members_id_fk" FOREIGN KEY ("responsibleId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_parentActivityId_activities_id_fk" FOREIGN KEY ("parentActivityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD CONSTRAINT "activity_allocations_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD CONSTRAINT "activity_allocations_teamMemberId_team_members_id_fk" FOREIGN KEY ("teamMemberId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_allocations" ADD CONSTRAINT "activity_allocations_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_document_workflow_events" ADD CONSTRAINT "adwe_activity_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_document_workflow_events" ADD CONSTRAINT "adwe_actor_fk" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_evidence_links" ADD CONSTRAINT "activity_evidence_links_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_evidence_links" ADD CONSTRAINT "activity_evidence_links_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_leadership_events" ADD CONSTRAINT "activity_leadership_events_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_leadership_events" ADD CONSTRAINT "activity_leadership_events_previousTeamMemberId_team_members_id_fk" FOREIGN KEY ("previousTeamMemberId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_leadership_events" ADD CONSTRAINT "activity_leadership_events_nextTeamMemberId_team_members_id_fk" FOREIGN KEY ("nextTeamMemberId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_leadership_events" ADD CONSTRAINT "activity_leadership_events_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_milestones" ADD CONSTRAINT "activity_milestones_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_milestones" ADD CONSTRAINT "activity_milestones_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reviewers" ADD CONSTRAINT "activity_reviewers_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reviewers" ADD CONSTRAINT "activity_reviewers_teamMemberId_team_members_id_fk" FOREIGN KEY ("teamMemberId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reviewers" ADD CONSTRAINT "activity_reviewers_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_structure_reconciliations" ADD CONSTRAINT "asr_superseded_activity_fk" FOREIGN KEY ("supersededActivityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_structure_reconciliations" ADD CONSTRAINT "asr_canonical_activity_fk" FOREIGN KEY ("canonicalActivityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coordination_interfaces" ADD CONSTRAINT "coordination_interfaces_responsibleId_team_members_id_fk" FOREIGN KEY ("responsibleId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coordination_interfaces" ADD CONSTRAINT "coordination_interfaces_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldwork_activities" ADD CONSTRAINT "fieldwork_activities_relatedActivityId_activities_id_fk" FOREIGN KEY ("relatedActivityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldwork_activities" ADD CONSTRAINT "fieldwork_activities_responsibleId_team_members_id_fk" FOREIGN KEY ("responsibleId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldwork_activities" ADD CONSTRAINT "fieldwork_activities_groupId_team_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."team_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldwork_activities" ADD CONSTRAINT "fieldwork_activities_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_activities" ADD CONSTRAINT "interface_activities_interfaceId_coordination_interfaces_id_fk" FOREIGN KEY ("interfaceId") REFERENCES "public"."coordination_interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_activities" ADD CONSTRAINT "interface_activities_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_ai_analyses" ADD CONSTRAINT "interface_ai_analyses_interfaceId_coordination_interfaces_id_fk" FOREIGN KEY ("interfaceId") REFERENCES "public"."coordination_interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_ai_analyses" ADD CONSTRAINT "interface_ai_analyses_requestedBy_users_id_fk" FOREIGN KEY ("requestedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_comments" ADD CONSTRAINT "interface_comments_interfaceId_coordination_interfaces_id_fk" FOREIGN KEY ("interfaceId") REFERENCES "public"."coordination_interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_comments" ADD CONSTRAINT "interface_comments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_events" ADD CONSTRAINT "interface_events_interfaceId_coordination_interfaces_id_fk" FOREIGN KEY ("interfaceId") REFERENCES "public"."coordination_interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_events" ADD CONSTRAINT "interface_events_actorId_users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_evidence_files" ADD CONSTRAINT "interface_evidence_files_interfaceId_coordination_interfaces_id_fk" FOREIGN KEY ("interfaceId") REFERENCES "public"."coordination_interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_evidence_files" ADD CONSTRAINT "interface_evidence_files_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_evidence_files" ADD CONSTRAINT "interface_evidence_files_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_groups" ADD CONSTRAINT "interface_groups_interfaceId_coordination_interfaces_id_fk" FOREIGN KEY ("interfaceId") REFERENCES "public"."coordination_interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_groups" ADD CONSTRAINT "interface_groups_groupId_team_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."team_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_sections" ADD CONSTRAINT "interface_sections_interfaceId_coordination_interfaces_id_fk" FOREIGN KEY ("interfaceId") REFERENCES "public"."coordination_interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_sections" ADD CONSTRAINT "interface_sections_sectionId_study_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."study_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_sectionId_study_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."study_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_comments" ADD CONSTRAINT "material_comments_materialId_production_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."production_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_comments" ADD CONSTRAINT "material_comments_revisionId_material_revisions_id_fk" FOREIGN KEY ("revisionId") REFERENCES "public"."material_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_comments" ADD CONSTRAINT "material_comments_submissionId_review_submissions_id_fk" FOREIGN KEY ("submissionId") REFERENCES "public"."review_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_comments" ADD CONSTRAINT "material_comments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_comments" ADD CONSTRAINT "material_comments_resolvedBy_users_id_fk" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_comments" ADD CONSTRAINT "material_comments_implementedBy_users_id_fk" FOREIGN KEY ("implementedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_revisions" ADD CONSTRAINT "material_revisions_materialId_production_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."production_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_revisions" ADD CONSTRAINT "material_revisions_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_teamMemberId_team_members_id_fk" FOREIGN KEY ("teamMemberId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_materials" ADD CONSTRAINT "production_materials_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_materials" ADD CONSTRAINT "production_materials_sectionId_study_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."study_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_materials" ADD CONSTRAINT "production_materials_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_editorial_governance" ADD CONSTRAINT "peg_coord_fk" FOREIGN KEY ("coordinatorId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_editorial_governance" ADD CONSTRAINT "peg_sub_fk" FOREIGN KEY ("substituteId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_editorial_governance" ADD CONSTRAINT "peg_actor_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_editorial_governance_events" ADD CONSTRAINT "pege_prev_coord_fk" FOREIGN KEY ("previousCoordinatorId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_editorial_governance_events" ADD CONSTRAINT "pege_next_coord_fk" FOREIGN KEY ("nextCoordinatorId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_editorial_governance_events" ADD CONSTRAINT "pege_prev_sub_fk" FOREIGN KEY ("previousSubstituteId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_editorial_governance_events" ADD CONSTRAINT "pege_next_sub_fk" FOREIGN KEY ("nextSubstituteId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_editorial_governance_events" ADD CONSTRAINT "pege_actor_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_governance_decisions" ADD CONSTRAINT "project_governance_decisions_decidedBy_users_id_fk" FOREIGN KEY ("decidedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_checklist_events" ADD CONSTRAINT "review_checklist_events_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_checklist_events" ADD CONSTRAINT "review_checklist_events_actorId_users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_checklist_events" ADD CONSTRAINT "rce_item_fk" FOREIGN KEY ("checklistItemId") REFERENCES "public"."review_checklist_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_checklist_items" ADD CONSTRAINT "review_checklist_items_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_checklist_items" ADD CONSTRAINT "review_checklist_items_responsibleId_team_members_id_fk" FOREIGN KEY ("responsibleId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_checklist_items" ADD CONSTRAINT "review_checklist_items_completedBy_users_id_fk" FOREIGN KEY ("completedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_checklist_items" ADD CONSTRAINT "review_checklist_items_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_submissionId_review_submissions_id_fk" FOREIGN KEY ("submissionId") REFERENCES "public"."review_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_reviewerId_team_members_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_submissions" ADD CONSTRAINT "review_submissions_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_submissions" ADD CONSTRAINT "review_submissions_materialId_production_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."production_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_submissions" ADD CONSTRAINT "review_submissions_revisionId_material_revisions_id_fk" FOREIGN KEY ("revisionId") REFERENCES "public"."material_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_submissions" ADD CONSTRAINT "review_submissions_submittedBy_users_id_fk" FOREIGN KEY ("submittedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_group_memberships" ADD CONSTRAINT "team_group_memberships_groupId_team_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."team_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_group_memberships" ADD CONSTRAINT "team_group_memberships_teamMemberId_team_members_id_fk" FOREIGN KEY ("teamMemberId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_groupId_team_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."team_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tome_governance_assignments" ADD CONSTRAINT "tome_governance_assignments_coordinatorId_team_members_id_fk" FOREIGN KEY ("coordinatorId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tome_governance_assignments" ADD CONSTRAINT "tome_governance_assignments_substituteId_team_members_id_fk" FOREIGN KEY ("substituteId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tome_governance_assignments" ADD CONSTRAINT "tome_governance_assignments_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tome_governance_events" ADD CONSTRAINT "tome_governance_events_previousCoordinatorId_team_members_id_fk" FOREIGN KEY ("previousCoordinatorId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tome_governance_events" ADD CONSTRAINT "tome_governance_events_nextCoordinatorId_team_members_id_fk" FOREIGN KEY ("nextCoordinatorId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tome_governance_events" ADD CONSTRAINT "tome_governance_events_previousSubstituteId_team_members_id_fk" FOREIGN KEY ("previousSubstituteId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tome_governance_events" ADD CONSTRAINT "tome_governance_events_nextSubstituteId_team_members_id_fk" FOREIGN KEY ("nextSubstituteId") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tome_governance_events" ADD CONSTRAINT "tome_governance_events_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_plan_code_idx" ON "activities" USING btree ("planCode");--> statement-breakpoint
CREATE INDEX "activities_plan_order_idx" ON "activities" USING btree ("planSortOrder");--> statement-breakpoint
CREATE INDEX "activities_parent_activity_idx" ON "activities" USING btree ("parentActivityId");--> statement-breakpoint
CREATE UNIQUE INDEX "activities_detail_code_idx" ON "activities" USING btree ("detailCode");--> statement-breakpoint
CREATE INDEX "activities_detail_order_idx" ON "activities" USING btree ("parentActivityId","detailSortOrder");--> statement-breakpoint
CREATE INDEX "activities_section_idx" ON "activities" USING btree ("sectionId");--> statement-breakpoint
CREATE INDEX "activities_responsible_idx" ON "activities" USING btree ("responsibleId");--> statement-breakpoint
CREATE INDEX "activities_start_idx" ON "activities" USING btree ("startAt");--> statement-breakpoint
CREATE INDEX "activities_due_idx" ON "activities" USING btree ("dueAt");--> statement-breakpoint
CREATE INDEX "activities_editorial_delivery_idx" ON "activities" USING btree ("editorialDeliveryAt");--> statement-breakpoint
CREATE INDEX "activities_document_status_idx" ON "activities" USING btree ("documentStatus");--> statement-breakpoint
CREATE INDEX "activities_status_idx" ON "activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "activities_structure_status_idx" ON "activities" USING btree ("structureStatus");--> statement-breakpoint
CREATE INDEX "activity_allocations_activity_idx" ON "activity_allocations" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "activity_allocations_member_idx" ON "activity_allocations" USING btree ("teamMemberId");--> statement-breakpoint
CREATE INDEX "activity_allocations_execution_lead_idx" ON "activity_allocations" USING btree ("activityId","allocationType","isExecutionLead");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_allocations_unique_idx" ON "activity_allocations" USING btree ("activityId","teamMemberId");--> statement-breakpoint
CREATE INDEX "activity_document_workflow_events_activity_idx" ON "activity_document_workflow_events" USING btree ("activityId","createdAt");--> statement-breakpoint
CREATE INDEX "activity_evidence_links_activity_idx" ON "activity_evidence_links" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "activity_leadership_events_activity_idx" ON "activity_leadership_events" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "activity_leadership_events_created_idx" ON "activity_leadership_events" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "activity_milestones_activity_idx" ON "activity_milestones" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "activity_milestones_due_idx" ON "activity_milestones" USING btree ("dueAt");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_milestones_unique_title_idx" ON "activity_milestones" USING btree ("activityId","title");--> statement-breakpoint
CREATE INDEX "activity_reviewers_activity_idx" ON "activity_reviewers" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "activity_reviewers_member_idx" ON "activity_reviewers" USING btree ("teamMemberId");--> statement-breakpoint
CREATE INDEX "activity_reviewers_status_idx" ON "activity_reviewers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_reviewers_unique_idx" ON "activity_reviewers" USING btree ("activityId","teamMemberId");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_structure_reconciliation_superseded_idx" ON "activity_structure_reconciliations" USING btree ("supersededActivityId");--> statement-breakpoint
CREATE INDEX "activity_structure_reconciliation_canonical_idx" ON "activity_structure_reconciliations" USING btree ("canonicalActivityId");--> statement-breakpoint
CREATE INDEX "coordination_interfaces_responsible_idx" ON "coordination_interfaces" USING btree ("responsibleId");--> statement-breakpoint
CREATE INDEX "coordination_interfaces_status_idx" ON "coordination_interfaces" USING btree ("status");--> statement-breakpoint
CREATE INDEX "coordination_interfaces_priority_idx" ON "coordination_interfaces" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "coordination_interfaces_blocking_class_idx" ON "coordination_interfaces" USING btree ("blockingClass");--> statement-breakpoint
CREATE INDEX "coordination_interfaces_due_idx" ON "coordination_interfaces" USING btree ("dueAt");--> statement-breakpoint
CREATE UNIQUE INDEX "fieldwork_activities_code_idx" ON "fieldwork_activities" USING btree ("code");--> statement-breakpoint
CREATE INDEX "fieldwork_activities_related_activity_idx" ON "fieldwork_activities" USING btree ("relatedActivityId");--> statement-breakpoint
CREATE INDEX "fieldwork_activities_group_idx" ON "fieldwork_activities" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX "fieldwork_activities_due_idx" ON "fieldwork_activities" USING btree ("dueAt");--> statement-breakpoint
CREATE INDEX "interface_activities_interface_idx" ON "interface_activities" USING btree ("interfaceId");--> statement-breakpoint
CREATE INDEX "interface_activities_activity_idx" ON "interface_activities" USING btree ("activityId");--> statement-breakpoint
CREATE UNIQUE INDEX "interface_activities_unique_idx" ON "interface_activities" USING btree ("interfaceId","activityId");--> statement-breakpoint
CREATE INDEX "interface_ai_analyses_interface_idx" ON "interface_ai_analyses" USING btree ("interfaceId");--> statement-breakpoint
CREATE INDEX "interface_comments_interface_idx" ON "interface_comments" USING btree ("interfaceId");--> statement-breakpoint
CREATE INDEX "interface_events_interface_idx" ON "interface_events" USING btree ("interfaceId");--> statement-breakpoint
CREATE INDEX "interface_evidence_files_interface_idx" ON "interface_evidence_files" USING btree ("interfaceId");--> statement-breakpoint
CREATE INDEX "interface_evidence_files_activity_idx" ON "interface_evidence_files" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "interface_groups_interface_idx" ON "interface_groups" USING btree ("interfaceId");--> statement-breakpoint
CREATE INDEX "interface_groups_group_idx" ON "interface_groups" USING btree ("groupId");--> statement-breakpoint
CREATE UNIQUE INDEX "interface_groups_unique_idx" ON "interface_groups" USING btree ("interfaceId","groupId");--> statement-breakpoint
CREATE INDEX "interface_sections_interface_idx" ON "interface_sections" USING btree ("interfaceId");--> statement-breakpoint
CREATE INDEX "interface_sections_section_idx" ON "interface_sections" USING btree ("sectionId");--> statement-breakpoint
CREATE UNIQUE INDEX "interface_sections_unique_idx" ON "interface_sections" USING btree ("interfaceId","sectionId");--> statement-breakpoint
CREATE INDEX "library_items_section_idx" ON "library_items" USING btree ("sectionId");--> statement-breakpoint
CREATE INDEX "library_items_type_idx" ON "library_items" USING btree ("itemType");--> statement-breakpoint
CREATE INDEX "material_comments_material_idx" ON "material_comments" USING btree ("materialId");--> statement-breakpoint
CREATE INDEX "material_comments_revision_idx" ON "material_comments" USING btree ("revisionId");--> statement-breakpoint
CREATE INDEX "material_comments_submission_idx" ON "material_comments" USING btree ("submissionId");--> statement-breakpoint
CREATE INDEX "material_revisions_material_idx" ON "material_revisions" USING btree ("materialId");--> statement-breakpoint
CREATE UNIQUE INDEX "material_revisions_unique_idx" ON "material_revisions" USING btree ("materialId","revisionNumber");--> statement-breakpoint
CREATE INDEX "notification_logs_activity_idx" ON "notification_logs" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "notification_logs_event_idx" ON "notification_logs" USING btree ("event");--> statement-breakpoint
CREATE INDEX "notification_logs_queue_idx" ON "notification_logs" USING btree ("status","nextAttemptAt");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_logs_idempotency_idx" ON "notification_logs" USING btree ("idempotencyKey");--> statement-breakpoint
CREATE INDEX "participant_notifications_recipientUser_idx" ON "participant_notifications" USING btree ("recipientUserId");--> statement-breakpoint
CREATE INDEX "participant_notifications_read_idx" ON "participant_notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "participant_notifications_activity_idx" ON "participant_notifications" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "production_materials_activity_idx" ON "production_materials" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "production_materials_section_idx" ON "production_materials" USING btree ("sectionId");--> statement-breakpoint
CREATE INDEX "production_materials_status_idx" ON "production_materials" USING btree ("reviewStatus");--> statement-breakpoint
CREATE INDEX "project_editorial_governance_coordinator_idx" ON "project_editorial_governance" USING btree ("coordinatorId");--> statement-breakpoint
CREATE INDEX "project_editorial_governance_substitute_idx" ON "project_editorial_governance" USING btree ("substituteId");--> statement-breakpoint
CREATE INDEX "project_editorial_governance_events_created_idx" ON "project_editorial_governance_events" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "project_governance_decisions_type_idx" ON "project_governance_decisions" USING btree ("decisionType","decidedAt");--> statement-breakpoint
CREATE INDEX "project_settings_cron_task_idx" ON "project_settings" USING btree ("scheduleCronTaskUid");--> statement-breakpoint
CREATE INDEX "review_checklist_events_item_idx" ON "review_checklist_events" USING btree ("checklistItemId","createdAt");--> statement-breakpoint
CREATE INDEX "review_checklist_events_activity_idx" ON "review_checklist_events" USING btree ("activityId","createdAt");--> statement-breakpoint
CREATE INDEX "review_checklist_items_activity_idx" ON "review_checklist_items" USING btree ("activityId","scope","status");--> statement-breakpoint
CREATE INDEX "review_checklist_items_responsible_idx" ON "review_checklist_items" USING btree ("responsibleId");--> statement-breakpoint
CREATE UNIQUE INDEX "review_checklist_items_unique_idx" ON "review_checklist_items" USING btree ("activityId","itemKey");--> statement-breakpoint
CREATE INDEX "review_decisions_submission_idx" ON "review_decisions" USING btree ("submissionId");--> statement-breakpoint
CREATE INDEX "review_decisions_reviewer_idx" ON "review_decisions" USING btree ("reviewerId");--> statement-breakpoint
CREATE UNIQUE INDEX "review_decisions_unique_idx" ON "review_decisions" USING btree ("submissionId","reviewerId");--> statement-breakpoint
CREATE INDEX "review_submissions_activity_idx" ON "review_submissions" USING btree ("activityId");--> statement-breakpoint
CREATE INDEX "review_submissions_material_idx" ON "review_submissions" USING btree ("materialId");--> statement-breakpoint
CREATE INDEX "review_submissions_revision_idx" ON "review_submissions" USING btree ("revisionId");--> statement-breakpoint
CREATE INDEX "review_submissions_status_idx" ON "review_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scope_migration_history_migration_idx" ON "scope_migration_history" USING btree ("migrationKey");--> statement-breakpoint
CREATE INDEX "scope_migration_history_entity_idx" ON "scope_migration_history" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE UNIQUE INDEX "scope_migration_history_unique_idx" ON "scope_migration_history" USING btree ("migrationKey","entityType","entityId");--> statement-breakpoint
CREATE UNIQUE INDEX "study_sections_code_idx" ON "study_sections" USING btree ("code");--> statement-breakpoint
CREATE INDEX "study_sections_order_idx" ON "study_sections" USING btree ("sortOrder");--> statement-breakpoint
CREATE INDEX "team_group_memberships_group_idx" ON "team_group_memberships" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX "team_group_memberships_member_idx" ON "team_group_memberships" USING btree ("teamMemberId");--> statement-breakpoint
CREATE UNIQUE INDEX "team_group_memberships_unique_idx" ON "team_group_memberships" USING btree ("groupId","teamMemberId");--> statement-breakpoint
CREATE UNIQUE INDEX "team_groups_name_idx" ON "team_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "team_groups_institution_idx" ON "team_groups" USING btree ("institution");--> statement-breakpoint
CREATE INDEX "team_members_user_idx" ON "team_members" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "team_members_group_idx" ON "team_members" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX "team_members_group_role_idx" ON "team_members" USING btree ("groupId","groupRole");--> statement-breakpoint
CREATE INDEX "team_members_name_idx" ON "team_members" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tome_governance_assignments_tome_idx" ON "tome_governance_assignments" USING btree ("tome");--> statement-breakpoint
CREATE INDEX "tome_governance_assignments_coordinator_idx" ON "tome_governance_assignments" USING btree ("coordinatorId");--> statement-breakpoint
CREATE INDEX "tome_governance_assignments_substitute_idx" ON "tome_governance_assignments" USING btree ("substituteId");--> statement-breakpoint
CREATE INDEX "tome_governance_events_tome_idx" ON "tome_governance_events" USING btree ("tome","createdAt");--> statement-breakpoint
CREATE INDEX "user_access_events_user_idx" ON "user_access_events" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_access_events_provision_idx" ON "user_access_events" USING btree ("provisionId");--> statement-breakpoint
CREATE INDEX "user_access_events_created_idx" ON "user_access_events" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "user_access_provisions_email_unique" ON "user_access_provisions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_access_provisions_status_idx" ON "user_access_provisions" USING btree ("status");