import {
  bigint,
  boolean,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  appRole: mysqlEnum("appRole", ["administrador", "coordenador", "executor"])
    .default("executor")
    .notNull(),
  accessStatus: mysqlEnum("accessStatus", ["ativo", "revogado"])
    .default("ativo")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Access provisions created by the administrator before a person signs in.
 * The authenticated account is linked by normalized e-mail on first access.
 */
export const userAccessProvisions = mysqlTable(
  "user_access_provisions",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    name: text("name").notNull(),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    appRole: mysqlEnum("appRole", ["administrador", "coordenador", "executor"])
      .default("executor")
      .notNull(),
    status: mysqlEnum("status", ["pendente", "ativado", "revogado"])
      .default("pendente")
      .notNull(),
    userId: int("userId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    activatedAt: timestamp("activatedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("user_access_provisions_email_unique").on(table.email),
    index("user_access_provisions_status_idx").on(table.status),
  ]
);

/** Audit trail for administrative changes to authenticated users and pre-registered access. */
export const userAccessEvents = mysqlTable(
  "user_access_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    provisionId: int("provisionId"),
    actorUserId: int("actorUserId").notNull(),
    eventType: mysqlEnum("eventType", [
      "perfil_alterado",
      "acesso_revogado",
      "acesso_reativado",
      "pre_cadastro_atualizado",
      "convite_enviado",
    ]).notNull(),
    previousAppRole: mysqlEnum("previousAppRole", ["administrador", "coordenador", "executor"]),
    nextAppRole: mysqlEnum("nextAppRole", ["administrador", "coordenador", "executor"]),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("user_access_events_user_idx").on(table.userId),
    index("user_access_events_provision_idx").on(table.provisionId),
    index("user_access_events_created_idx").on(table.createdAt),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projectSettings = mysqlTable(
  "project_settings",
  {
    id: int("id").autoincrement().primaryKey(),
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    cronTaskIdx: index("project_settings_cron_task_idx").on(
      table.scheduleCronTaskUid
    ),
  })
);

/** Decisões imutáveis de governança, iniciadas pela autorização de implementação do pacote P0. */
export const projectGovernanceDecisions = mysqlTable(
  "project_governance_decisions",
  {
    id: int("id").autoincrement().primaryKey(),
    decisionType: mysqlEnum("decisionType", ["implementacao_p0"]).notNull(),
    decision: mysqlEnum("decision", ["aprovada"]).notNull(),
    note: text("note"),
    decidedBy: int("decidedBy").notNull().references(() => users.id),
    decidedAt: bigint("decidedAt", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    decisionTypeIdx: index("project_governance_decisions_type_idx").on(
      table.decisionType,
      table.decidedAt
    ),
  })
);

/** Coordenação editorial do projeto, distinta das designações dos tomos. */
export const projectEditorialGovernance = mysqlTable(
  "project_editorial_governance",
  {
    id: int("id").autoincrement().primaryKey(),
    coordinatorId: int("coordinatorId").notNull(),
    substituteId: int("substituteId").notNull(),
    assignedBy: int("assignedBy").notNull(),
    assignedAt: bigint("assignedAt", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    coordinatorFk: foreignKey({ columns: [table.coordinatorId], foreignColumns: [teamMembers.id], name: "peg_coord_fk" }),
    substituteFk: foreignKey({ columns: [table.substituteId], foreignColumns: [teamMembers.id], name: "peg_sub_fk" }),
    assignedByFk: foreignKey({ columns: [table.assignedBy], foreignColumns: [users.id], name: "peg_actor_fk" }),
    coordinatorIdx: index("project_editorial_governance_coordinator_idx").on(table.coordinatorId),
    substituteIdx: index("project_editorial_governance_substitute_idx").on(table.substituteId),
  })
);

/** Histórico imutável das designações da coordenação editorial do projeto. */
export const projectEditorialGovernanceEvents = mysqlTable(
  "project_editorial_governance_events",
  {
    id: int("id").autoincrement().primaryKey(),
    previousCoordinatorId: int("previousCoordinatorId"),
    nextCoordinatorId: int("nextCoordinatorId").notNull(),
    previousSubstituteId: int("previousSubstituteId"),
    nextSubstituteId: int("nextSubstituteId").notNull(),
    justification: text("justification").notNull(),
    assignedBy: int("assignedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    previousCoordinatorFk: foreignKey({ columns: [table.previousCoordinatorId], foreignColumns: [teamMembers.id], name: "pege_prev_coord_fk" }),
    nextCoordinatorFk: foreignKey({ columns: [table.nextCoordinatorId], foreignColumns: [teamMembers.id], name: "pege_next_coord_fk" }),
    previousSubstituteFk: foreignKey({ columns: [table.previousSubstituteId], foreignColumns: [teamMembers.id], name: "pege_prev_sub_fk" }),
    nextSubstituteFk: foreignKey({ columns: [table.nextSubstituteId], foreignColumns: [teamMembers.id], name: "pege_next_sub_fk" }),
    assignedByFk: foreignKey({ columns: [table.assignedBy], foreignColumns: [users.id], name: "pege_actor_fk" }),
    createdIdx: index("project_editorial_governance_events_created_idx").on(table.createdAt),
  })
);

export const studySections = mysqlTable(
  "study_sections",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 8 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    officialDescription: text("officialDescription").notNull(),
    sortOrder: int("sortOrder").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    codeIdx: uniqueIndex("study_sections_code_idx").on(table.code),
    orderIdx: index("study_sections_order_idx").on(table.sortOrder),
  })
);

export const teamGroups = mysqlTable(
  "team_groups",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    institution: varchar("institution", { length: 160 }).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    nameIdx: uniqueIndex("team_groups_name_idx").on(table.name),
    institutionIdx: index("team_groups_institution_idx").on(table.institution),
  })
);

export const teamMembers = mysqlTable(
  "team_members",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").references(() => users.id),
    groupId: int("groupId").references(() => teamGroups.id),
    groupRole: mysqlEnum("groupRole", ["coordenador", "participante"])
      .default("participante")
      .notNull(),
    name: varchar("name", { length: 220 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    institution: varchar("institution", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }),
    whatsappPhone: varchar("whatsappPhone", { length: 32 }),
    whatsappOptIn: boolean("whatsappOptIn").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdx: index("team_members_user_idx").on(table.userId),
    groupIdx: index("team_members_group_idx").on(table.groupId),
    groupRoleIdx: index("team_members_group_role_idx").on(
      table.groupId,
      table.groupRole
    ),
    nameIdx: index("team_members_name_idx").on(table.name),
  })
);

/** Participação temática por grupo, sem substituir o vínculo primário operacional do integrante. */
export const teamGroupMemberships = mysqlTable(
  "team_group_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("groupId").notNull().references(() => teamGroups.id),
    teamMemberId: int("teamMemberId").notNull().references(() => teamMembers.id),
    membershipSource: varchar("membershipSource", { length: 64 }).notNull(),
    sourceDocument: varchar("sourceDocument", { length: 320 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    groupIdx: index("team_group_memberships_group_idx").on(table.groupId),
    memberIdx: index("team_group_memberships_member_idx").on(table.teamMemberId),
    uniqueMembershipIdx: uniqueIndex("team_group_memberships_unique_idx").on(table.groupId, table.teamMemberId),
  })
);

/** Coordenação formal e substituição autorizada para cada tomo editorial. */
export const tomeGovernanceAssignments = mysqlTable(
  "tome_governance_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    tome: mysqlEnum("tome", ["Apresentação", "Tomo I", "Tomo II", "Tomo III", "Tomo IV"]).notNull(),
    coordinatorId: int("coordinatorId").references(() => teamMembers.id),
    substituteId: int("substituteId").references(() => teamMembers.id),
    assignedBy: int("assignedBy").references(() => users.id),
    assignedAt: bigint("assignedAt", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    tomeIdx: uniqueIndex("tome_governance_assignments_tome_idx").on(table.tome),
    coordinatorIdx: index("tome_governance_assignments_coordinator_idx").on(table.coordinatorId),
    substituteIdx: index("tome_governance_assignments_substitute_idx").on(table.substituteId),
  })
);

/** Registro imutável das trocas de coordenação e substituição por tomo. */
export const tomeGovernanceEvents = mysqlTable(
  "tome_governance_events",
  {
    id: int("id").autoincrement().primaryKey(),
    tome: mysqlEnum("tome", ["Apresentação", "Tomo I", "Tomo II", "Tomo III", "Tomo IV"]).notNull(),
    previousCoordinatorId: int("previousCoordinatorId").references(() => teamMembers.id),
    nextCoordinatorId: int("nextCoordinatorId").references(() => teamMembers.id),
    previousSubstituteId: int("previousSubstituteId").references(() => teamMembers.id),
    nextSubstituteId: int("nextSubstituteId").references(() => teamMembers.id),
    justification: text("justification").notNull(),
    assignedBy: int("assignedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    tomeIdx: index("tome_governance_events_tome_idx").on(table.tome, table.createdAt),
  })
);

export const activities = mysqlTable(
  "activities",
  {
    id: int("id").autoincrement().primaryKey(),
    planCode: varchar("planCode", { length: 8 }),
    planSortOrder: int("planSortOrder"),
    parentActivityId: int("parentActivityId"),
    detailCode: varchar("detailCode", { length: 24 }),
    detailSortOrder: int("detailSortOrder"),
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
    structureStatus: mysqlEnum("structureStatus", ["canonica", "arquivada"])
      .default("canonica")
      .notNull(),
    sectionId: int("sectionId")
      .notNull()
      .references(() => studySections.id),
    responsibleId: int("responsibleId")
      .notNull()
      .references(() => teamMembers.id),
    startAt: bigint("startAt", { mode: "number" }),
    dueAt: bigint("dueAt", { mode: "number" }).notNull(),
    /** Entrega interna para recebimento técnico, consolidação e editoração. */
    editorialDeliveryAt: bigint("editorialDeliveryAt", { mode: "number" }),
    /** Entrega contratual ao BNDES, posterior à janela de consolidação editorial. */
    bndesDeliveryAt: bigint("bndesDeliveryAt", { mode: "number" }),
    documentStatus: mysqlEnum("documentStatus", [
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
    ]).default("planejada").notNull(),
    status: mysqlEnum("status", [
      "pendente",
      "em andamento",
      "concluído",
      "atrasado",
    ])
      .default("pendente")
      .notNull(),
    progress: int("progress").default(0).notNull(),
    createdBy: int("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    parentActivityFk: foreignKey({
      columns: [table.parentActivityId],
      foreignColumns: [table.id],
      name: "activities_parentActivityId_activities_id_fk",
    }),
    planCodeIdx: uniqueIndex("activities_plan_code_idx").on(table.planCode),
    planOrderIdx: index("activities_plan_order_idx").on(table.planSortOrder),
    parentActivityIdx: index("activities_parent_activity_idx").on(
      table.parentActivityId
    ),
    detailCodeIdx: uniqueIndex("activities_detail_code_idx").on(table.detailCode),
    detailOrderIdx: index("activities_detail_order_idx").on(
      table.parentActivityId,
      table.detailSortOrder
    ),
    sectionIdx: index("activities_section_idx").on(table.sectionId),
    responsibleIdx: index("activities_responsible_idx").on(
      table.responsibleId
    ),
    startIdx: index("activities_start_idx").on(table.startAt),
    dueIdx: index("activities_due_idx").on(table.dueAt),
    editorialDeliveryIdx: index("activities_editorial_delivery_idx").on(table.editorialDeliveryAt),
    documentStatusIdx: index("activities_document_status_idx").on(table.documentStatus),
    statusIdx: index("activities_status_idx").on(table.status),
    structureStatusIdx: index("activities_structure_status_idx").on(table.structureStatus),
  })
);

/** Histórico imutável das transições humanas do fluxo documental de seções e capítulos. */
export const activityDocumentWorkflowEvents = mysqlTable(
  "activity_document_workflow_events",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId").notNull(),
    previousStatus: mysqlEnum("previousStatus", [
      "planejada", "em elaboração", "submetida à revisão da seção", "em revisão da seção", "ajustes solicitados", "revisada pela seção", "consolidada no capítulo", "em revisão do tomo", "aprovada no tomo", "em revisão do projeto", "aprovada para documentação final",
    ]),
    nextStatus: mysqlEnum("nextStatus", [
      "planejada", "em elaboração", "submetida à revisão da seção", "em revisão da seção", "ajustes solicitados", "revisada pela seção", "consolidada no capítulo", "em revisão do tomo", "aprovada no tomo", "em revisão do projeto", "aprovada para documentação final",
    ]).notNull(),
    actorId: int("actorId").notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    activityFk: foreignKey({ columns: [table.activityId], foreignColumns: [activities.id], name: "adwe_activity_fk" }),
    actorFk: foreignKey({ columns: [table.actorId], foreignColumns: [users.id], name: "adwe_actor_fk" }),
    activityIdx: index("activity_document_workflow_events_activity_idx").on(table.activityId, table.createdAt),
  })
);

/** Registro auditável de itens consolidados ou retirados da estrutura ativa pelo índice analítico oficial. */
export const activityStructureReconciliations = mysqlTable(
  "activity_structure_reconciliations",
  {
    id: int("id").autoincrement().primaryKey(),
    supersededActivityId: int("supersededActivityId").notNull(),
    canonicalActivityId: int("canonicalActivityId"),
    action: mysqlEnum("action", ["consolidada", "arquivada"])
      .notNull(),
    sourceReference: varchar("sourceReference", { length: 320 }).notNull(),
    snapshot: text("snapshot").notNull(),
    reason: text("reason").notNull(),
    performedAt: bigint("performedAt", { mode: "number" }).notNull(),
  },
  table => ({
    supersededFk: foreignKey({
      columns: [table.supersededActivityId],
      foreignColumns: [activities.id],
      name: "asr_superseded_activity_fk",
    }),
    canonicalFk: foreignKey({
      columns: [table.canonicalActivityId],
      foreignColumns: [activities.id],
      name: "asr_canonical_activity_fk",
    }),
    supersededIdx: uniqueIndex("activity_structure_reconciliation_superseded_idx").on(
      table.supersededActivityId
    ),
    canonicalIdx: index("activity_structure_reconciliation_canonical_idx").on(
      table.canonicalActivityId
    ),
  })
);

export const activityMilestones = mysqlTable(
  "activity_milestones",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId")
      .notNull()
      .references(() => activities.id),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description"),
    dueAt: bigint("dueAt", { mode: "number" }).notNull(),
    status: mysqlEnum("status", ["planejado", "concluído"])
      .default("planejado")
      .notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdBy: int("createdBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activityIdx: index("activity_milestones_activity_idx").on(table.activityId),
    dueIdx: index("activity_milestones_due_idx").on(table.dueAt),
    uniqueTitleIdx: uniqueIndex("activity_milestones_unique_title_idx").on(
      table.activityId,
      table.title
    ),
  })
);

export const fieldworkActivities = mysqlTable(
  "fieldwork_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    description: text("description").notNull(),
    category: mysqlEnum("category", [
      "visita a estaleiro",
      "coleta de fonte primária",
      "entrevista estruturada",
      "apresentação de relatório",
      "apresentação para equipe",
      "audiência pública",
    ]).notNull(),
    country: varchar("country", { length: 96 }),
    location: varchar("location", { length: 180 }),
    relatedActivityId: int("relatedActivityId").references(() => activities.id),
    responsibleId: int("responsibleId").references(() => teamMembers.id),
    groupId: int("groupId").references(() => teamGroups.id),
    startAt: bigint("startAt", { mode: "number" }),
    dueAt: bigint("dueAt", { mode: "number" }),
    status: mysqlEnum("status", [
      "pendente",
      "em andamento",
      "concluído",
      "atrasado",
    ])
      .default("pendente")
      .notNull(),
    createdBy: int("createdBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    codeIdx: uniqueIndex("fieldwork_activities_code_idx").on(table.code),
    relatedActivityIdx: index("fieldwork_activities_related_activity_idx").on(
      table.relatedActivityId
    ),
    groupIdx: index("fieldwork_activities_group_idx").on(table.groupId),
    dueIdx: index("fieldwork_activities_due_idx").on(table.dueAt),
  })
);

export const activityAllocations = mysqlTable(
  "activity_allocations",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId")
      .notNull()
      .references(() => activities.id),
    teamMemberId: int("teamMemberId")
      .notNull()
      .references(() => teamMembers.id),
    allocatedHours: decimal("allocatedHours", {
      precision: 8,
      scale: 2,
      mode: "number",
    }).notNull(),
    responsibility: text("responsibility"),
    isExecutionLead: boolean("isExecutionLead").default(false).notNull(),
    assignedBy: int("assignedBy").references(() => users.id),
    allocationType: mysqlEnum("allocationType", ["vigente", "histórica"])
      .default("vigente")
      .notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activityIdx: index("activity_allocations_activity_idx").on(table.activityId),
    memberIdx: index("activity_allocations_member_idx").on(table.teamMemberId),
    executionLeadIdx: index("activity_allocations_execution_lead_idx").on(
      table.activityId,
      table.allocationType,
      table.isExecutionLead
    ),
    activityMemberIdx: uniqueIndex("activity_allocations_unique_idx").on(
      table.activityId,
      table.teamMemberId
    ),
  })
);

export const activityLeadershipEvents = mysqlTable(
  "activity_leadership_events",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId").notNull().references(() => activities.id),
    previousTeamMemberId: int("previousTeamMemberId").references(() => teamMembers.id),
    nextTeamMemberId: int("nextTeamMemberId").notNull().references(() => teamMembers.id),
    justification: text("justification").notNull(),
    assignedBy: int("assignedBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    activityIdx: index("activity_leadership_events_activity_idx").on(table.activityId),
    createdIdx: index("activity_leadership_events_created_idx").on(table.createdAt),
  })
);

export const activityEvidenceLinks = mysqlTable(
  "activity_evidence_links",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId")
      .notNull()
      .references(() => activities.id),
    label: varchar("label", { length: 240 }).notNull(),
    url: text("url").notNull(),
    linkType: mysqlEnum("linkType", ["material", "evidência de campo"])
      .default("material")
      .notNull(),
    createdBy: int("createdBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activityIdx: index("activity_evidence_links_activity_idx").on(table.activityId),
  })
);

export const activityReviewers = mysqlTable(
  "activity_reviewers",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId")
      .notNull()
      .references(() => activities.id),
    teamMemberId: int("teamMemberId")
      .notNull()
      .references(() => teamMembers.id),
    assignedBy: int("assignedBy")
      .notNull()
      .references(() => users.id),
    status: mysqlEnum("status", [
      "pendente",
      "em revisão",
      "ajustes solicitados",
      "aprovado",
    ])
      .default("pendente")
      .notNull(),
    decisionNote: text("decisionNote"),
    decidedAt: bigint("decidedAt", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activityIdx: index("activity_reviewers_activity_idx").on(table.activityId),
    memberIdx: index("activity_reviewers_member_idx").on(table.teamMemberId),
    statusIdx: index("activity_reviewers_status_idx").on(table.status),
    uniqueReviewerIdx: uniqueIndex("activity_reviewers_unique_idx").on(
      table.activityId,
      table.teamMemberId
    ),
  })
);

/** Itens de checklist do grupo do capítulo durante revisão de seção e capítulo. */
export const reviewChecklistItems = mysqlTable(
  "review_checklist_items",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId").notNull().references(() => activities.id),
    scope: mysqlEnum("scope", ["seção", "capítulo"]).notNull(),
    itemKey: varchar("itemKey", { length: 80 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    responsibleId: int("responsibleId").references(() => teamMembers.id),
    dueAt: bigint("dueAt", { mode: "number" }),
    status: mysqlEnum("status", ["pendente", "em andamento", "concluído", "bloqueado"]).default("pendente").notNull(),
    completedAt: bigint("completedAt", { mode: "number" }),
    completedBy: int("completedBy").references(() => users.id),
    createdBy: int("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activityIdx: index("review_checklist_items_activity_idx").on(table.activityId, table.scope, table.status),
    responsibleIdx: index("review_checklist_items_responsible_idx").on(table.responsibleId),
    uniqueItemIdx: uniqueIndex("review_checklist_items_unique_idx").on(table.activityId, table.itemKey),
  })
);

/** Histórico imutável das alterações no checklist de revisão. */
export const reviewChecklistEvents = mysqlTable(
  "review_checklist_events",
  {
    id: int("id").autoincrement().primaryKey(),
    checklistItemId: int("checklistItemId").notNull(),
    activityId: int("activityId").notNull().references(() => activities.id),
    eventType: mysqlEnum("eventType", ["status_alterado", "responsável_alterado", "prazo_alterado"]).notNull(),
    summary: text("summary").notNull(),
    actorId: int("actorId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    checklistItemFk: foreignKey({
      columns: [table.checklistItemId],
      foreignColumns: [reviewChecklistItems.id],
      name: "rce_item_fk",
    }),
    itemIdx: index("review_checklist_events_item_idx").on(table.checklistItemId, table.createdAt),
    activityIdx: index("review_checklist_events_activity_idx").on(table.activityId, table.createdAt),
  })
);

export const libraryItems = mysqlTable(
  "library_items",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 320 }).notNull(),
    description: text("description"),
    theme: varchar("theme", { length: 180 }),
    sectionId: int("sectionId").references(() => studySections.id),
    itemType: mysqlEnum("itemType", ["arquivo", "link"]).notNull(),
    externalUrl: text("externalUrl"),
    fileName: varchar("fileName", { length: 320 }),
    mimeType: varchar("mimeType", { length: 160 }),
    fileSize: int("fileSize"),
    storageKey: text("storageKey"),
    storageUrl: text("storageUrl"),
    uploadedBy: int("uploadedBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    sectionIdx: index("library_items_section_idx").on(table.sectionId),
    typeIdx: index("library_items_type_idx").on(table.itemType),
  })
);

export const productionMaterials = mysqlTable(
  "production_materials",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 320 }).notNull(),
    description: text("description"),
    activityId: int("activityId").references(() => activities.id),
    sectionId: int("sectionId")
      .notNull()
      .references(() => studySections.id),
    reviewStatus: mysqlEnum("reviewStatus", [
      "em elaboração",
      "em revisão",
      "aprovado",
    ])
      .default("em elaboração")
      .notNull(),
    currentRevision: int("currentRevision").default(1).notNull(),
    createdBy: int("createdBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activityIdx: index("production_materials_activity_idx").on(table.activityId),
    sectionIdx: index("production_materials_section_idx").on(table.sectionId),
    statusIdx: index("production_materials_status_idx").on(
      table.reviewStatus
    ),
  })
);

export const materialRevisions = mysqlTable(
  "material_revisions",
  {
    id: int("id").autoincrement().primaryKey(),
    materialId: int("materialId")
      .notNull()
      .references(() => productionMaterials.id),
    revisionNumber: int("revisionNumber").notNull(),
    notes: text("notes"),
    fileName: varchar("fileName", { length: 320 }).notNull(),
    mimeType: varchar("mimeType", { length: 160 }).notNull(),
    fileSize: int("fileSize").notNull(),
    storageKey: text("storageKey").notNull(),
    storageUrl: text("storageUrl").notNull(),
    uploadedBy: int("uploadedBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    materialIdx: index("material_revisions_material_idx").on(table.materialId),
    materialRevisionIdx: uniqueIndex("material_revisions_unique_idx").on(
      table.materialId,
      table.revisionNumber
    ),
  })
);

export const reviewSubmissions = mysqlTable(
  "review_submissions",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId")
      .notNull()
      .references(() => activities.id),
    materialId: int("materialId")
      .notNull()
      .references(() => productionMaterials.id),
    revisionId: int("revisionId")
      .notNull()
      .references(() => materialRevisions.id),
    submittedBy: int("submittedBy")
      .notNull()
      .references(() => users.id),
    status: mysqlEnum("status", [
      "em revisão",
      "ajustes solicitados",
      "aprovado",
      "substituído",
    ])
      .default("em revisão")
      .notNull(),
    message: text("message"),
    submittedAt: bigint("submittedAt", { mode: "number" }).notNull(),
    completedAt: bigint("completedAt", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activityIdx: index("review_submissions_activity_idx").on(table.activityId),
    materialIdx: index("review_submissions_material_idx").on(table.materialId),
    revisionIdx: index("review_submissions_revision_idx").on(table.revisionId),
    statusIdx: index("review_submissions_status_idx").on(table.status),
  })
);

export const reviewDecisions = mysqlTable(
  "review_decisions",
  {
    id: int("id").autoincrement().primaryKey(),
    submissionId: int("submissionId")
      .notNull()
      .references(() => reviewSubmissions.id),
    reviewerId: int("reviewerId")
      .notNull()
      .references(() => teamMembers.id),
    decision: mysqlEnum("decision", [
      "em revisão",
      "ajustes solicitados",
      "aprovado",
    ]).notNull(),
    note: text("note"),
    decidedAt: bigint("decidedAt", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    submissionIdx: index("review_decisions_submission_idx").on(
      table.submissionId
    ),
    reviewerIdx: index("review_decisions_reviewer_idx").on(table.reviewerId),
    uniqueDecisionIdx: uniqueIndex("review_decisions_unique_idx").on(
      table.submissionId,
      table.reviewerId
    ),
  })
);

export const materialComments = mysqlTable(
  "material_comments",
  {
    id: int("id").autoincrement().primaryKey(),
    materialId: int("materialId")
      .notNull()
      .references(() => productionMaterials.id),
    revisionId: int("revisionId").references(() => materialRevisions.id),
    submissionId: int("submissionId").references(() => reviewSubmissions.id),
    authorId: int("authorId")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    commentType: mysqlEnum("commentType", [
      "comentário",
      "solicitação de ajuste",
      "resposta",
    ])
      .default("comentário")
      .notNull(),
    resolvedAt: bigint("resolvedAt", { mode: "number" }),
    resolvedBy: int("resolvedBy").references(() => users.id),
    status: mysqlEnum("status", ["aberto", "implementado", "resolvido"])
      .default("aberto")
      .notNull(),
    implementationNote: text("implementationNote"),
    implementedAt: bigint("implementedAt", { mode: "number" }),
    implementedBy: int("implementedBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    materialIdx: index("material_comments_material_idx").on(table.materialId),
    revisionIdx: index("material_comments_revision_idx").on(table.revisionId),
    submissionIdx: index("material_comments_submission_idx").on(
      table.submissionId
    ),
  })
);

export const coordinationInterfaces = mysqlTable(
  "coordination_interfaces",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 320 }).notNull(),
    description: text("description").notNull(),
    interfaceType: mysqlEnum("interfaceType", [
      "interface",
      "escopo sobreposto",
      "dependência",
    ]).notNull(),
    responsibleId: int("responsibleId")
      .notNull()
      .references(() => teamMembers.id),
    priority: mysqlEnum("priority", ["baixa", "média", "alta", "crítica"])
      .default("média")
      .notNull(),
    blockingClass: mysqlEnum("blockingClass", ["prioritária", "não prioritária"])
      .default("não prioritária")
      .notNull(),
    status: mysqlEnum("status", [
      "identificada",
      "em discussão",
      "encaminhada",
      "resolvida",
    ])
      .default("identificada")
      .notNull(),
    dueAt: bigint("dueAt", { mode: "number" }),
    resolution: text("resolution"),
    createdBy: int("createdBy")
      .notNull()
      .references(() => users.id),
    resolvedAt: bigint("resolvedAt", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    responsibleIdx: index("coordination_interfaces_responsible_idx").on(
      table.responsibleId
    ),
    statusIdx: index("coordination_interfaces_status_idx").on(table.status),
    priorityIdx: index("coordination_interfaces_priority_idx").on(table.priority),
    blockingClassIdx: index("coordination_interfaces_blocking_class_idx").on(table.blockingClass),
    dueIdx: index("coordination_interfaces_due_idx").on(table.dueAt),
  })
);

export const interfaceSections = mysqlTable(
  "interface_sections",
  {
    id: int("id").autoincrement().primaryKey(),
    interfaceId: int("interfaceId")
      .notNull()
      .references(() => coordinationInterfaces.id),
    sectionId: int("sectionId")
      .notNull()
      .references(() => studySections.id),
    role: mysqlEnum("role", ["origem", "relacionada"])
      .default("relacionada")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    interfaceIdx: index("interface_sections_interface_idx").on(table.interfaceId),
    sectionIdx: index("interface_sections_section_idx").on(table.sectionId),
    uniqueSectionIdx: uniqueIndex("interface_sections_unique_idx").on(
      table.interfaceId,
      table.sectionId
    ),
  })
);

export const interfaceActivities = mysqlTable(
  "interface_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    interfaceId: int("interfaceId")
      .notNull()
      .references(() => coordinationInterfaces.id),
    activityId: int("activityId")
      .notNull()
      .references(() => activities.id),
    role: mysqlEnum("role", ["origem", "relacionada"])
      .default("relacionada")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    interfaceIdx: index("interface_activities_interface_idx").on(
      table.interfaceId
    ),
    activityIdx: index("interface_activities_activity_idx").on(table.activityId),
    uniqueActivityIdx: uniqueIndex("interface_activities_unique_idx").on(
      table.interfaceId,
      table.activityId
    ),
  })
);

export const interfaceGroups = mysqlTable(
  "interface_groups",
  {
    id: int("id").autoincrement().primaryKey(),
    interfaceId: int("interfaceId")
      .notNull()
      .references(() => coordinationInterfaces.id),
    groupId: int("groupId")
      .notNull()
      .references(() => teamGroups.id),
    role: mysqlEnum("role", ["responsável", "envolvido"])
      .default("envolvido")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    interfaceIdx: index("interface_groups_interface_idx").on(table.interfaceId),
    groupIdx: index("interface_groups_group_idx").on(table.groupId),
    uniqueGroupIdx: uniqueIndex("interface_groups_unique_idx").on(
      table.interfaceId,
      table.groupId
    ),
  })
);

export const interfaceComments = mysqlTable(
  "interface_comments",
  {
    id: int("id").autoincrement().primaryKey(),
    interfaceId: int("interfaceId")
      .notNull()
      .references(() => coordinationInterfaces.id),
    authorId: int("authorId")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    interfaceIdx: index("interface_comments_interface_idx").on(table.interfaceId),
  })
);

export const interfaceEvidenceFiles = mysqlTable(
  "interface_evidence_files",
  {
    id: int("id").autoincrement().primaryKey(),
    interfaceId: int("interfaceId")
      .notNull()
      .references(() => coordinationInterfaces.id),
    activityId: int("activityId").references(() => activities.id),
    fileName: varchar("fileName", { length: 320 }).notNull(),
    mimeType: varchar("mimeType", { length: 160 }).notNull(),
    fileSize: int("fileSize").notNull(),
    storageKey: text("storageKey").notNull(),
    storageUrl: text("storageUrl").notNull(),
    uploadedBy: int("uploadedBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    interfaceIdx: index("interface_evidence_files_interface_idx").on(table.interfaceId),
    activityIdx: index("interface_evidence_files_activity_idx").on(table.activityId),
  })
);

export const interfaceAiAnalyses = mysqlTable(
  "interface_ai_analyses",
  {
    id: int("id").autoincrement().primaryKey(),
    interfaceId: int("interfaceId")
      .notNull()
      .references(() => coordinationInterfaces.id),
    model: varchar("model", { length: 120 }).notNull(),
    status: mysqlEnum("status", ["concluída", "falhou"]).notNull(),
    resultJson: text("resultJson"),
    errorMessage: text("errorMessage"),
    requestedBy: int("requestedBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    interfaceIdx: index("interface_ai_analyses_interface_idx").on(table.interfaceId),
  })
);

export const interfaceEvents = mysqlTable(
  "interface_events",
  {
    id: int("id").autoincrement().primaryKey(),
    interfaceId: int("interfaceId")
      .notNull()
      .references(() => coordinationInterfaces.id),
    actorId: int("actorId")
      .notNull()
      .references(() => users.id),
    eventType: mysqlEnum("eventType", [
      "criada",
      "atualizada",
      "status alterado",
      "resolvida",
      "reaberta",
    ]).notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    interfaceIdx: index("interface_events_interface_idx").on(table.interfaceId),
  })
);

export const notificationLogs = mysqlTable(
  "notification_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    activityId: int("activityId")
      .notNull()
      .references(() => activities.id),
    teamMemberId: int("teamMemberId")
      .notNull()
      .references(() => teamMembers.id),
    event: mysqlEnum("event", [
      "atribuicao",
      "prazo_3_dias",
      "atraso",
    ]).notNull(),
    status: mysqlEnum("status", [
      "pendente",
      "enviado",
      "falhou",
      "ignorado",
    ])
      .default("pendente")
      .notNull(),
    recipientPhone: varchar("recipientPhone", { length: 32 }),
    idempotencyKey: varchar("idempotencyKey", { length: 190 }).notNull(),
    providerMessageId: varchar("providerMessageId", { length: 255 }),
    errorMessage: text("errorMessage"),
    attempts: int("attempts").default(0).notNull(),
    nextAttemptAt: bigint("nextAttemptAt", { mode: "number" }),
    lastAttemptAt: bigint("lastAttemptAt", { mode: "number" }),
    sentAt: bigint("sentAt", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    activityIdx: index("notification_logs_activity_idx").on(table.activityId),
    eventIdx: index("notification_logs_event_idx").on(table.event),
    queueIdx: index("notification_logs_queue_idx").on(
      table.status,
      table.nextAttemptAt
    ),
    idempotencyIdx: uniqueIndex("notification_logs_idempotency_idx").on(
      table.idempotencyKey
    ),
  })
);

export const scopeMigrationHistory = mysqlTable(
  "scope_migration_history",
  {
    id: int("id").autoincrement().primaryKey(),
    migrationKey: varchar("migrationKey", { length: 96 }).notNull(),
    entityType: varchar("entityType", { length: 64 }).notNull(),
    entityId: int("entityId").notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    snapshot: text("snapshot").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    migrationIdx: index("scope_migration_history_migration_idx").on(
      table.migrationKey
    ),
    entityIdx: index("scope_migration_history_entity_idx").on(
      table.entityType,
      table.entityId
    ),
    uniqueSnapshotIdx: uniqueIndex("scope_migration_history_unique_idx").on(
      table.migrationKey,
      table.entityType,
      table.entityId
    ),
  })
);

export const participantNotifications = mysqlTable(
  "participant_notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    recipientUserId: int("recipientUserId").notNull(),
    recipientMemberId: int("recipientMemberId"),
    actorUserId: int("actorUserId"),
    activityId: int("activityId"),
    materialId: int("materialId"),
    type: varchar("type", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    actionUrl: varchar("actionUrl", { length: 255 }),
    read: boolean("read").default(false).notNull(),
    readAt: bigint("readAt", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    recipientUserIdx: index("participant_notifications_recipientUser_idx").on(
      table.recipientUserId
    ),
    readIdx: index("participant_notifications_read_idx").on(table.read),
    activityIdx: index("participant_notifications_activity_idx").on(table.activityId),
  })
);

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
