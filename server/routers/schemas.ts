import { z } from "zod";
import { ACTIVITY_STATUSES } from "../../shared/domain";

export const fileInputSchema = z.object({
  fileName: z.string().min(1).max(320),
  mimeType: z.string().min(1).max(160),
  fileSize: z.number().int().positive().max(20 * 1024 * 1024),
  base64: z.string().min(1).max(30 * 1024 * 1024),
});

export const activityAllocationInputSchema = z.object({
  teamMemberId: z.number().int().positive(),
  allocatedHours: z.number().positive().max(100_000),
  responsibility: z.string().trim().min(3).max(1_000),
  isExecutionLead: z.boolean(),
});

export const activityInputSchema = z.object({
  title: z.string().trim().min(3).max(260),
  description: z.string().trim().min(3).max(10_000),
  sectionId: z.number().int().positive(),
  responsibleId: z.number().int().positive(),
  startAt: z.number().int().positive().nullable().default(null),
  dueAt: z.number().int().positive(),
  status: z.enum(ACTIVITY_STATUSES),
  progress: z.number().int().min(0).max(100),
  allocations: z
    .array(activityAllocationInputSchema)
    .max(100)
    .default([]),
});

const uniquePositiveIds = z
  .array(z.number().int().positive())
  .max(100)
  .refine(values => new Set(values).size === values.length, {
    message: "Não repita o mesmo item na seleção.",
  });

export const activityScheduleSchema = z
  .object({
    id: z.number().int().positive(),
    startAt: z.number().int().positive().nullable(),
    dueAt: z.number().int().positive(),
  })
  .refine(input => !input.startAt || input.startAt <= input.dueAt, {
    message: "A data inicial não pode ser posterior à data de término.",
    path: ["startAt"],
  });

export const activityMilestoneInputSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(10_000).nullable().default(null),
  dueAt: z.number().int().positive(),
  status: z.enum(["planejado", "concluído"]),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const activityMilestoneSetSchema = z.object({
  id: z.number().int().positive(),
  milestones: z
    .array(activityMilestoneInputSchema)
    .max(50)
    .refine(
      values => new Set(values.map(item => item.title.toLocaleLowerCase())).size === values.length,
      { message: "Não repita o título de um marco na mesma atividade." }
    ),
});

export const activityReviewerIdsSchema = uniquePositiveIds;

export const reviewDecisionSchema = z.object({
  submissionId: z.number().int().positive(),
  decision: z.enum(["em revisão", "ajustes solicitados", "aprovado"]),
  note: z.string().trim().max(10_000).nullable(),
});

export const coordinationInterfaceInputSchema = z.object({
  title: z.string().trim().min(3).max(320),
  description: z.string().trim().min(3).max(20_000),
  interfaceType: z.enum(["interface", "escopo sobreposto", "dependência"]),
  responsibleId: z.number().int().positive(),
  priority: z.enum(["baixa", "média", "alta", "crítica"]),
  blockingClass: z.enum(["prioritária", "não prioritária"]).default("não prioritária"),
  status: z.enum([
    "identificada",
    "em discussão",
    "encaminhada",
    "resolvida",
  ]),
  dueAt: z.number().int().positive().nullable(),
  resolution: z.string().trim().max(20_000).nullable(),
  sectionIds: uniquePositiveIds.refine(values => values.length >= 2, {
    message: "Selecione pelo menos duas seções relacionadas.",
  }),
  groupIds: uniquePositiveIds.refine(values => values.length >= 2, {
    message: "Selecione pelo menos dois grupos envolvidos.",
  }),
  activityIds: uniquePositiveIds.default([]),
});

export const fieldworkActivityInputSchema = z
  .object({
    code: z.string().trim().min(3).max(32),
    title: z.string().trim().min(3).max(320),
    description: z.string().trim().min(3).max(20_000),
    category: z.enum([
      "visita a estaleiro",
      "coleta de fonte primária",
      "entrevista estruturada",
      "apresentação de relatório",
      "apresentação para equipe",
      "audiência pública",
    ]),
    country: z.string().trim().max(96).nullable(),
    location: z.string().trim().max(180).nullable(),
    relatedActivityId: z.number().int().positive().nullable(),
    responsibleId: z.number().int().positive().nullable(),
    groupId: z.number().int().positive().nullable(),
    startAt: z.number().int().positive().nullable(),
    dueAt: z.number().int().positive().nullable(),
    status: z.enum(["pendente", "em andamento", "concluído", "atrasado"]),
  })
  .refine(input => !input.startAt || !input.dueAt || input.startAt <= input.dueAt, {
    message: "A data inicial não pode ser posterior à data de término.",
    path: ["startAt"],
  });
