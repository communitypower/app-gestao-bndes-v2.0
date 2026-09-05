import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const fixtures = vi.hoisted(() => {
  const coordinatorUser = {
    id: 101,
    name: "Coordenador Carlos",
    email: "carlos@example.com",
    role: "user" as const,
  };
  const reviewerUser = {
    id: 102,
    name: "Revisor Roberto",
    email: "roberto@example.com",
    role: "user" as const,
  };
  const authorUser = {
    id: 103,
    name: "Autor Antonio",
    email: "antonio@example.com",
    role: "user" as const,
  };

  const coordinatorMember = {
    id: 11,
    userId: coordinatorUser.id,
    name: coordinatorUser.name,
    email: coordinatorUser.email,
    groupId: 7,
    groupRole: "coordenador" as const,
    active: true,
  };

  const reviewerMember = {
    id: 12,
    userId: reviewerUser.id,
    name: reviewerUser.name,
    email: reviewerUser.email,
    groupId: 7,
    groupRole: "participante" as const,
    active: true,
  };

  const authorMember = {
    id: 13,
    userId: authorUser.id,
    name: authorUser.name,
    email: authorUser.email,
    groupId: 7,
    groupRole: "participante" as const,
    active: true,
  };

  const activity = {
    id: 501,
    planCode: "I.4",
    detailCode: null,
    title: "Mapeamento das Comunidades",
    description: "Levantamento detalhado",
    responsibleId: coordinatorMember.id,
    documentStatus: "em elaboração" as const,
    parentActivityId: null,
    startAt: 1700000000000,
    dueAt: 1710000000000,
    allocations: [
      {
        id: 1,
        activityId: 501,
        teamMemberId: authorMember.id,
        isExecutionLead: true,
        responsibility: "Autor",
        allocatedHours: 40,
        active: true,
      },
    ],
    reviewers: [
      {
        id: 1,
        activityId: 501,
        teamMemberId: reviewerMember.id,
        status: "em revisão" as const,
        active: true,
      },
    ],
  };

  return {
    coordinatorUser,
    reviewerUser,
    authorUser,
    coordinatorMember,
    reviewerMember,
    authorMember,
    activity,
  };
});

const dbMocks = vi.hoisted(() => ({
  ensureSeedData: vi.fn().mockResolvedValue(undefined),
  getActivity: vi.fn().mockResolvedValue(fixtures.activity),
  getTeamMemberByUserId: vi.fn((userId: number) => {
    if (userId === fixtures.coordinatorUser.id) return Promise.resolve(fixtures.coordinatorMember);
    if (userId === fixtures.reviewerUser.id) return Promise.resolve(fixtures.reviewerMember);
    if (userId === fixtures.authorUser.id) return Promise.resolve(fixtures.authorMember);
    return Promise.resolve(null);
  }),
  listActivities: vi.fn().mockResolvedValue([fixtures.activity]),
  listCoordinationInterfaces: vi.fn().mockResolvedValue([]),
  listProductionMaterials: vi.fn().mockResolvedValue([
    {
      id: 99,
      activityId: fixtures.activity.id,
      title: fixtures.activity.title,
      reviewStatus: "em elaboração",
      responsibleId: fixtures.coordinatorMember.id,
      responsibleGroupId: 7,
      currentRevision: 1,
      reviewers: [
        {
          id: 1,
          teamMemberId: fixtures.reviewerMember.id,
          name: fixtures.reviewerMember.name,
          email: fixtures.reviewerMember.email,
        },
      ],
      revisions: [
        {
          id: 10,
          revisionNumber: 1,
          fileName: "minuta.docx",
        },
      ],
    },
  ]),
  listTeamMembers: vi.fn().mockResolvedValue([
    fixtures.coordinatorMember,
    fixtures.reviewerMember,
    fixtures.authorMember,
  ]),
  listParticipantNotifications: vi.fn().mockResolvedValue([
    {
      id: 1,
      recipientUserId: fixtures.reviewerUser.id,
      actorUserId: fixtures.coordinatorUser.id,
      activityId: 501,
      type: "revisao_atribuida",
      title: "Nova revisão técnica atribuída",
      message: "Você foi designado como revisor técnico da atividade I.4",
      actionUrl: "/atividades?ficha=501",
      read: false,
      createdAt: new Date(),
    },
  ]),
  countUnreadParticipantNotifications: vi.fn().mockResolvedValue(1),
  markParticipantNotificationRead: vi.fn().mockResolvedValue(true),
  markAllParticipantNotificationsRead: vi.fn().mockResolvedValue(1),
  requireDb: vi.fn(),
  syncActivityDocumentStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(
  user: { id: number; name: string; email: string; role: "admin" | "user" }
): TrpcContext {
  return {
    user: {
      ...user,
      openId: `openid-${user.id}`,
      loginMethod: "manus",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

describe("Participant Notifications & Workload Actions", () => {
  it("allows a participant to list notifications and query unread count", async () => {
    const caller = appRouter.createCaller(context(fixtures.reviewerUser));

    const countRes = await caller.notifications.unreadCount();
    expect(countRes).toEqual({ unreadCount: 1 });

    const listRes = await caller.notifications.list({ limit: 10 });
    expect(listRes).toHaveLength(1);
    expect(listRes[0].title).toBe("Nova revisão técnica atribuída");
    expect(listRes[0].type).toBe("revisao_atribuida");
  });

  it("marks single notification as read", async () => {
    const caller = appRouter.createCaller(context(fixtures.reviewerUser));
    const result = await caller.notifications.markAsRead({ id: 1 });
    expect(result).toEqual({ success: true });
    expect(dbMocks.markParticipantNotificationRead).toHaveBeenCalledWith(1, fixtures.reviewerUser.id);
  });

  it("marks all notifications as read", async () => {
    const caller = appRouter.createCaller(context(fixtures.reviewerUser));
    const result = await caller.notifications.markAllAsRead();
    expect(result).toMatchObject({ success: true });
    expect(dbMocks.markAllParticipantNotificationsRead).toHaveBeenCalledWith(fixtures.reviewerUser.id);
  });

  it("computes role-based actions in myWorkloadActions for executor", async () => {
    const caller = appRouter.createCaller(context(fixtures.authorUser));
    const workload = await caller.activities.myWorkloadActions();

    expect(workload.summary).toBeDefined();
    expect(workload.executorActions.length).toBeGreaterThan(0);
    const firstAction = workload.executorActions[0];
    expect(firstAction.role).toBe("executor");
    expect(firstAction.activityId).toBe(501);
  });

  it("computes role-based actions in myWorkloadActions for reviewer", async () => {
    // Simulamos que a atividade está submetida para revisão
    dbMocks.listActivities.mockResolvedValueOnce([
      {
        ...fixtures.activity,
        documentStatus: "submetida à revisão da seção",
      },
    ]);
    const caller = appRouter.createCaller(context(fixtures.reviewerUser));
    const workload = await caller.activities.myWorkloadActions();

    expect(workload.reviewerActions.length).toBeGreaterThan(0);
    const firstReview = workload.reviewerActions[0];
    expect(firstReview.role).toBe("revisor");
    expect(firstReview.activityId).toBe(501);
  });
});
