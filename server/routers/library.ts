import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { libraryItems, studySections } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import {
  ensureSeedData,
  getLibraryStatistics,
  listLibraryItems,
  requireDb,
} from "../db";
import { ENV } from "../_core/env";
import { uploadProjectFile } from "../fileUpload";
import { storageGetSignedUrl } from "../storage";
import { fileInputSchema } from "./schemas";

const metadataSchema = z.object({
  title: z.string().trim().min(3).max(320),
  description: z.string().trim().max(10_000).nullable(),
  theme: z.string().trim().max(180).nullable(),
  sectionId: z.number().int().positive().nullable(),
});

export const libraryRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().max(200).optional(),
          theme: z.string().max(180).optional(),
          sectionId: z.number().int().positive().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
    await ensureSeedData();
    return listLibraryItems(input);
    }),

  statistics: protectedProcedure.query(async () => {
    await ensureSeedData();
    return getLibraryStatistics();
  }),

  syncStatus: protectedProcedure.query(() => ({
    oauthConfigured: Boolean(ENV.googleDriveClientId && ENV.googleDriveClientSecret),
    connected: false,
    connectionLabel: null as string | null,
  })),

  addLink: protectedProcedure
    .input(metadataSchema.extend({ externalUrl: z.string().url().max(2_000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.insert(libraryItems).values({
        ...input,
        itemType: "link",
        uploadedBy: ctx.user.id,
      });
      return listLibraryItems();
    }),

  upload: protectedProcedure
    .input(metadataSchema.extend({ file: fileInputSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      let sectionCode = "geral";
      if (input.sectionId) {
        const section = await db
          .select({ code: studySections.code })
          .from(studySections)
          .where(eq(studySections.id, input.sectionId))
          .limit(1);
        if (!section[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Seção não encontrada." });
        }
        sectionCode = section[0].code;
      }

      const stored = await uploadProjectFile("library", sectionCode, input.file);
      await db.insert(libraryItems).values({
        title: input.title,
        description: input.description,
        theme: input.theme,
        sectionId: input.sectionId,
        itemType: "arquivo",
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
        fileSize: input.file.fileSize,
        storageKey: stored.key,
        storageUrl: stored.url,
        uploadedBy: ctx.user.id,
      });
      return listLibraryItems();
    }),

  accessFile: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const item = await db
        .select({ key: libraryItems.storageKey })
        .from(libraryItems)
        .where(eq(libraryItems.id, input.id))
        .limit(1);
      if (!item[0]?.key) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado." });
      }
      return { url: await storageGetSignedUrl(item[0].key) };
    }),
});
