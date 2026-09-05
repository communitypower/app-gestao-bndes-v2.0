import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ensureSeedData, listUserAccessDirectory, requireDb } from "./db";
import { userAccessProvisions, users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { activitiesRouter } from "./routers/activities";
import { administrationRouter } from "./routers/administration";
import { dashboardRouter } from "./routers/dashboard";
import { fieldworkRouter } from "./routers/fieldwork";
import { governanceRouter } from "./routers/governance";
import { interfacesRouter } from "./routers/interfaces";
import { libraryRouter } from "./routers/library";
import { productionRouter } from "./routers/production";
import { teamRouter } from "./routers/team";
import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    loginList: publicProcedure.query(async () => {
      await ensureSeedData();
      return listUserAccessDirectory();
    }),
    loginAs: publicProcedure
      .input(
        z.object({
          openId: z.string().optional(),
          email: z.string().optional(),
          userId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await ensureSeedData();
        const dbInstance = await requireDb();
        let targetUser;
        if (input.userId) {
          const rows = await dbInstance.select().from(users).where(eq(users.id, input.userId)).limit(1);
          targetUser = rows[0];
        } else if (input.email) {
          const trimmed = input.email.trim();
          const rows = await dbInstance.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${trimmed})`).limit(1);
          targetUser = rows[0];
          if (!targetUser) {
            const provRows = await dbInstance.select().from(userAccessProvisions).where(sql`LOWER(${userAccessProvisions.email}) = LOWER(${trimmed})`).limit(1);
            if (provRows[0]) {
              const prov = provRows[0];
              const openId = `user_${prov.email.replace(/[^a-zA-Z0-9_]/g, "_")}`;
              await dbInstance.insert(users).values({
                openId,
                name: prov.name,
                email: prov.email,
                role: prov.role,
                appRole: prov.appRole,
                accessStatus: "ativo",
                loginMethod: "local",
                lastSignedIn: new Date(),
              }).onConflictDoUpdate({
                target: users.openId,
                set: {
                  lastSignedIn: new Date(),
                  accessStatus: "ativo",
                },
              });
              const created = await dbInstance.select().from(users).where(eq(users.openId, openId)).limit(1);
              targetUser = created[0];
            }
          }
        } else if (input.openId) {
          const rows = await dbInstance.select().from(users).where(eq(users.openId, input.openId)).limit(1);
          targetUser = rows[0];
        }

        if (!targetUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Usuário não encontrado.",
          });
        }

        const sessionToken = await sdk.createSessionToken(targetUser.openId, {
          name: targetUser.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          success: true,
          user: targetUser,
          token: sessionToken,
        };
      }),
  }),
  dashboard: dashboardRouter,
  activities: activitiesRouter,
  team: teamRouter,
  library: libraryRouter,
  production: productionRouter,
  interfaces: interfacesRouter,
  fieldwork: fieldworkRouter,
  administration: administrationRouter,
  governance: governanceRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
