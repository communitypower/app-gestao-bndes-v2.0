import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  projectGovernanceDecisions,
  tomeGovernanceAssignments,
  tomeGovernanceEvents,
} from "../../drizzle/schema";
import { STUDY_TOMES } from "../../shared/domain";
import { assertAdministrator } from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getGovernanceOverview,
  listTeamMembers,
  requireDb,
} from "../db";

const tomeAssignmentSchema = z.object({
  tome: z.enum(STUDY_TOMES),
  coordinatorId: z.number().int().positive().nullable(),
  substituteId: z.number().int().positive().nullable(),
  justification: z.string().trim().min(10).max(1200),
});

async function assertActiveTomeMember(memberId: number | null, field: string) {
  if (memberId === null) return;
  const members = await listTeamMembers();
  const member = members.find(item => item.id === memberId);
  if (!member?.active) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${field} deve corresponder a um integrante ativo da equipe.`,
    });
  }
}

export const governanceRouter = router({
  overview: protectedProcedure.query(async () => getGovernanceOverview()),

  approveP0: protectedProcedure
    .input(z.object({ note: z.string().trim().max(1200).optional() }))
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      const db = await requireDb();
      const overview = await getGovernanceOverview();
      if (overview.p0Approval) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A autorização de implementação do P0 já foi registrada.",
        });
      }
      await db.insert(projectGovernanceDecisions).values({
        decisionType: "implementacao_p0",
        decision: "aprovada",
        note: input.note?.trim() || null,
        decidedBy: ctx.user.id,
        decidedAt: Date.now(),
      });
      return getGovernanceOverview();
    }),

  updateTomeAssignment: protectedProcedure
    .input(tomeAssignmentSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      if (
        input.coordinatorId !== null &&
        input.coordinatorId === input.substituteId
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Coordenador e substituto do tomo devem ser integrantes distintos.",
        });
      }
      await Promise.all([
        assertActiveTomeMember(input.coordinatorId, "O coordenador"),
        assertActiveTomeMember(input.substituteId, "O substituto"),
      ]);
      const db = await requireDb();
      const currentRows = await db
        .select()
        .from(tomeGovernanceAssignments)
        .where(eq(tomeGovernanceAssignments.tome, input.tome))
        .limit(1);
      const current = currentRows[0] ?? null;
      const changed =
        !current ||
        current.coordinatorId !== input.coordinatorId ||
        current.substituteId !== input.substituteId;
      const now = Date.now();
      await db
        .insert(tomeGovernanceAssignments)
        .values({
          tome: input.tome,
          coordinatorId: input.coordinatorId,
          substituteId: input.substituteId,
          assignedBy: ctx.user.id,
          assignedAt: now,
        })
        .onDuplicateKeyUpdate({
          set: {
            coordinatorId: input.coordinatorId,
            substituteId: input.substituteId,
            assignedBy: ctx.user.id,
            assignedAt: now,
          },
        });
      if (changed) {
        await db.insert(tomeGovernanceEvents).values({
          tome: input.tome,
          previousCoordinatorId: current?.coordinatorId ?? null,
          nextCoordinatorId: input.coordinatorId,
          previousSubstituteId: current?.substituteId ?? null,
          nextSubstituteId: input.substituteId,
          justification: input.justification.trim(),
          assignedBy: ctx.user.id,
        });
      }
      return getGovernanceOverview();
    }),
});
