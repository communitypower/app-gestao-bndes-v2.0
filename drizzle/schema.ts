import {
  bigint,
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ==========================================
// Enums
// ==========================================
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const appRoleEnum = pgEnum("app_role", ["administrador", "coordenador", "executor"]);
export const accessStatusEnum = pgEnum("access_status", ["ativo", "revogado"]);
export const provisionStatusEnum = pgEnum("provision_status", ["pendente", "ativado", "revogado"]);
export const accessEventTypeEnum = pgEnum("access_event_type", [
  "perfil_alterado",
  "acesso_revogado",
  "acesso_reativado",
  "pre_cadastro_atualizado",
  "convite_enviado",
]);
export const governanceDecisionTypeEnum = pgEnum("governance_decision_type", ["implementacao_p0"]);
export const governanceDecisionEnum = pgEnum("governance_decision", ["aprovada"]);
export const groupRoleEnum = pgEnum("group_role", ["coordenador", "participante"]);
export const tomeEnum = pgEnum("tome_enum", ["Apresentação", "Tomo I", "Tomo II", "Tomo III", "Tomo IV"]);
export const structureStatusEnum = pgEnum("structure_status", ["canonica", "arquivada"]);
export const documentStatusEnum = pgEnum("document_status", [
  "planejada",
  "em elaboração",
  "submetida à revisão da seção",
  "em revisão da seção",
  "ajustes solicitados",
  "revisada pela seção",
  "consolidada no capítulo",
  "em revisão do tomo",
  "aprovada no tomo",
  "em revisão do projeto",
  "aprovada para documentação final",
]);
export const activityStatusEnum = pgEnum("activity_status", [
  "pendente",
  "em andamento",
  "concluído",
  "atrasado",
]);
export const reconciliationActionEnum = pgEnum("reconciliation_action", ["consolidada", "arquivada"]);
export const milestoneStatusEnum = pgEnum("milestone_status", ["planejado", "concluído"]);
export const fieldworkCategoryEnum = pgEnum("fieldwork_category", [
  "visita a estaleiro",
  "coleta de fonte primária",
  "entrevista estruturada",
  "apresentação de relatório",
  "apresentação para equipe",
  "audiência pública",
]);
export const allocationTypeEnum = pgEnum("allocation_type", ["vigente", "histórica"]);
export const evidenceLinkTypeEnum = pgEnum("evidence_link_type", ["material", "evidência de campo"]);
export const reviewerStatusEnum = pgEnum("reviewer_status", [
  "pendente",
  "em revisão",
  "ajustes solicitados",
  "aprovado",
]);
export const checklistScopeEnum = pgEnum("checklist_scope", ["seção", "capítulo"]);
export const checklistStatusEnum = pgEnum("checklist_status", [
  "pendente",
  "em andamento",
  "concluído",
  "bloqueado",
]);
export const checklistEventTypeEnum = pgEnum("checklist_event_type", [
  "status_alterado",
  "responsável_alterado",
  "prazo_alterado",
]);
export const libraryItemTypeEnum = pgEnum("library_item_type", ["arquivo", "link"]);
export const materialReviewStatusEnum = pgEnum("material_review_status", [
  "em elaboração",
  "em revisão",
  "aprovado",
]);
export const reviewSubmissionStatusEnum = pgEnum("review_submission_status", [
  "em revisão",
  "ajustes solicitados",
  "aprovado",
  "substituído",
]);
export const reviewDecisionEnum = pgEnum("review_decision", [
  "em revisão",
  "ajustes solicitados",
  "aprovado",
]);
export const materialCommentTypeEnum = pgEnum("material_comment_type", [
  "comentário",
  "solicitação de ajuste",
  "resposta",
]);
export const materialCommentStatusEnum = pgEnum("material_comment_status", [
  "aberto",
  "implementado",
  "resolvido",
]);
export const interfaceTypeEnum = pgEnum("interface_type", [
  "interface",
  "escopo sobreposto",
  "dependência",
]);
export const interfacePriorityEnum = pgEnum("interface_priority", [
  "baixa",
  "média",
  "alta",
  "crítica",
]);
export const blockingClassEnum = pgEnum("blocking_class", ["prioritária", "não prioritária"]);
export const interfaceStatusEnum = pgEnum("interface_status", [
  "identificada",
  "em discussão",
  "encaminhada",
  "resolvida",
]);
export const interfaceSectionRoleEnum = pgEnum("interface_section_role", ["origem", "relacionada"]);
export const interfaceGroupRoleEnum = pgEnum("interface_group_role", ["responsável", "envolvido"]);
export const interfaceAiStatusEnum = pgEnum("interface_ai_status", ["concluída", "falhou"]);
export const interfaceEventTypeEnum = pgEnum("interface_event_type", [
  "criada",
  "atualizada",
  "status alterado",
  "resolvida",
  "reaberta",
]);
export const notificationLogEventEnum = pgEnum("notification_log_event", [
  "atribuicao",
  "prazo_3_dias",
  "atraso",
]);
export const notificationLogStatusEnum = pgEnum("notification_log_status", [
  "pendente",
  "enviado",
  "falhou",
  "ignorado",
]);

// ==========================================
// Tables
// ==========================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  appRole: appRoleEnum("appRole").default("executor").notNull(),
  accessStatus: accessStatusEnum("accessStatus").default("ativo").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { mode: "date" }).defaultNow().notNull(),
});

export const userAccessProvisions = pgTable(
  "user_access_provisions",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    appRole: appRoleEnum("appRole").default("executor").notNull(),
    status: provisionStatusEnum("status").default("pendente").notNull(),
    userId: integer("userId"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    activatedAt: timestamp("activatedAt", { mode: "date" }),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("user_access_provisions_email_unique").on(table.email),
    index("user_access_provisions_status_idx").on(table.status),
  ]
);

export const userAccessEvents = pgTable(
  "user_access_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId"),
    provisionId: integer("provisionId"),
    actorUserId: integer("actorUserId").notNull(),
    eventType: accessEventTypeEnum("eventType").notNull(),
    previousAppRole: appRoleEnum("previousAppRole"),
    nextAppRole: appRoleEnum("nextAppRole"),
    note: text("note"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("user_access_events_user_idx").on(table.userId),
    index("user_access_events_provision_idx").on(table.provisionId),
    index("user_access_events_created_idx").on(table.createdAt),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projectSettings = pgTable(
  "project_settings",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 220 }).notNull(),
    projectStartAt: bigint("projectStartAt", { mode: "number" }).notNull(),
    projectEndAt: bigint("projectEndAt", { mode: "number" }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull(),
    whatsappEnabled: boolean("whatsappEnabled").default(false).notNull(),
    whatsappTemplateName: varchar("whatsappTemplateName", { length: 128 })
      .default("estudo_bndes_alerta_atividade")
      .notNull(),
    whatsappLanguageCode: varchar("whatsappLanguageCode", { length: 12 })
      .default("pt_BR")
      .notNull(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("project_settings_cron_task_idx").on(table.scheduleCronTaskUid),
  ]
);

export const projectGovernanceDecisions = pgTable(
  "project_governance_decisions",
  {
    id: serial("id").primaryKey(),
    decisionType: governanceDecisionTypeEnum("decisionType").notNull(),
    decision: governanceDecisionEnum("decision").notNull(),
    note: text("note"),
    decidedBy: integer("decidedBy").notNull().references(() => users.id),
    decidedAt: bigint("decidedAt", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("project_governance_decisions_type_idx").on(table.decisionType, table.decidedAt),
  ]
);

export const studySections = pgTable(
  "study_sections",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 8 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    officialDescription: text("officialDescription").notNull(),
    sortOrder: integer("sortOrder").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("study_sections_code_idx").on(table.code),
    index("study_sections_order_idx").on(table.sortOrder),
  ]
);

export const teamGroups = pgTable(
  "team_groups",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    institution: varchar("institution", { length: 160 }).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("team_groups_name_idx").on(table.name),
    index("team_groups_institution_idx").on(table.institution),
  ]
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").references(() => users.id),
    groupId: integer("groupId").references(() => teamGroups.id),
    groupRole: groupRoleEnum("groupRole").default("participante").notNull(),
    name: varchar("name", { length: 220 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    institution: varchar("institution", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }),
    whatsappPhone: varchar("whatsappPhone", { length: 32 }),
    whatsappOptIn: boolean("whatsappOptIn").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("team_members_user_idx").on(table.userId),
    index("team_members_group_idx").on(table.groupId),
    index("team_members_group_role_idx").on(table.groupId, table.groupRole),
    index("team_members_name_idx").on(table.name),
  ]
);

export const projectEditorialGovernance = pgTable(
  "project_editorial_governance",
  {
    id: serial("id").primaryKey(),
    coordinatorId: integer("coordinatorId").notNull(),
    substituteId: integer("substituteId").notNull(),
    assignedBy: integer("assignedBy").notNull(),
    assignedAt: bigint("assignedAt", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    foreignKey({ columns: [table.coordinatorId], foreignColumns: [teamMembers.id], name: "peg_coord_fk" }),
    foreignKey({ columns: [table.substituteId], foreignColumns: [teamMembers.id], name: "peg_sub_fk" }),
    foreignKey({ columns: [table.assignedBy], foreignColumns: [users.id], name: "peg_actor_fk" }),
    index("project_editorial_governance_coordinator_idx").on(table.coordinatorId),
    index("project_editorial_governance_substitute_idx").on(table.substituteId),
  ]
);

export const projectEditorialGovernanceEvents = pgTable(
  "project_editorial_governance_events",
  {
    id: serial("id").primaryKey(),
    previousCoordinatorId: integer("previousCoordinatorId"),
    nextCoordinatorId: integer("nextCoordinatorId").notNull(),
    previousSubstituteId: integer("previousSubstituteId"),
    nextSubstituteId: integer("nextSubstituteId").notNull(),
    justification: text("justification").notNull(),
    assignedBy: integer("assignedBy").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    foreignKey({ columns: [table.previousCoordinatorId], foreignColumns: [teamMembers.id], name: "pege_prev_coord_fk" }),
    foreignKey({ columns: [table.nextCoordinatorId], foreignColumns: [teamMembers.id], name: "pege_next_coord_fk" }),
    foreignKey({ columns: [table.previousSubstituteId], foreignColumns: [teamMembers.id], name: "pege_prev_sub_fk" }),
    foreignKey({ columns: [table.nextSubstituteId], foreignColumns: [teamMembers.id], name: "pege_next_sub_fk" }),
    foreignKey({ columns: [table.assignedBy], foreignColumns: [users.id], name: "pege_actor_fk" }),
    index("project_editorial_governance_events_created_idx").on(table.createdAt),
  ]
);

export const teamGroupMemberships = pgTable(
  "team_group_memberships",
  {
    id: serial("id").primaryKey(),
    groupId: integer("groupId").notNull().references(() => teamGroups.id),
    teamMemberId: integer("teamMemberId").notNull().references(() => teamMembers.id),
    membershipSource: varchar("membershipSource", { length: 64 }).notNull(),
    sourceDocument: varchar("sourceDocument", { length: 320 }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("team_group_memberships_group_idx").on(table.groupId),
    index("team_group_memberships_member_idx").on(table.teamMemberId),
    uniqueIndex("team_group_memberships_unique_idx").on(table.groupId, table.teamMemberId),
  ]
);

export const tomeGovernanceAssignments = pgTable(
  "tome_governance_assignments",
  {
    id: serial("id").primaryKey(),
    tome: tomeEnum("tome").notNull(),
    coordinatorId: integer("coordinatorId").references(() => teamMembers.id),
    substituteId: integer("substituteId").references(() => teamMembers.id),
    assignedBy: integer("assignedBy").references(() => users.id),
    assignedAt: bigint("assignedAt", { mode: "number" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("tome_governance_assignments_tome_idx").on(table.tome),
    index("tome_governance_assignments_coordinator_idx").on(table.coordinatorId),
    index("tome_governance_assignments_substitute_idx").on(table.substituteId),
  ]
);

export const tomeGovernanceEvents = pgTable(
  "tome_governance_events",
  {
    id: serial("id").primaryKey(),
    tome: tomeEnum("tome").notNull(),
    previousCoordinatorId: integer("previousCoordinatorId").references(() => teamMembers.id),
    nextCoordinatorId: integer("nextCoordinatorId").references(() => teamMembers.id),
    previousSubstituteId: integer("previousSubstituteId").references(() => teamMembers.id),
    nextSubstituteId: integer("nextSubstituteId").references(() => teamMembers.id),
    justification: text("justification").notNull(),
    assignedBy: integer("assignedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("tome_governance_events_tome_idx").on(table.tome, table.createdAt),
  ]
);

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    planCode: varchar("planCode", { length: 8 }),
    planSortOrder: integer("planSortOrder"),
    parentActivityId: integer("parentActivityId"),
    detailCode: varchar("detailCode", { length: 24 }),
    detailSortOrder: integer("detailSortOrder"),
    title: varchar("title", { length: 1000 }).notNull(),
    description: text("description").notNull(),
    planningSummary: text("planningSummary"),
    planningResponsible: varchar("planningResponsible", { length: 16 }),
    planningSupport: text("planningSupport"),
    portalDeliverable: text("portalDeliverable"),
    dependencies: text("dependencies"),
    keywords: text("keywords"),
    planningStatus: varchar("planningStatus", { length: 40 }),
    contentType: varchar("contentType", { length: 160 }),
    visibility: varchar("visibility", { length: 160 }),
    acceptanceCriteria: text("acceptanceCriteria"),
    sourceBase: varchar("sourceBase", { length: 320 }),
    structureStatus: structureStatusEnum("structureStatus").default("canonica").notNull(),
    sectionId: integer("sectionId").notNull().references(() => studySections.id),
    responsibleId: integer("responsibleId").notNull().references(() => teamMembers.id),
    startAt: bigint("startAt", { mode: "number" }),
    dueAt: bigint("dueAt", { mode: "number" }).notNull(),
    editorialDeliveryAt: bigint("editorialDeliveryAt", { mode: "number" }),
    bndesDeliveryAt: bigint("bndesDeliveryAt", { mode: "number" }),
    documentStatus: documentStatusEnum("documentStatus").default("planejada").notNull(),
    status: activityStatusEnum("status").default("pendente").notNull(),
    progress: integer("progress").default(0).notNull(),
    createdBy: integer("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.parentActivityId],
      foreignColumns: [table.id],
      name: "activities_parentActivityId_activities_id_fk",
    }),
    uniqueIndex("activities_plan_code_idx").on(table.planCode),
    index("activities_plan_order_idx").on(table.planSortOrder),
    index("activities_parent_activity_idx").on(table.parentActivityId),
    uniqueIndex("activities_detail_code_idx").on(table.detailCode),
    index("activities_detail_order_idx").on(table.parentActivityId, table.detailSortOrder),
    index("activities_section_idx").on(table.sectionId),
    index("activities_responsible_idx").on(table.responsibleId),
    index("activities_start_idx").on(table.startAt),
    index("activities_due_idx").on(table.dueAt),
    index("activities_editorial_delivery_idx").on(table.editorialDeliveryAt),
    index("activities_document_status_idx").on(table.documentStatus),
    index("activities_status_idx").on(table.status),
    index("activities_structure_status_idx").on(table.structureStatus),
  ]
);

export const activityDocumentWorkflowEvents = pgTable(
  "activity_document_workflow_events",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull(),
    previousStatus: documentStatusEnum("previousStatus"),
    nextStatus: documentStatusEnum("nextStatus").notNull(),
    actorId: integer("actorId").notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    foreignKey({ columns: [table.activityId], foreignColumns: [activities.id], name: "adwe_activity_fk" }),
    foreignKey({ columns: [table.actorId], foreignColumns: [users.id], name: "adwe_actor_fk" }),
    index("activity_document_workflow_events_activity_idx").on(table.activityId, table.createdAt),
  ]
);

export const activityStructureReconciliations = pgTable(
  "activity_structure_reconciliations",
  {
    id: serial("id").primaryKey(),
    supersededActivityId: integer("supersededActivityId").notNull(),
    canonicalActivityId: integer("canonicalActivityId"),
    action: reconciliationActionEnum("action").notNull(),
    sourceReference: varchar("sourceReference", { length: 320 }).notNull(),
    snapshot: text("snapshot").notNull(),
    reason: text("reason").notNull(),
    performedAt: bigint("performedAt", { mode: "number" }).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.supersededActivityId],
      foreignColumns: [activities.id],
      name: "asr_superseded_activity_fk",
    }),
    foreignKey({
      columns: [table.canonicalActivityId],
      foreignColumns: [activities.id],
      name: "asr_canonical_activity_fk",
    }),
    uniqueIndex("activity_structure_reconciliation_superseded_idx").on(table.supersededActivityId),
    index("activity_structure_reconciliation_canonical_idx").on(table.canonicalActivityId),
  ]
);

export const activityMilestones = pgTable(
  "activity_milestones",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description"),
    dueAt: bigint("dueAt", { mode: "number" }).notNull(),
    status: milestoneStatusEnum("status").default("planejado").notNull(),
    sortOrder: integer("sortOrder").default(0).notNull(),
    createdBy: integer("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("activity_milestones_activity_idx").on(table.activityId),
    index("activity_milestones_due_idx").on(table.dueAt),
    uniqueIndex("activity_milestones_unique_title_idx").on(table.activityId, table.title),
  ]
);

export const fieldworkActivities = pgTable(
  "fieldwork_activities",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    description: text("description").notNull(),
    category: fieldworkCategoryEnum("category").notNull(),
    country: varchar("country", { length: 96 }),
    location: varchar("location", { length: 180 }),
    relatedActivityId: integer("relatedActivityId").references(() => activities.id),
    responsibleId: integer("responsibleId").references(() => teamMembers.id),
    groupId: integer("groupId").references(() => teamGroups.id),
    startAt: bigint("startAt", { mode: "number" }),
    dueAt: bigint("dueAt", { mode: "number" }),
    status: activityStatusEnum("status").default("pendente").notNull(),
    createdBy: integer("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("fieldwork_activities_code_idx").on(table.code),
    index("fieldwork_activities_related_activity_idx").on(table.relatedActivityId),
    index("fieldwork_activities_group_idx").on(table.groupId),
    index("fieldwork_activities_due_idx").on(table.dueAt),
  ]
);

export const activityAllocations = pgTable(
  "activity_allocations",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    teamMemberId: integer("teamMemberId").notNull().references(() => teamMembers.id),
    allocatedHours: doublePrecision("allocatedHours").notNull(),
    responsibility: text("responsibility"),
    isExecutionLead: boolean("isExecutionLead").default(false).notNull(),
    assignedBy: integer("assignedBy").references(() => users.id),
    allocationType: allocationTypeEnum("allocationType").default("vigente").notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("activity_allocations_activity_idx").on(table.activityId),
    index("activity_allocations_member_idx").on(table.teamMemberId),
    index("activity_allocations_execution_lead_idx").on(
      table.activityId,
      table.allocationType,
      table.isExecutionLead
    ),
    uniqueIndex("activity_allocations_unique_idx").on(table.activityId, table.teamMemberId),
  ]
);

export const activityLeadershipEvents = pgTable(
  "activity_leadership_events",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    previousTeamMemberId: integer("previousTeamMemberId").references(() => teamMembers.id),
    nextTeamMemberId: integer("nextTeamMemberId").notNull().references(() => teamMembers.id),
    justification: text("justification").notNull(),
    assignedBy: integer("assignedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("activity_leadership_events_activity_idx").on(table.activityId),
    index("activity_leadership_events_created_idx").on(table.createdAt),
  ]
);

export const activityEvidenceLinks = pgTable(
  "activity_evidence_links",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    label: varchar("label", { length: 240 }).notNull(),
    url: text("url").notNull(),
    linkType: evidenceLinkTypeEnum("linkType").default("material").notNull(),
    createdBy: integer("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("activity_evidence_links_activity_idx").on(table.activityId),
  ]
);

export const activityReviewers = pgTable(
  "activity_reviewers",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    teamMemberId: integer("teamMemberId").notNull().references(() => teamMembers.id),
    assignedBy: integer("assignedBy").notNull().references(() => users.id),
    status: reviewerStatusEnum("status").default("pendente").notNull(),
    decisionNote: text("decisionNote"),
    decidedAt: bigint("decidedAt", { mode: "number" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("activity_reviewers_activity_idx").on(table.activityId),
    index("activity_reviewers_member_idx").on(table.teamMemberId),
    index("activity_reviewers_status_idx").on(table.status),
    uniqueIndex("activity_reviewers_unique_idx").on(table.activityId, table.teamMemberId),
  ]
);

export const reviewChecklistItems = pgTable(
  "review_checklist_items",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    scope: checklistScopeEnum("scope").notNull(),
    itemKey: varchar("itemKey", { length: 80 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    responsibleId: integer("responsibleId").references(() => teamMembers.id),
    dueAt: bigint("dueAt", { mode: "number" }),
    status: checklistStatusEnum("status").default("pendente").notNull(),
    completedAt: bigint("completedAt", { mode: "number" }),
    completedBy: integer("completedBy").references(() => users.id),
    createdBy: integer("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("review_checklist_items_activity_idx").on(table.activityId, table.scope, table.status),
    index("review_checklist_items_responsible_idx").on(table.responsibleId),
    uniqueIndex("review_checklist_items_unique_idx").on(table.activityId, table.itemKey),
  ]
);

export const reviewChecklistEvents = pgTable(
  "review_checklist_events",
  {
    id: serial("id").primaryKey(),
    checklistItemId: integer("checklistItemId").notNull(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    eventType: checklistEventTypeEnum("eventType").notNull(),
    summary: text("summary").notNull(),
    actorId: integer("actorId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.checklistItemId],
      foreignColumns: [reviewChecklistItems.id],
      name: "rce_item_fk",
    }),
    index("review_checklist_events_item_idx").on(table.checklistItemId, table.createdAt),
    index("review_checklist_events_activity_idx").on(table.activityId, table.createdAt),
  ]
);

export const libraryItems = pgTable(
  "library_items",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 320 }).notNull(),
    description: text("description"),
    theme: varchar("theme", { length: 180 }),
    sectionId: integer("sectionId").references(() => studySections.id),
    itemType: libraryItemTypeEnum("itemType").notNull(),
    externalUrl: text("externalUrl"),
    fileName: varchar("fileName", { length: 320 }),
    mimeType: varchar("mimeType", { length: 160 }),
    fileSize: integer("fileSize"),
    storageKey: text("storageKey"),
    storageUrl: text("storageUrl"),
    uploadedBy: integer("uploadedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("library_items_section_idx").on(table.sectionId),
    index("library_items_type_idx").on(table.itemType),
  ]
);

export const productionMaterials = pgTable(
  "production_materials",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 320 }).notNull(),
    description: text("description"),
    activityId: integer("activityId").references(() => activities.id),
    sectionId: integer("sectionId").notNull().references(() => studySections.id),
    reviewStatus: materialReviewStatusEnum("reviewStatus").default("em elaboração").notNull(),
    currentRevision: integer("currentRevision").default(1).notNull(),
    createdBy: integer("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("production_materials_activity_idx").on(table.activityId),
    index("production_materials_section_idx").on(table.sectionId),
    index("production_materials_status_idx").on(table.reviewStatus),
  ]
);

export const materialRevisions = pgTable(
  "material_revisions",
  {
    id: serial("id").primaryKey(),
    materialId: integer("materialId").notNull().references(() => productionMaterials.id),
    revisionNumber: integer("revisionNumber").notNull(),
    notes: text("notes"),
    fileName: varchar("fileName", { length: 320 }).notNull(),
    mimeType: varchar("mimeType", { length: 160 }).notNull(),
    fileSize: integer("fileSize").notNull(),
    storageKey: text("storageKey").notNull(),
    storageUrl: text("storageUrl").notNull(),
    uploadedBy: integer("uploadedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("material_revisions_material_idx").on(table.materialId),
    uniqueIndex("material_revisions_unique_idx").on(table.materialId, table.revisionNumber),
  ]
);

export const reviewSubmissions = pgTable(
  "review_submissions",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    materialId: integer("materialId").notNull().references(() => productionMaterials.id),
    revisionId: integer("revisionId").notNull().references(() => materialRevisions.id),
    submittedBy: integer("submittedBy").notNull().references(() => users.id),
    status: reviewSubmissionStatusEnum("status").default("em revisão").notNull(),
    message: text("message"),
    submittedAt: bigint("submittedAt", { mode: "number" }).notNull(),
    completedAt: bigint("completedAt", { mode: "number" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("review_submissions_activity_idx").on(table.activityId),
    index("review_submissions_material_idx").on(table.materialId),
    index("review_submissions_revision_idx").on(table.revisionId),
    index("review_submissions_status_idx").on(table.status),
  ]
);

export const reviewDecisions = pgTable(
  "review_decisions",
  {
    id: serial("id").primaryKey(),
    submissionId: integer("submissionId").notNull().references(() => reviewSubmissions.id),
    reviewerId: integer("reviewerId").notNull().references(() => teamMembers.id),
    decision: reviewDecisionEnum("decision").notNull(),
    note: text("note"),
    decidedAt: bigint("decidedAt", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("review_decisions_submission_idx").on(table.submissionId),
    index("review_decisions_reviewer_idx").on(table.reviewerId),
    uniqueIndex("review_decisions_unique_idx").on(table.submissionId, table.reviewerId),
  ]
);

export const materialComments = pgTable(
  "material_comments",
  {
    id: serial("id").primaryKey(),
    materialId: integer("materialId").notNull().references(() => productionMaterials.id),
    revisionId: integer("revisionId").references(() => materialRevisions.id),
    submissionId: integer("submissionId").references(() => reviewSubmissions.id),
    authorId: integer("authorId").notNull().references(() => users.id),
    content: text("content").notNull(),
    commentType: materialCommentTypeEnum("commentType").default("comentário").notNull(),
    resolvedAt: bigint("resolvedAt", { mode: "number" }),
    resolvedBy: integer("resolvedBy").references(() => users.id),
    status: materialCommentStatusEnum("status").default("aberto").notNull(),
    implementationNote: text("implementationNote"),
    implementedAt: bigint("implementedAt", { mode: "number" }),
    implementedBy: integer("implementedBy").references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("material_comments_material_idx").on(table.materialId),
    index("material_comments_revision_idx").on(table.revisionId),
    index("material_comments_submission_idx").on(table.submissionId),
  ]
);

export const coordinationInterfaces = pgTable(
  "coordination_interfaces",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 320 }).notNull(),
    description: text("description").notNull(),
    interfaceType: interfaceTypeEnum("interfaceType").notNull(),
    responsibleId: integer("responsibleId").notNull().references(() => teamMembers.id),
    priority: interfacePriorityEnum("priority").default("média").notNull(),
    blockingClass: blockingClassEnum("blockingClass").default("não prioritária").notNull(),
    status: interfaceStatusEnum("status").default("identificada").notNull(),
    dueAt: bigint("dueAt", { mode: "number" }),
    resolution: text("resolution"),
    createdBy: integer("createdBy").notNull().references(() => users.id),
    resolvedAt: bigint("resolvedAt", { mode: "number" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("coordination_interfaces_responsible_idx").on(table.responsibleId),
    index("coordination_interfaces_status_idx").on(table.status),
    index("coordination_interfaces_priority_idx").on(table.priority),
    index("coordination_interfaces_blocking_class_idx").on(table.blockingClass),
    index("coordination_interfaces_due_idx").on(table.dueAt),
  ]
);

export const interfaceSections = pgTable(
  "interface_sections",
  {
    id: serial("id").primaryKey(),
    interfaceId: integer("interfaceId").notNull().references(() => coordinationInterfaces.id),
    sectionId: integer("sectionId").notNull().references(() => studySections.id),
    role: interfaceSectionRoleEnum("role").default("relacionada").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("interface_sections_interface_idx").on(table.interfaceId),
    index("interface_sections_section_idx").on(table.sectionId),
    uniqueIndex("interface_sections_unique_idx").on(table.interfaceId, table.sectionId),
  ]
);

export const interfaceActivities = pgTable(
  "interface_activities",
  {
    id: serial("id").primaryKey(),
    interfaceId: integer("interfaceId").notNull().references(() => coordinationInterfaces.id),
    activityId: integer("activityId").notNull().references(() => activities.id),
    role: interfaceSectionRoleEnum("role").default("relacionada").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("interface_activities_interface_idx").on(table.interfaceId),
    index("interface_activities_activity_idx").on(table.activityId),
    uniqueIndex("interface_activities_unique_idx").on(table.interfaceId, table.activityId),
  ]
);

export const interfaceGroups = pgTable(
  "interface_groups",
  {
    id: serial("id").primaryKey(),
    interfaceId: integer("interfaceId").notNull().references(() => coordinationInterfaces.id),
    groupId: integer("groupId").notNull().references(() => teamGroups.id),
    role: interfaceGroupRoleEnum("role").default("envolvido").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("interface_groups_interface_idx").on(table.interfaceId),
    index("interface_groups_group_idx").on(table.groupId),
    uniqueIndex("interface_groups_unique_idx").on(table.interfaceId, table.groupId),
  ]
);

export const interfaceComments = pgTable(
  "interface_comments",
  {
    id: serial("id").primaryKey(),
    interfaceId: integer("interfaceId").notNull().references(() => coordinationInterfaces.id),
    authorId: integer("authorId").notNull().references(() => users.id),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("interface_comments_interface_idx").on(table.interfaceId),
  ]
);

export const interfaceEvidenceFiles = pgTable(
  "interface_evidence_files",
  {
    id: serial("id").primaryKey(),
    interfaceId: integer("interfaceId").notNull().references(() => coordinationInterfaces.id),
    activityId: integer("activityId").references(() => activities.id),
    fileName: varchar("fileName", { length: 320 }).notNull(),
    mimeType: varchar("mimeType", { length: 160 }).notNull(),
    fileSize: integer("fileSize").notNull(),
    storageKey: text("storageKey").notNull(),
    storageUrl: text("storageUrl").notNull(),
    uploadedBy: integer("uploadedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("interface_evidence_files_interface_idx").on(table.interfaceId),
    index("interface_evidence_files_activity_idx").on(table.activityId),
  ]
);

export const interfaceAiAnalyses = pgTable(
  "interface_ai_analyses",
  {
    id: serial("id").primaryKey(),
    interfaceId: integer("interfaceId").notNull().references(() => coordinationInterfaces.id),
    model: varchar("model", { length: 120 }).notNull(),
    status: interfaceAiStatusEnum("status").notNull(),
    resultJson: text("resultJson"),
    errorMessage: text("errorMessage"),
    requestedBy: integer("requestedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("interface_ai_analyses_interface_idx").on(table.interfaceId),
  ]
);

export const interfaceEvents = pgTable(
  "interface_events",
  {
    id: serial("id").primaryKey(),
    interfaceId: integer("interfaceId").notNull().references(() => coordinationInterfaces.id),
    actorId: integer("actorId").notNull().references(() => users.id),
    eventType: interfaceEventTypeEnum("eventType").notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("interface_events_interface_idx").on(table.interfaceId),
  ]
);

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activityId").notNull().references(() => activities.id),
    teamMemberId: integer("teamMemberId").notNull().references(() => teamMembers.id),
    event: notificationLogEventEnum("event").notNull(),
    status: notificationLogStatusEnum("status").default("pendente").notNull(),
    recipientPhone: varchar("recipientPhone", { length: 32 }),
    idempotencyKey: varchar("idempotencyKey", { length: 190 }).notNull(),
    providerMessageId: varchar("providerMessageId", { length: 255 }),
    errorMessage: text("errorMessage"),
    attempts: integer("attempts").default(0).notNull(),
    nextAttemptAt: bigint("nextAttemptAt", { mode: "number" }),
    lastAttemptAt: bigint("lastAttemptAt", { mode: "number" }),
    sentAt: bigint("sentAt", { mode: "number" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("notification_logs_activity_idx").on(table.activityId),
    index("notification_logs_event_idx").on(table.event),
    index("notification_logs_queue_idx").on(table.status, table.nextAttemptAt),
    uniqueIndex("notification_logs_idempotency_idx").on(table.idempotencyKey),
  ]
);

export const scopeMigrationHistory = pgTable(
  "scope_migration_history",
  {
    id: serial("id").primaryKey(),
    migrationKey: varchar("migrationKey", { length: 96 }).notNull(),
    entityType: varchar("entityType", { length: 64 }).notNull(),
    entityId: integer("entityId").notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    snapshot: text("snapshot").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("scope_migration_history_migration_idx").on(table.migrationKey),
    index("scope_migration_history_entity_idx").on(table.entityType, table.entityId),
    uniqueIndex("scope_migration_history_unique_idx").on(
      table.migrationKey,
      table.entityType,
      table.entityId
    ),
  ]
);

export const participantNotifications = pgTable(
  "participant_notifications",
  {
    id: serial("id").primaryKey(),
    recipientUserId: integer("recipientUserId").notNull(),
    recipientMemberId: integer("recipientMemberId"),
    actorUserId: integer("actorUserId"),
    activityId: integer("activityId"),
    materialId: integer("materialId"),
    type: varchar("type", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    actionUrl: varchar("actionUrl", { length: 255 }),
    read: boolean("read").default(false).notNull(),
    readAt: bigint("readAt", { mode: "number" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  table => [
    index("participant_notifications_recipientUser_idx").on(table.recipientUserId),
    index("participant_notifications_read_idx").on(table.read),
    index("participant_notifications_activity_idx").on(table.activityId),
  ]
);

// ==========================================
// Inferred Types
// ==========================================
export type ProjectSettings = typeof projectSettings.$inferSelect;
export type StudySection = typeof studySections.$inferSelect;
export type TeamGroup = typeof teamGroups.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type TeamGroupMembership = typeof teamGroupMemberships.$inferSelect;
export type ProjectGovernanceDecision = typeof projectGovernanceDecisions.$inferSelect;
export type TomeGovernanceAssignment = typeof tomeGovernanceAssignments.$inferSelect;
export type TomeGovernanceEvent = typeof tomeGovernanceEvents.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ActivityMilestone = typeof activityMilestones.$inferSelect;
export type FieldworkActivity = typeof fieldworkActivities.$inferSelect;
export type ActivityAllocation = typeof activityAllocations.$inferSelect;
export type ActivityReviewer = typeof activityReviewers.$inferSelect;
export type ReviewChecklistItem = typeof reviewChecklistItems.$inferSelect;
export type ReviewChecklistEvent = typeof reviewChecklistEvents.$inferSelect;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type ProductionMaterial = typeof productionMaterials.$inferSelect;
export type MaterialRevision = typeof materialRevisions.$inferSelect;
export type ReviewSubmission = typeof reviewSubmissions.$inferSelect;
export type ReviewDecision = typeof reviewDecisions.$inferSelect;
export type MaterialComment = typeof materialComments.$inferSelect;
export type CoordinationInterface = typeof coordinationInterfaces.$inferSelect;
export type InterfaceSection = typeof interfaceSections.$inferSelect;
export type InterfaceActivity = typeof interfaceActivities.$inferSelect;
export type InterfaceGroup = typeof interfaceGroups.$inferSelect;
export type InterfaceComment = typeof interfaceComments.$inferSelect;
export type InterfaceEvent = typeof interfaceEvents.$inferSelect;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type ScopeMigrationHistory = typeof scopeMigrationHistory.$inferSelect;
export type ParticipantNotification = typeof participantNotifications.$inferSelect;
export type NewParticipantNotification = typeof participantNotifications.$inferInsert;
