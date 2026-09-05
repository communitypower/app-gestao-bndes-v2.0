import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function collaboratorContext(): TrpcContext {
  return {
    user: {
      id: 77,
      openId: "collaborator-test",
      name: "Colaborador Teste",
      email: "colaborador@example.com",
      loginMethod: "manus",
      role: "user",
      appRole: "executor",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("enforcement do perfil colaborador", () => {
  it.each([
    ["atividades", (caller: ReturnType<typeof appRouter.createCaller>) => caller.activities.list()],
    ["equipe", (caller: ReturnType<typeof appRouter.createCaller>) => caller.team.list()],
    ["administração", (caller: ReturnType<typeof appRouter.createCaller>) => caller.administration.processAlertsNow()],
    ["criação de atividade", (caller: ReturnType<typeof appRouter.createCaller>) => caller.activities.create({ title: "Atividade teste", description: "Descrição teste", sectionId: 1, responsibleId: 1, dueAt: Date.now() + 86_400_000, status: "pendente", progress: 0 })],
    ["edição de atividade", (caller: ReturnType<typeof appRouter.createCaller>) => caller.activities.update({ id: 1, status: "em andamento" })],
    ["criação de participante", (caller: ReturnType<typeof appRouter.createCaller>) => caller.team.create({ userId: null, name: "Participante Teste", title: "Pesquisador", institution: "Instituição", groupId: 1, groupRole: "participante", whatsappPhone: null, whatsappOptIn: false, active: true })],
    ["edição de participante", (caller: ReturnType<typeof appRouter.createCaller>) => caller.team.update({ id: 1, active: true })],
    ["configuração do projeto", (caller: ReturnType<typeof appRouter.createCaller>) => caller.administration.updateProject({ name: "Estudo Teste", projectStartAt: Date.now(), projectEndAt: Date.now() + 86_400_000, timezone: "America/Sao_Paulo" })],
    ["configuração do WhatsApp", (caller: ReturnType<typeof appRouter.createCaller>) => caller.administration.updateWhatsApp({ whatsappEnabled: false, whatsappTemplateName: "alerta_teste", whatsappLanguageCode: "pt_BR" })],
    ["alteração de perfil", (caller: ReturnType<typeof appRouter.createCaller>) => caller.administration.setUserRole({ userId: 1, appRole: "administrador" })],
    ["configuração da rotina", (caller: ReturnType<typeof appRouter.createCaller>) => caller.administration.configureSchedule({ enabled: false })],
  ])("bloqueia %s no servidor", async (_area, execute) => {
    const caller = appRouter.createCaller(collaboratorContext());
    await expect(execute(caller)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("expõe apenas o estado não administrativo no procedimento de identificação", async () => {
    const caller = appRouter.createCaller(collaboratorContext());
    const result = await caller.administration.status();
    expect(result.isAdmin).toBe(false);
    expect(result.users).toEqual([]);
    expect(result.notificationLogs).toEqual([]);
  });
});
