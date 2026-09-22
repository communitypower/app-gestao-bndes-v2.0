import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ensureSeedData, requireDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("First Access Invitation Email with Group CC (Com Cópia)", () => {
  it("includes all G7 co-members in CC when sending draft to G7 coordinator", async () => {
    await ensureSeedData();
    const db = await requireDb();

    // Fetch user for Carlos Daher Padovezi
    const [padoveziUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "padnaval@ipt.br"))
      .limit(1);

    expect(padoveziUser).toBeDefined();

    // Call sendFirstAccessInvitation as admin
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "admin",
        name: "Administrador Teste",
        email: "admin@ufrj.br",
        appRole: "administrador",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      } as any,
      req: {
        get: () => "localhost:3000",
        headers: { host: "localhost:3000", "x-forwarded-proto": "http" },
        protocol: "http",
      } as any,
      res: {} as any,
    });

    const result = await caller.administration.sendFirstAccessInvitation({
      email: "padnaval@ipt.br",
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    const invitation = result.latestInvitation;
    expect(invitation).toBeDefined();
    expect(invitation?.email).toBe("padnaval@ipt.br");
    expect(invitation?.groupName).toContain("G7");

    // Check CC members
    const ccEmails = invitation?.ccEmails || [];
    expect(ccEmails.length).toBeGreaterThanOrEqual(4);
    // CC must contain G7 co-members
    expect(ccEmails).toContain("pedrolameira@ufpa.br");
    expect(ccEmails).toContain("amkogishi@ipt.br");
    expect(ccEmails).toContain("hito@ufpa.br");
    expect(ccEmails).toContain("nelio@ufpa.br");
    expect(ccEmails).toContain("emannuel@ufpa.br");
    // CC must NOT contain recipient's own email
    expect(ccEmails).not.toContain("padnaval@ipt.br");

    // Check message body includes CC section
    expect(invitation?.messageBody).toContain("Integrantes do Grupo em Cópia (CC):");
    expect(invitation?.messageBody).toContain("pedrolameira@ufpa.br");

    // Check mailtoUrl includes CC parameter
    expect(invitation?.mailtoUrl).toBeDefined();
    expect(invitation?.mailtoUrl).toContain("mailto:padnaval%40ipt.br");
    expect(invitation?.mailtoUrl).toContain("cc=");
    expect(invitation?.mailtoUrl).toContain("pedrolameira%40ufpa.br");
  });

  it("includes coordinator and co-members in CC when sending draft to a group participant", async () => {
    await ensureSeedData();
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "admin",
        name: "Administrador Teste",
        email: "admin@ufrj.br",
        appRole: "administrador",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      } as any,
      req: {
        get: () => "localhost:3000",
        headers: { host: "localhost:3000" },
        protocol: "https",
      } as any,
      res: {} as any,
    });

    // Test G11 participant Marcos Pereira
    const result = await caller.administration.sendFirstAccessInvitation({
      email: "marcos.pereira2@ufpe.br",
    });

    expect(result.success).toBe(true);
    const invitation = result.latestInvitation;
    expect(invitation).toBeDefined();
    expect(invitation?.email).toBe("marcos.pereira2@ufpe.br");
    expect(invitation?.groupName).toContain("G11");

    const ccEmails = invitation?.ccEmails || [];
    // Should include G11 coordinator Marta Cecilia Tapia Reyes and other members
    expect(ccEmails).toContain("martatapia@poli.ufrj.br");
    expect(ccEmails).toContain("joao.candido@consultoria.com");
    expect(ccEmails).toContain("sergio.lamarca@consultoria.com");
    expect(ccEmails).toContain("isaias.masetti@consultoria.com");
    // Must NOT contain Marcos Pereira
    expect(ccEmails).not.toContain("marcos.pereira2@ufpe.br");
  });

  it("handles multi-group coordinator (e.g. Floriano Carlos Martins Pires Jr. in G1, G4, G10)", async () => {
    await ensureSeedData();
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "admin",
        name: "Administrador Teste",
        email: "admin@ufrj.br",
        appRole: "administrador",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      } as any,
      req: {
        get: () => "localhost:3000",
        headers: { host: "localhost:3000" },
        protocol: "https",
      } as any,
      res: {} as any,
    });

    const result = await caller.administration.sendFirstAccessInvitation({
      email: "floriano@oceanica.ufrj.br",
    });

    expect(result.success).toBe(true);
    const invitation = result.latestInvitation;
    expect(invitation).toBeDefined();
    expect(invitation?.email).toBe("floriano@oceanica.ufrj.br");

    const ccEmails = invitation?.ccEmails || [];
    // Co-members from G1, G4, G10
    expect(ccEmails).toContain("segen@lts.coppe.ufrj.br");
    expect(ccEmails).toContain("felipe@oceanica.ufrj.br");
    expect(ccEmails).toContain("cassianomarins@gmail.com");
    expect(ccEmails).toContain("fred@ie.ufrj.br");
    expect(ccEmails).toContain("marcelo.colomer@gmail.com");
    expect(ccEmails).not.toContain("floriano@oceanica.ufrj.br");

    // Verify deduplication
    const uniqueEmails = new Set(ccEmails);
    expect(uniqueEmails.size).toBe(ccEmails.length);
  });
});
