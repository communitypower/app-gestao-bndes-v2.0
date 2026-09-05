import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  listParticipantNotifications,
  countUnreadParticipantNotifications,
  markParticipantNotificationRead,
  markAllParticipantNotificationsRead,
} from "../db";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return listParticipantNotifications(ctx.user.id, input?.limit ?? 50);
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const unreadCount = await countUnreadParticipantNotifications(ctx.user.id);
    return { unreadCount };
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const success = await markParticipantNotificationRead(input.id, ctx.user.id);
      return { success };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const count = await markAllParticipantNotificationsRead(ctx.user.id);
    return { success: true, count };
  }),
});
