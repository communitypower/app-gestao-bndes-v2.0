import fs from "fs";
import path from "path";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import {
  activityAllocations,
  activityEvidenceLinks,
  activityLeadershipEvents,
  activityMilestones,
  activityReviewers,
  activities,
  activityDocumentWorkflowEvents,
  coordinationInterfaces,
  fieldworkActivities,
  InsertUser,
  interfaceAiAnalyses,
  interfaceComments,
  interfaceEvidenceFiles,
  interfaceEvents,
  interfaceActivities,
  interfaceGroups,
  interfaceSections,
  libraryItems,
  materialComments,
  materialRevisions,
  notificationLogs,
  participantNotifications,
  productionMaterials,
  projectEditorialGovernance,
  projectEditorialGovernanceEvents,
  projectGovernanceDecisions,
  projectSettings,
  reviewChecklistEvents,
  reviewChecklistItems,
  reviewDecisions,
  reviewSubmissions,
  studySections,
  teamGroups,
  teamGroupMemberships,
  teamMembers,
  tomeGovernanceAssignments,
  tomeGovernanceEvents,
  userAccessProvisions,
  userAccessEvents,
  users,
} from "../drizzle/schema";
import {
  DEFAULT_PROJECT_END_AT,
  DEFAULT_PROJECT_START_AT,
  DEFAULT_TIMEZONE,
  studySectionDescription,
  STUDY_SECTIONS,
  STUDY_TOME_TITLES,
  STUDY_TOMES,
  TEAM_GROUP_SEED,
  TEAM_SEED,
  teamGroupForMember,
  CHAPTER_RESPONSIBLE_MAP,
  GROUP_MEMBERSHIPS_SEED,
  AppRole,
  IDENTIFIED_INTERFACES_SEED,
} from "../shared/domain";
import {
  PDF_ANALYTIC_SECTIONS,
  PDF_ANALYTIC_ITEMS,
  PDF_ANALYTIC_SOURCE,
} from "../shared/pdfAnalyticIndex";
import { totalAllocatedHours } from "../shared/teamStructure";
import { ENV } from './_core/env';
import { normalizeProvisionEmail } from "./accessProvisioning";
import { normalizeLibraryFilters, type LibraryFilters } from "./libraryFilters";
import { initLocalDatabase } from "./localDb";
import * as schema from "../drizzle/schema";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

export type DbClient = NodePgDatabase<typeof schema>;

let _db: DbClient | null = null;
let _pool: pg.Pool | null = null;
let _initDbPromise: Promise<DbClient | null> | null = null;

async function runPostgresMigrations(client: DbClient, pool: pg.Pool) {
  const drizzleDir = path.resolve(process.cwd(), "drizzle");
  if (!fs.existsSync(drizzleDir)) return;

  try {
    console.log("[Database] Running Drizzle migrations on PostgreSQL...");
    await migrate(client, { migrationsFolder: drizzleDir });
    console.log("[Database] Drizzle migrations applied successfully.");
    return;
  } catch (migErr: any) {
    console.warn("[Database] Drizzle migrator notice, falling back to direct SQL execution:", migErr?.message || migErr);
  }

  try {
    const files = fs
      .readdirSync(drizzleDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const content = fs.readFileSync(path.join(drizzleDir, file), "utf-8");
      const statements = content
        .split("--> statement-breakpoint")
        .map(s => s.trim())
        .filter(Boolean);

      for (const stmt of statements) {
        try {
          await pool.query(stmt);
        } catch (err: any) {
          if (!err?.message?.includes("already exists") && !err?.message?.includes("duplicate")) {
            console.warn(`[Database] Migration statement notice:`, err?.message || err);
          }
        }
      }
    }
    console.log("[Database] Direct SQL migrations completed.");
  } catch (err) {
    console.error("[Database] Direct SQL migration error:", err);
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB or fallback to embedded Postgres.
export async function getDb(): Promise<DbClient | null> {
  if (_db) return _db;
  if (_initDbPromise) return _initDbPromise;

  _initDbPromise = (async () => {
    const rawUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
    if (rawUrl) {
      try {
        const urlStr = rawUrl.trim();
        const shouldDisableSsl =
          urlStr.includes("localhost") ||
          urlStr.includes("127.0.0.1") ||
          urlStr.includes("host.docker.internal") ||
          urlStr.includes(".railway.internal") ||
          urlStr.includes("sslmode=disable");

        let sslConfig: boolean | { rejectUnauthorized: boolean } = shouldDisableSsl
          ? false
          : { rejectUnauthorized: false };

        _pool = new pg.Pool({
          connectionString: urlStr,
          ssl: sslConfig,
        });

        // Test connectivity with auto-retry for SSL mismatch (common on Railway)
        try {
          const testClient = await _pool.connect();
          testClient.release();
        } catch (connErr: any) {
          const errMsg = connErr?.message || "";
          if (
            sslConfig !== false &&
            (errMsg.includes("does not support SSL") ||
              errMsg.includes("The server does not support SSL") ||
              errMsg.includes("no pg_hba.conf entry for host") ||
              errMsg.includes("SSL connection has been closed unexpectedly"))
          ) {
            console.log("[Database] SSL connection refused by PostgreSQL server, retrying without SSL (Railway private network mode)...");
            await _pool.end().catch(() => {});
            sslConfig = false;
            _pool = new pg.Pool({
              connectionString: urlStr,
              ssl: false,
            });
            const testClient = await _pool.connect();
            testClient.release();
          } else if (
            sslConfig === false &&
            (errMsg.includes("server requires SSL") || errMsg.includes("SSL is required"))
          ) {
            console.log("[Database] Server requires SSL, retrying with SSL...");
            await _pool.end().catch(() => {});
            sslConfig = { rejectUnauthorized: false };
            _pool = new pg.Pool({
              connectionString: urlStr,
              ssl: sslConfig,
            });
            const testClient = await _pool.connect();
            testClient.release();
          } else {
            throw connErr;
          }
        }

        const client = drizzle(_pool, { schema });
        _db = client;
        console.log("[Database] Connected to PostgreSQL successfully!");

        // Run migrations
        await runPostgresMigrations(client, _pool);

        // Ensure canonical seed data exists
        try {
          console.log("[Database] Ensuring canonical seed data...");
          await ensureSeedData(client);
          console.log("[Database] Canonical seed data populated and verified.");
        } catch (seedErr: any) {
          console.warn("[Database] Seed data notice:", seedErr?.message || seedErr);
        }

        return _db;
      } catch (error) {
        console.warn("[Database] Failed to connect to DATABASE_URL, falling back to local DB:", error);
        _db = null;
        if (_pool) {
          await _pool.end().catch(() => {});
          _pool = null;
        }
      }
    }

    if (!_db) {
      try {
        _db = (await initLocalDatabase()) as DbClient;
      } catch (err) {
        console.error("[Database] Failed to initialize local embedded DB:", err);
        _db = null;
      }
    }

    return _db;
  })();

  return _initDbPromise;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const normalizedEmail = normalizeProvisionEmail(user.email);
    const provision = normalizedEmail
      ? (
          await db
            .select()
            .from(userAccessProvisions)
            .where(
              and(
                eq(userAccessProvisions.email, normalizedEmail),
                or(
                  eq(userAccessProvisions.status, "pendente"),
                  eq(userAccessProvisions.status, "ativado")
                )
              )
            )
            .limit(1)
        )[0]
      : undefined;
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    } else if (provision) {
      values.role = provision.role;
      updateSet.role = provision.role;
    }
    if (user.appRole !== undefined) {
      values.appRole = user.appRole;
      updateSet.appRole = user.appRole;
    } else if (user.openId === ENV.ownerOpenId) {
      values.appRole = "administrador";
      updateSet.appRole = "administrador";
    } else if (provision) {
      values.appRole = provision.appRole;
      updateSet.appRole = provision.appRole;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });

    if (provision) {
      const activatedUser = await getUserByOpenId(user.openId);
      if (activatedUser) {
        await db
          .update(userAccessProvisions)
          .set({ status: "ativado", userId: activatedUser.id, activatedAt: new Date() })
          .where(eq(userAccessProvisions.id, provision.id));
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

export function canonicalStudySectionRows() {
  return STUDY_SECTIONS.map((section, index) => ({
    code: section.code,
    title: section.title,
    officialDescription: studySectionDescription(section.code),
    sortOrder: index + 1,
  }));
}

export async function syncStudySectionCatalog(
  db: Awaited<ReturnType<typeof requireDb>>
) {
  for (const row of canonicalStudySectionRows()) {
    await db
      .insert(studySections)
      .values(row)
      .onConflictDoUpdate({
        target: studySections.code,
        set: {
          title: row.title,
          officialDescription: row.officialDescription,
          sortOrder: row.sortOrder,
        },
      });
  }
}

/**
 * Mantém a estrutura do Anexo B do Plano de Trabalho de 26 de agosto e
 * atribui as responsabilidades dos capítulos aos coordenadores dos grupos
 * indicados na matriz Atividades-Grupos.xlsm.
 */
export async function syncPdfAnalyticCatalog(
  db: Awaited<ReturnType<typeof requireDb>>
) {
  const [sections, initialActivities, activeMembers] = await Promise.all([
    db.select().from(studySections),
    db.select().from(activities),
    db.select().from(teamMembers).where(eq(teamMembers.active, true)),
  ]);
  const sectionByCode = new Map(sections.map(section => [section.code, section]));
  const fallbackResponsible = activeMembers[0];
  if (!fallbackResponsible) {
    throw new Error("Não há integrante ativo para preservar ou inicializar a coordenação das atividades canônicas.");
  }
  const memberByName = new Map(activeMembers.map(m => [m.name, m]));

  const canonicalParents = new Map<number, { id: number; responsibleId: number; startAt: number | null; dueAt: number }>();
  const parentRows = initialActivities.filter(activity => activity.parentActivityId === null);
  for (const section of STUDY_SECTIONS) {
    const storedSection = sectionByCode.get(section.code);
    if (!storedSection) throw new Error(`Seção canônica ${section.code} não encontrada.`);
    const coordinatorName = CHAPTER_RESPONSIBLE_MAP[section.code];
    const sectionResponsible = (coordinatorName ? memberByName.get(coordinatorName) : null) ?? fallbackResponsible;

    const candidates = parentRows
      .filter(activity => activity.sectionId === storedSection.id)
      .sort((left, right) => (left.planSortOrder ?? Number.MAX_SAFE_INTEGER) - (right.planSortOrder ?? Number.MAX_SAFE_INTEGER) || left.id - right.id);
    const existing = candidates[0];
    if (existing) {
      const needsDescriptionRestore =
        !existing.description ||
        existing.description === existing.title ||
        existing.description === section.title ||
        existing.description.trim().length < 60 ||
        section.code === "III.3";
      await db.update(activities).set({
        planCode: section.code,
        planSortOrder: section.sortOrder,
        title: section.title,
        description: needsDescriptionRestore ? section.officialDescription : existing.description,
        planningSummary: section.officialDescription,
        planningResponsible: null,
        planningSupport: null,
        portalDeliverable: null,
        dependencies: null,
        keywords: null,
        planningStatus: "Planejada",
        contentType: "Capítulo do índice analítico",
        visibility: "Interno com publicação após aprovação",
        acceptanceCriteria: null,
        sourceBase: PDF_ANALYTIC_SOURCE,
        structureStatus: "canonica",
        responsibleId: sectionResponsible.id,
      }).where(eq(activities.id, existing.id));
      canonicalParents.set(storedSection.id, { ...existing, responsibleId: sectionResponsible.id });
    } else {
      const created = await db.insert(activities).values({
        planCode: section.code,
        planSortOrder: section.sortOrder,
        title: section.title,
        description: section.officialDescription,
        planningSummary: section.officialDescription,
        planningStatus: "Planejada",
        contentType: "Capítulo do índice analítico",
        visibility: "Interno com publicação após aprovação",
        sourceBase: PDF_ANALYTIC_SOURCE,
        structureStatus: "canonica",
        sectionId: storedSection.id,
        responsibleId: sectionResponsible.id,
        dueAt: DEFAULT_PROJECT_END_AT,
        status: "pendente",
        progress: 0,
      }).returning({ id: activities.id });
      const id = created[0]?.id;
      if (!id) throw new Error(`Não foi possível criar o capítulo canônico ${section.code}.`);
      canonicalParents.set(storedSection.id, { id, responsibleId: sectionResponsible.id, startAt: null, dueAt: DEFAULT_PROJECT_END_AT });
    }
  }

  const currentActivities = await db.select().from(activities);
  const itemByCode = new Map(
    currentActivities
      .filter(activity => activity.detailCode)
      .map(activity => [activity.detailCode!, activity])
  );
  for (const item of PDF_ANALYTIC_ITEMS) {
    const section = sectionByCode.get(item.sectionCode);
    if (!section) throw new Error(`Seção do item ${item.detailCode} não encontrada.`);
    const parent = canonicalParents.get(section.id);
    if (!parent) throw new Error(`Capítulo do item ${item.detailCode} não encontrado.`);
    const existing = itemByCode.get(item.detailCode);
    const values = {
      parentActivityId: parent.id,
      detailSortOrder: item.detailSortOrder,
      title: item.title,
      description: item.title,
      planningSummary: item.title,
      planningStatus: "Planejada",
      contentType: "Item do índice analítico",
      visibility: "Interno com publicação após aprovação",
      sourceBase: PDF_ANALYTIC_SOURCE,
      structureStatus: "canonica" as const,
      sectionId: section.id,
    };
    if (existing) {
      await db.update(activities).set(values).where(eq(activities.id, existing.id));
    } else {
      await db.insert(activities).values({
        ...values,
        detailCode: item.detailCode,
        responsibleId: parent.responsibleId,
        startAt: parent.startAt,
        dueAt: parent.dueAt,
        status: "pendente",
        progress: 0,
      });
    }
  }
  await db.delete(activities).where(eq(activities.detailCode, "III.3.16"));
}

export async function ensureSeedData(explicitDb?: Awaited<ReturnType<typeof requireDb>>) {
  const db = explicitDb ?? (await requireDb());

  // 0. Ensure default local admin user exists
  await db
    .insert(users)
    .values({
      openId: "local_admin",
      name: "Administrador do Estudo",
      email: "admin@estudo.ufrj.br",
      role: "admin",
      appRole: "administrador",
      accessStatus: "ativo",
      loginMethod: "local",
    })
    .onConflictDoUpdate({
      target: users.openId,
      set: {
        name: "Administrador do Estudo",
        role: "admin",
        appRole: "administrador",
        accessStatus: "ativo",
      },
    });

  const settings = await db.select().from(projectSettings).limit(1);
  if (settings.length === 0) {
    await db.insert(projectSettings).values({
      name: "Relatório 1 — Indústria Naval: Diagnóstico e Perspectivas",
      projectStartAt: DEFAULT_PROJECT_START_AT,
      projectEndAt: DEFAULT_PROJECT_END_AT,
      timezone: DEFAULT_TIMEZONE,
    });
  }

  await syncStudySectionCatalog(db);

  // 1. Ensure all groups from TEAM_GROUP_SEED exist
  const existingGroups = await db.select().from(teamGroups);
  const groupByName = new Map(existingGroups.map(g => [g.name, g]));
  for (const groupSeed of TEAM_GROUP_SEED) {
    if (!groupByName.has(groupSeed.name)) {
      await db.insert(teamGroups).values({
        name: groupSeed.name,
        institution: groupSeed.institution,
      });
    }
  }

  const seededGroups = await db.select().from(teamGroups);
  const seededGroupByName = new Map(seededGroups.map(g => [g.name, g]));

  // 2. Ensure users exist and are provisioned for all team members
  const existingUsers = await db.select().from(users);
  const userByEmail = new Map(existingUsers.filter(u => u.email).map(u => [u.email!.trim().toLowerCase(), u]));
  const userByName = new Map(existingUsers.filter(u => u.name).map(u => [u.name!.trim().toLowerCase(), u]));
  const existingProvisions = await db.select().from(userAccessProvisions);
  const provisionByEmail = new Map(existingProvisions.filter(p => p.email).map(p => [p.email.trim().toLowerCase(), p]));
  const provisionByName = new Map(existingProvisions.filter(p => p.name).map(p => [p.name.trim().toLowerCase(), p]));

  for (const memberSeed of TEAM_SEED) {
    const emailNorm = memberSeed.email.trim().toLowerCase();
    const nameNorm = memberSeed.name.trim().toLowerCase();
    const openId = `seed_user_${emailNorm.replace(/[^a-zA-Z0-9_]/g, "_")}`;
    const role = memberSeed.appRole === "administrador" ? ("admin" as const) : ("user" as const);
    let userId: number;

    const userObj = userByEmail.get(emailNorm) || userByName.get(nameNorm);
    if (userObj) {
      userId = userObj.id;
      await db
        .update(users)
        .set({
          name: memberSeed.name,
          email: memberSeed.email,
          role,
          appRole: memberSeed.appRole,
          accessStatus: "ativo",
        })
        .where(eq(users.id, userObj.id));
    } else {
      const [insertedUser] = await db.insert(users).values({
        openId,
        name: memberSeed.name,
        email: memberSeed.email,
        loginMethod: "local",
        role,
        appRole: memberSeed.appRole,
        accessStatus: "ativo",
      }).returning({ id: users.id });
      userId = insertedUser.id;
      userByEmail.set(emailNorm, {
        id: userId,
        openId,
        name: memberSeed.name,
        email: memberSeed.email,
        passwordHash: null,
        loginMethod: "local",
        role,
        appRole: memberSeed.appRole,
        accessStatus: "ativo",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
      userByName.set(nameNorm, userByEmail.get(emailNorm)!);
    }

    const provObj = provisionByEmail.get(emailNorm) || provisionByName.get(nameNorm);
    if (provObj) {
      await db
        .update(userAccessProvisions)
        .set({
          name: memberSeed.name,
          email: memberSeed.email,
          role,
          appRole: memberSeed.appRole,
          status: "ativado",
          userId,
        })
        .where(eq(userAccessProvisions.id, provObj.id));
    } else {
      await db.insert(userAccessProvisions).values({
        email: memberSeed.email,
        name: memberSeed.name,
        role,
        appRole: memberSeed.appRole,
        status: "ativado",
        userId,
      });
    }
  }

  const allUsersAfterSeed = await db.select().from(users);
  const userMapByEmail = new Map(allUsersAfterSeed.filter(u => u.email).map(u => [u.email!.trim().toLowerCase(), u]));
  const userMapByName = new Map(allUsersAfterSeed.filter(u => u.name).map(u => [u.name!.trim().toLowerCase(), u]));

  // 3. Ensure all members from TEAM_SEED exist and are updated with userId links
  const existingMembers = await db.select().from(teamMembers);
  const memberByName = new Map(existingMembers.filter(m => m.name).map(m => [m.name.trim().toLowerCase(), m]));
  const memberByEmail = new Map(existingMembers.filter(m => m.email).map(m => [m.email!.trim().toLowerCase(), m]));

  for (const memberSeed of TEAM_SEED) {
    const seedGroup = teamGroupForMember(memberSeed.name);
    const group = seedGroup ? seededGroupByName.get(seedGroup.name) : null;
    const targetRole = seedGroup?.coordinatorName === memberSeed.name ? ("coordenador" as const) : ("participante" as const);
    const targetActive = Boolean(seedGroup) || memberSeed.name === "Denise Cunha" || memberSeed.name === "Marcos Pedreira da Silva";
    const linkedUserId = userMapByEmail.get(memberSeed.email.trim().toLowerCase())?.id ?? userMapByName.get(memberSeed.name.trim().toLowerCase())?.id ?? null;

    const existing = memberByName.get(memberSeed.name.trim().toLowerCase()) || (memberSeed.email ? memberByEmail.get(memberSeed.email.trim().toLowerCase()) : null);
    if (existing) {
      await db
        .update(teamMembers)
        .set({
          userId: linkedUserId ?? existing.userId,
          title: memberSeed.title,
          institution: memberSeed.institution,
          email: memberSeed.email ?? existing.email,
          groupId: group?.id ?? existing.groupId,
          groupRole: targetRole,
          active: targetActive,
        })
        .where(eq(teamMembers.id, existing.id));
    } else {
      await db.insert(teamMembers).values({
        userId: linkedUserId,
        name: memberSeed.name,
        title: memberSeed.title,
        institution: memberSeed.institution,
        email: memberSeed.email,
        groupId: group?.id ?? null,
        groupRole: targetRole,
        active: targetActive,
      });
    }
  }

  // 4. Ensure all 36 team_group_memberships exist
  const existingMemberships = await db.select().from(teamGroupMemberships);
  const membershipKeySet = new Set(existingMemberships.map(m => `${m.groupId}:${m.teamMemberId}`));

  const allSeededMembers = await db.select().from(teamMembers);
  const memberByNameMap = new Map(allSeededMembers.map(m => [m.name, m]));

  for (const item of GROUP_MEMBERSHIPS_SEED) {
    const group = seededGroupByName.get(item.groupName);
    const member = memberByNameMap.get(item.memberName);
    if (!group || !member) continue;

    const key = `${group.id}:${member.id}`;
    if (!membershipKeySet.has(key)) {
      await db.insert(teamGroupMemberships).values({
        groupId: group.id,
        teamMemberId: member.id,
        membershipSource: "matriz_xlsm",
        sourceDocument: "Atividades-Grupos.xlsm",
      });
      membershipKeySet.add(key);
    }
  }

  await syncPdfAnalyticCatalog(db);
  await syncIdentifiedInterfaces(db);
  await syncLibraryImportPlan(db);
}

export async function syncLibraryImportPlan(db: Awaited<ReturnType<typeof requireDb>>) {
  const planPath = path.resolve(process.cwd(), "drive-library-import-plan.json");
  if (!fs.existsSync(planPath)) return;

  const count = await db.select({ count: sql<number>`count(*)` }).from(libraryItems);
  if (Number(count[0]?.count ?? 0) > 0) {
    return;
  }

  const planData = JSON.parse(fs.readFileSync(planPath, "utf-8"));
  if (!Array.isArray(planData.entries) || planData.entries.length === 0) return;

  const sections = await db.select().from(studySections);
  const sectionMap = new Map(sections.map(s => [s.code, s.id]));

  const adminUsers = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  const fallbackUser = (await db.select().from(users).limit(1))[0];
  const uploadedById = adminUsers[0]?.id ?? fallbackUser?.id ?? 1;

  const rows = planData.entries.map((entry: any) => ({
    title: entry.title,
    description: entry.description,
    theme: entry.theme,
    sectionId: entry.sectionCode ? (sectionMap.get(entry.sectionCode) ?? null) : null,
    itemType: "link" as const,
    externalUrl: entry.externalUrl,
    fileName: entry.fileName,
    mimeType: entry.mimeType,
    fileSize: entry.fileSize,
    uploadedBy: uploadedById,
  }));

  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    await db.insert(libraryItems).values(chunk).onConflictDoNothing();
  }
  console.log(`[Database] Seeded ${rows.length} library reference items.`);
}

export async function syncIdentifiedInterfaces(db: Awaited<ReturnType<typeof requireDb>>) {
  const [
    existingInterfaces,
    existingGroups,
    existingMembers,
    existingSections,
    existingActivities,
    existingUsers,
  ] = await Promise.all([
    db.select().from(coordinationInterfaces),
    db.select().from(teamGroups),
    db.select().from(teamMembers),
    db.select().from(studySections),
    db.select().from(activities),
    db.select().from(users),
  ]);

  const groupByName = new Map(existingGroups.map(g => [g.name, g]));
  const groupByCode = new Map(
    existingGroups.map(g => {
      const code = g.name.split(" ")[0];
      return [code, g];
    })
  );

  const memberByName = new Map(existingMembers.map(m => [m.name, m]));
  const sectionByCode = new Map(existingSections.map(s => [s.code, s]));
  const existingByTitle = new Map(existingInterfaces.map(i => [i.title, i]));

  const adminUser =
    existingUsers.find(u => u.appRole === "administrador" || u.role === "admin") ??
    existingUsers[0];

  if (!adminUser) return;

  for (const seed of IDENTIFIED_INTERFACES_SEED) {
    const leadGroup =
      groupByName.get(seed.leadGroupName) ??
      groupByCode.get(seed.groupCodes[0]);

    if (!leadGroup) continue;

    let coordinatorMember = existingMembers.find(
      m => m.groupId === leadGroup.id && m.groupRole === "coordenador"
    );

    if (!coordinatorMember) {
      const seedGroup = TEAM_GROUP_SEED.find(g => g.name === leadGroup.name);
      if (seedGroup?.coordinatorName) {
        coordinatorMember = memberByName.get(seedGroup.coordinatorName);
      }
    }

    if (!coordinatorMember) {
      coordinatorMember =
        memberByName.get("Floriano Carlos Martins Pires Jr.") ??
        existingMembers[0];
    }

    if (!coordinatorMember) continue;

    const section = seed.sectionCode ? sectionByCode.get(seed.sectionCode) : null;

    const activity = existingActivities.find(a => {
      if (seed.detailCode && (a.detailCode === seed.detailCode || a.planCode === seed.detailCode)) {
        return true;
      }
      if (seed.rawSectionTitle && a.title.includes(seed.rawSectionTitle)) {
        return true;
      }
      return false;
    });

    let interfaceId: number;
    const existing = existingByTitle.get(seed.title);

    if (existing) {
      interfaceId = existing.id;
    } else {
      const [insertedInterface] = await db.insert(coordinationInterfaces).values({
        title: seed.title,
        description: seed.description,
        interfaceType: seed.interfaceType,
        responsibleId: coordinatorMember.id,
        priority: "média",
        blockingClass: "não prioritária",
        status: "identificada",
        createdBy: adminUser.id,
      }).returning({ id: coordinationInterfaces.id });
      interfaceId = insertedInterface.id;
      existingByTitle.set(seed.title, {
        id: interfaceId,
        title: seed.title,
      } as any);
    }

    // Ensure interface_groups
    const existingGroupsForInterface = await db
      .select()
      .from(interfaceGroups)
      .where(eq(interfaceGroups.interfaceId, interfaceId));
    const linkedGroupIds = new Set(existingGroupsForInterface.map(g => g.groupId));

    if (!linkedGroupIds.has(leadGroup.id)) {
      await db.insert(interfaceGroups).values({
        interfaceId,
        groupId: leadGroup.id,
        role: "responsável",
      });
      linkedGroupIds.add(leadGroup.id);
    }

    for (const code of seed.groupCodes.slice(1)) {
      const group = groupByCode.get(code) ?? groupByName.get(code);
      if (group && !linkedGroupIds.has(group.id)) {
        await db.insert(interfaceGroups).values({
          interfaceId,
          groupId: group.id,
          role: "envolvido",
        });
        linkedGroupIds.add(group.id);
      }
    }

    // Ensure interface_sections
    if (section) {
      const existingSectionsForInterface = await db
        .select()
        .from(interfaceSections)
        .where(
          and(
            eq(interfaceSections.interfaceId, interfaceId),
            eq(interfaceSections.sectionId, section.id)
          )
        );
      if (existingSectionsForInterface.length === 0) {
        await db.insert(interfaceSections).values({
          interfaceId,
          sectionId: section.id,
          role: "origem",
        });
      }
    }

    // Ensure interface_activities
    if (activity) {
      const existingActivitiesForInterface = await db
        .select()
        .from(interfaceActivities)
        .where(
          and(
            eq(interfaceActivities.interfaceId, interfaceId),
            eq(interfaceActivities.activityId, activity.id)
          )
        );
      if (existingActivitiesForInterface.length === 0) {
        await db.insert(interfaceActivities).values({
          interfaceId,
          activityId: activity.id,
          role: "origem",
        });
      }
    }
  }
}

export async function listSections() {
  const db = await requireDb();
  return db.select().from(studySections).orderBy(asc(studySections.sortOrder));
}

export async function listTeamMembers() {
  const db = await requireDb();
  return db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      groupId: teamMembers.groupId,
      groupRole: teamMembers.groupRole,
      name: teamMembers.name,
      title: teamMembers.title,
      institution: teamMembers.institution,
      email: teamMembers.email,
      whatsappPhone: teamMembers.whatsappPhone,
      whatsappOptIn: teamMembers.whatsappOptIn,
      active: teamMembers.active,
      groupName: teamGroups.name,
      groupInstitution: teamGroups.institution,
      groupActive: teamGroups.active,
      createdAt: teamMembers.createdAt,
      updatedAt: teamMembers.updatedAt,
    })
    .from(teamMembers)
    .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id))
    .orderBy(
      desc(teamMembers.active),
      asc(teamGroups.name),
      asc(teamMembers.groupRole),
      asc(teamMembers.name)
    );
}

export async function getTeamMemberByUserId(userId: number) {
  const db = await requireDb();
  const rows = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      groupId: teamMembers.groupId,
      groupRole: teamMembers.groupRole,
      name: teamMembers.name,
      title: teamMembers.title,
      institution: teamMembers.institution,
      email: teamMembers.email,
      active: teamMembers.active,
      groupName: teamGroups.name,
    })
    .from(teamMembers)
    .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id))
    .where(eq(teamMembers.userId, userId))
    .limit(1);
  if (rows[0]) return rows[0];

  const userRows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (userRows[0]?.email) {
    const emailRows = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        groupId: teamMembers.groupId,
        groupRole: teamMembers.groupRole,
        name: teamMembers.name,
        title: teamMembers.title,
        institution: teamMembers.institution,
        email: teamMembers.email,
        active: teamMembers.active,
        groupName: teamGroups.name,
      })
      .from(teamMembers)
      .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id))
      .where(eq(teamMembers.email, userRows[0].email))
      .limit(1);
    if (emailRows[0]) {
      try {
        await db
          .update(teamMembers)
          .set({ userId })
          .where(eq(teamMembers.id, emailRows[0].id));
      } catch {}
      return { ...emailRows[0], userId };
    }
  }
  return null;
}

export async function hasCurrentActivityDelegation(teamMemberId: number) {
  const db = await requireDb();
  const rows = await db
    .select({ id: activityAllocations.id })
    .from(activityAllocations)
    .where(
      and(
        eq(activityAllocations.teamMemberId, teamMemberId),
        eq(activityAllocations.allocationType, "vigente")
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function listTeamGroups() {
  const db = await requireDb();
  const [groups, members, assignedSections, kickoffMemberships] = await Promise.all([
    db
      .select()
      .from(teamGroups)
      .orderBy(desc(teamGroups.active), asc(teamGroups.name)),
    listTeamMembers(),
    db
      .select({
        groupId: teamMembers.groupId,
        activityId: activities.id,
        planCode: activities.planCode,
        planSortOrder: activities.planSortOrder,
        activityTitle: activities.title,
        planningSummary: activities.planningSummary,
        portalDeliverable: activities.portalDeliverable,
        status: activities.status,
        startAt: activities.startAt,
        dueAt: activities.dueAt,
        sectionId: studySections.id,
        sectionCode: studySections.code,
        sectionTitle: studySections.title,
        officialDescription: studySections.officialDescription,
        sortOrder: studySections.sortOrder,
      })
      .from(activities)
      .innerJoin(teamMembers, eq(activities.responsibleId, teamMembers.id))
      .innerJoin(studySections, eq(activities.sectionId, studySections.id))
      .where(eq(activities.structureStatus, "canonica"))
      .orderBy(asc(studySections.sortOrder), asc(activities.planSortOrder)),
    db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        groupId: teamGroupMemberships.groupId,
        primaryGroupId: teamMembers.groupId,
        name: teamMembers.name,
        title: teamMembers.title,
        institution: teamMembers.institution,
        email: teamMembers.email,
        active: teamMembers.active,
        membershipSource: teamGroupMemberships.membershipSource,
        sourceDocument: teamGroupMemberships.sourceDocument,
      })
      .from(teamGroupMemberships)
      .innerJoin(teamMembers, eq(teamGroupMemberships.teamMemberId, teamMembers.id))
      .orderBy(asc(teamMembers.name)),
  ]);

  return groups
    .map(group => {
      const scoped = members.filter(member => member.groupId === group.id);
      return {
        ...group,
        coordinator:
          scoped.find(member => member.groupRole === "coordenador") ?? null,
        participants: scoped.filter(
          member => member.groupRole === "participante"
        ),
        assignedSections: assignedSections.filter(
          section => section.groupId === group.id
        ),
        kickoffParticipants: kickoffMemberships.filter(
          membership => membership.groupId === group.id
        ),
        memberCount: scoped.length,
        activeMemberCount: scoped.filter(member => member.active).length,
      };
    })
    .sort(
      (left, right) =>
        TEAM_GROUP_SEED.findIndex(group => group.name === left.name) -
        TEAM_GROUP_SEED.findIndex(group => group.name === right.name)
    );
}

export async function listActivities() {
  const db = await requireDb();
  const [activityRows, allocationRows, reviewerRows, submissionRows, reviewCommentRows, milestoneRows, evidenceLinkRows, assignmentUserRows] =
    await Promise.all([
    db
      .select({
        id: activities.id,
        title: activities.title,
        description: activities.description,
        planCode: activities.planCode,
        planSortOrder: activities.planSortOrder,
        parentActivityId: activities.parentActivityId,
        detailCode: activities.detailCode,
        detailSortOrder: activities.detailSortOrder,
        planningSummary: activities.planningSummary,
        planningResponsible: activities.planningResponsible,
        planningSupport: activities.planningSupport,
        portalDeliverable: activities.portalDeliverable,
        dependencies: activities.dependencies,
        keywords: activities.keywords,
        planningStatus: activities.planningStatus,
        contentType: activities.contentType,
        visibility: activities.visibility,
        acceptanceCriteria: activities.acceptanceCriteria,
        sourceBase: activities.sourceBase,
        startAt: activities.startAt,
        dueAt: activities.dueAt,
        editorialDeliveryAt: activities.editorialDeliveryAt,
        bndesDeliveryAt: activities.bndesDeliveryAt,
        documentStatus: activities.documentStatus,
        status: activities.status,
        progress: activities.progress,
        sectionId: studySections.id,
        sectionCode: studySections.code,
        sectionTitle: studySections.title,
        officialDescription: studySections.officialDescription,
        responsibleId: teamMembers.id,
        responsibleName: teamMembers.name,
        responsibleTitle: teamMembers.title,
        institution: teamMembers.institution,
        responsibleGroupId: teamMembers.groupId,
        responsibleRole: teamMembers.groupRole,
        groupName: teamGroups.name,
        whatsappPhone: teamMembers.whatsappPhone,
        whatsappOptIn: teamMembers.whatsappOptIn,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
      })
      .from(activities)
      .innerJoin(studySections, eq(activities.sectionId, studySections.id))
      .innerJoin(teamMembers, eq(activities.responsibleId, teamMembers.id))
      .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id))
      .where(eq(activities.structureStatus, "canonica"))
      .orderBy(
        asc(studySections.sortOrder),
        asc(sql`COALESCE(${activities.parentActivityId}, ${activities.id})`),
        asc(sql`CASE WHEN ${activities.parentActivityId} IS NULL THEN 0 ELSE 1 END`),
        asc(activities.detailSortOrder),
        asc(activities.planSortOrder),
        asc(activities.dueAt)
      ),
    db
      .select({
        id: activityAllocations.id,
        activityId: activityAllocations.activityId,
        teamMemberId: activityAllocations.teamMemberId,
        allocatedHours: activityAllocations.allocatedHours,
        responsibility: activityAllocations.responsibility,
        isExecutionLead: activityAllocations.isExecutionLead,
        assignedBy: activityAllocations.assignedBy,
        allocationType: activityAllocations.allocationType,
        note: activityAllocations.note,
        createdAt: activityAllocations.createdAt,
        memberUserId: teamMembers.userId,
        memberName: teamMembers.name,
        memberTitle: teamMembers.title,
        institution: teamMembers.institution,
        groupId: teamMembers.groupId,
        groupRole: teamMembers.groupRole,
        active: teamMembers.active,
      })
      .from(activityAllocations)
      .innerJoin(
        teamMembers,
        eq(activityAllocations.teamMemberId, teamMembers.id)
      )
      .orderBy(
        desc(activityAllocations.isExecutionLead),
        asc(teamMembers.name)
      ),
    db
      .select({
        id: activityReviewers.id,
        activityId: activityReviewers.activityId,
        teamMemberId: activityReviewers.teamMemberId,
        reviewerName: teamMembers.name,
        reviewerTitle: teamMembers.title,
        institution: teamMembers.institution,
        groupId: teamMembers.groupId,
        groupName: teamGroups.name,
        userId: teamMembers.userId,
        assignedBy: activityReviewers.assignedBy,
        active: teamMembers.active,
        status: activityReviewers.status,
        decisionNote: activityReviewers.decisionNote,
        decidedAt: activityReviewers.decidedAt,
        createdAt: activityReviewers.createdAt,
      })
      .from(activityReviewers)
      .innerJoin(
        teamMembers,
        eq(activityReviewers.teamMemberId, teamMembers.id)
      )
      .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id))
      .orderBy(asc(teamMembers.name)),
    db
      .select({
        id: reviewSubmissions.id,
        activityId: reviewSubmissions.activityId,
        materialId: reviewSubmissions.materialId,
        materialTitle: productionMaterials.title,
        revisionId: reviewSubmissions.revisionId,
        revisionNumber: materialRevisions.revisionNumber,
        status: reviewSubmissions.status,
        message: reviewSubmissions.message,
        submittedAt: reviewSubmissions.submittedAt,
        completedAt: reviewSubmissions.completedAt,
      })
      .from(reviewSubmissions)
      .innerJoin(
        productionMaterials,
        eq(reviewSubmissions.materialId, productionMaterials.id)
      )
      .innerJoin(
        materialRevisions,
        eq(reviewSubmissions.revisionId, materialRevisions.id)
      )
      .orderBy(desc(reviewSubmissions.submittedAt)),
    db
      .select({
        submissionId: materialComments.submissionId,
        resolvedAt: materialComments.resolvedAt,
        status: materialComments.status,
      })
      .from(materialComments),
    db
      .select({
        id: activityMilestones.id,
        activityId: activityMilestones.activityId,
        title: activityMilestones.title,
        description: activityMilestones.description,
        dueAt: activityMilestones.dueAt,
        status: activityMilestones.status,
        sortOrder: activityMilestones.sortOrder,
        createdAt: activityMilestones.createdAt,
      })
      .from(activityMilestones)
      .orderBy(asc(activityMilestones.dueAt), asc(activityMilestones.sortOrder)),
    db
      .select({
        id: activityEvidenceLinks.id,
        activityId: activityEvidenceLinks.activityId,
        label: activityEvidenceLinks.label,
        url: activityEvidenceLinks.url,
        linkType: activityEvidenceLinks.linkType,
        createdAt: activityEvidenceLinks.createdAt,
      })
      .from(activityEvidenceLinks)
      .orderBy(desc(activityEvidenceLinks.createdAt)),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  const coordinationItems = await listCoordinationInterfaces();
  const assignmentUserNames = new Map(assignmentUserRows.map(user => [user.id, user.name ?? "Administrador"]));

  return activityRows.map(activity => {
    const allAllocations = allocationRows.filter(
      allocation => allocation.activityId === activity.id
    );
    const allocations = allAllocations.filter(
      allocation => allocation.allocationType === "vigente"
    );
    const historicalAllocations = allAllocations.filter(
      allocation => allocation.allocationType === "histórica"
    );
    const reviewers = reviewerRows.filter(
      reviewer =>
        reviewer.activityId === activity.id &&
        !allocations.some(
          allocation => allocation.teamMemberId === reviewer.teamMemberId
        )
    );
    const submissions = submissionRows.filter(
      submission => submission.activityId === activity.id
    );
    const activeSubmission =
      submissions.find(submission => submission.status !== "substituído") ??
      null;
    return {
      ...activity,
      allocations: allocations.map(allocation => ({ ...allocation, assignedByName: allocation.assignedBy ? assignmentUserNames.get(allocation.assignedBy) ?? "Administrador" : "Registro histórico" })),
      historicalAllocations,
      reviewers: reviewers.map(reviewer => ({ ...reviewer, assignedByName: assignmentUserNames.get(reviewer.assignedBy) ?? "Administrador" })),
      milestones: milestoneRows.filter(milestone => milestone.activityId === activity.id),
      evidenceLinks: evidenceLinkRows.filter(link => link.activityId === activity.id),
      submissions,
      activeSubmission: activeSubmission
        ? {
            ...activeSubmission,
            pendingCommentCount: reviewCommentRows.filter(
              comment =>
                comment.submissionId === activeSubmission.id &&
                comment.status !== "resolvido" &&
                !comment.resolvedAt
            ).length,
          }
        : null,
      interfaces: coordinationItems.filter(
        item =>
          item.activities.some(act => act.activityId === activity.id) ||
          item.sections.some(section => section.sectionId === activity.sectionId)
      ),
      totalAllocatedHours: totalAllocatedHours(allocations),
      historicalAllocatedHours: totalAllocatedHours(historicalAllocations),
    };
  });
}

export async function getActivity(id: number) {
  const db = await requireDb();
  const [rows, leadershipRows, members, userRows, fieldworkRows, reviewChecklist, allInterfaces] = await Promise.all([
    listActivities(),
    db.select().from(activityLeadershipEvents).where(eq(activityLeadershipEvents.activityId, id)).orderBy(desc(activityLeadershipEvents.createdAt)),
    listTeamMembers(),
    db.select({ id: users.id, name: users.name }).from(users),
    listFieldworkActivities(),
    listActivityReviewChecklist(id),
    listCoordinationInterfaces(),
  ]);
  const activity = rows.find(activity => activity.id === id);
  if (!activity) return undefined;

  const relatedInterfaces = allInterfaces.filter(item =>
    item.activities.some(a => a.activityId === activity.id) ||
    item.sections.some(s => s.sectionId === activity.sectionId) ||
    (activity.responsibleGroupId && item.groups.some(g => g.groupId === activity.responsibleGroupId))
  );

  return {
    ...activity,
    leadershipHistory: leadershipRows.map(event => ({
      ...event,
      previousLeaderName: members.find(member => member.id === event.previousTeamMemberId)?.name ?? "Não informado",
      nextLeaderName: members.find(member => member.id === event.nextTeamMemberId)?.name ?? "Não informado",
      assignedByName: userRows.find(user => user.id === event.assignedBy)?.name ?? "Registro administrativo",
    })),
    executionSteps:
      activity.parentActivityId === null
        ? rows.filter(step => step.parentActivityId === activity.id)
        : [],
    relatedFieldwork: fieldworkRows.filter(item => item.relatedActivityId === activity.id),
    relatedInterfaces,
    reviewChecklist,
  };
}

export async function listActivityStatusReport() {
  const db = await requireDb();
  const [activityRows, checklistRows] = await Promise.all([
    listActivities(),
    db.select().from(reviewChecklistItems),
  ]);
  const checklistByActivity = new Map<number, typeof checklistRows>();
  checklistRows.forEach(item => {
    checklistByActivity.set(item.activityId, [
      ...(checklistByActivity.get(item.activityId) ?? []),
      item,
    ]);
  });
  const activityById = new Map(activityRows.map(activity => [activity.id, activity]));

  return activityRows.map(activity => {
    const checklist = checklistByActivity.get(activity.id) ?? [];
    const completedChecklistItems = checklist.filter(item => item.status === "concluído").length;
    const blockedChecklistItems = checklist.filter(item => item.status === "bloqueado").length;
    const executionResponsibles = activity.allocations.map(allocation => ({
      id: allocation.teamMemberId,
      name: allocation.memberName,
      isExecutionLead: allocation.isExecutionLead,
      allocatedHours: allocation.allocatedHours,
    }));
    const reviewers = activity.reviewers.map(reviewer => ({
      id: reviewer.teamMemberId,
      name: reviewer.reviewerName,
      status: reviewer.status,
    }));
    const parent = activity.parentActivityId
      ? activityById.get(activity.parentActivityId)
      : null;
    return {
      id: activity.id,
      parentActivityId: activity.parentActivityId,
      parentActivityTitle: parent?.title ?? null,
      sectionCode: activity.sectionCode,
      sectionTitle: activity.sectionTitle,
      planCode: activity.planCode,
      detailCode: activity.detailCode,
      title: activity.title,
      status: activity.status,
      progress: activity.progress,
      startAt: activity.startAt,
      dueAt: activity.dueAt,
      coordinator: { id: activity.responsibleId, name: activity.responsibleName },
      executionResponsibles,
      reviewers,
      totalAllocatedHours: activity.totalAllocatedHours,
      checklist: {
        total: checklist.length,
        completed: completedChecklistItems,
        pending: checklist.filter(item => item.status === "pendente" || item.status === "em andamento").length,
        blocked: blockedChecklistItems,
        items: checklist.map(item => ({
          scope: item.scope,
          title: item.title,
          status: item.status,
          dueAt: item.dueAt,
        })),
      },
    };
  });
}

export async function listFieldworkActivities() {
  const db = await requireDb();
  return db
    .select({
      id: fieldworkActivities.id,
      code: fieldworkActivities.code,
      title: fieldworkActivities.title,
      description: fieldworkActivities.description,
      category: fieldworkActivities.category,
      country: fieldworkActivities.country,
      location: fieldworkActivities.location,
      relatedActivityId: fieldworkActivities.relatedActivityId,
      relatedPlanCode: activities.planCode,
      relatedActivityTitle: activities.title,
      responsibleId: fieldworkActivities.responsibleId,
      responsibleName: teamMembers.name,
      groupId: fieldworkActivities.groupId,
      groupName: teamGroups.name,
      startAt: fieldworkActivities.startAt,
      dueAt: fieldworkActivities.dueAt,
      status: fieldworkActivities.status,
      createdAt: fieldworkActivities.createdAt,
      updatedAt: fieldworkActivities.updatedAt,
    })
    .from(fieldworkActivities)
    .leftJoin(
      activities,
      eq(fieldworkActivities.relatedActivityId, activities.id)
    )
    .leftJoin(
      teamMembers,
      eq(fieldworkActivities.responsibleId, teamMembers.id)
    )
    .leftJoin(teamGroups, eq(fieldworkActivities.groupId, teamGroups.id))
    .orderBy(asc(fieldworkActivities.code));
}

export async function getProjectSettings() {
  const db = await requireDb();
  return (await db.select().from(projectSettings).limit(1))[0];
}

export const REVIEW_CHECKLIST_TEMPLATE = [
  { scope: "seção", itemKey: "secao_texto_fontes", title: "Texto, fontes e referências da seção verificados" },
  { scope: "seção", itemKey: "secao_banco_evidencias", title: "Banco de dados e evidências da seção conferidos" },
  { scope: "seção", itemKey: "secao_interfaces", title: "Interfaces e escopos sobrepostos da seção tratados" },
  { scope: "capítulo", itemKey: "capitulo_coerencia", title: "Coerência, integração e aderência ao escopo do capítulo verificadas" },
  { scope: "capítulo", itemKey: "capitulo_encaminhamento", title: "Encaminhamento ao coordenador do tomo preparado" },
] as const;

const REVIEW_CHECKLIST_OFFSET_DAYS: Record<(typeof REVIEW_CHECKLIST_TEMPLATE)[number]["itemKey"], number> = {
  secao_texto_fontes: 21,
  secao_banco_evidencias: 14,
  secao_interfaces: 10,
  capitulo_coerencia: 7,
  capitulo_encaminhamento: 2,
};

type ChecklistScheduleActivity = {
  id: number;
  startAt: number | null;
  dueAt: number;
  editorialDeliveryAt?: number | null;
  responsibleId: number;
};

export function officialReviewChecklistDeadline(
  activity: Pick<ChecklistScheduleActivity, "startAt" | "dueAt" | "editorialDeliveryAt">,
  itemKey: (typeof REVIEW_CHECKLIST_TEMPLATE)[number]["itemKey"]
) {
  const deliveryAt = activity.editorialDeliveryAt ?? activity.dueAt;
  const calculated = deliveryAt - REVIEW_CHECKLIST_OFFSET_DAYS[itemKey] * 24 * 60 * 60 * 1000;
  return activity.startAt === null ? calculated : Math.max(activity.startAt, calculated);
}

export async function listActivityReviewChecklist(activityId: number) {
  const db = await requireDb();
  const [items, events, members, userRows] = await Promise.all([
    db.select().from(reviewChecklistItems).where(eq(reviewChecklistItems.activityId, activityId)).orderBy(asc(reviewChecklistItems.scope), asc(reviewChecklistItems.id)),
    db.select().from(reviewChecklistEvents).where(eq(reviewChecklistEvents.activityId, activityId)).orderBy(desc(reviewChecklistEvents.createdAt)),
    listTeamMembers(),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  const memberById = new Map(members.map(member => [member.id, member]));
  const userById = new Map(userRows.map(user => [user.id, user.name ?? "Registro administrativo"]));
  return {
    items: items.map(item => ({
      ...item,
      responsibleName: item.responsibleId ? memberById.get(item.responsibleId)?.name ?? "Integrante não identificado" : null,
      responsibleGroupName: item.responsibleId ? memberById.get(item.responsibleId)?.groupName ?? null : null,
      completedByName: item.completedBy ? userById.get(item.completedBy) ?? "Registro administrativo" : null,
    })),
    events: events.map(event => ({
      ...event,
      actorName: userById.get(event.actorId) ?? "Registro administrativo",
    })),
  };
}

export async function ensureActivityReviewChecklist(
  activity: ChecklistScheduleActivity,
  createdBy: number
) {
  const db = await requireDb();
  const existing = await db
    .select({ itemKey: reviewChecklistItems.itemKey })
    .from(reviewChecklistItems)
    .where(eq(reviewChecklistItems.activityId, activity.id));
  const existingKeys = new Set(existing.map(item => item.itemKey));
  const missing = REVIEW_CHECKLIST_TEMPLATE.filter(item => !existingKeys.has(item.itemKey));
  if (missing.length) {
    await db.insert(reviewChecklistItems).values(
      missing.map(item => ({
        activityId: activity.id,
        scope: item.scope,
        itemKey: item.itemKey,
        title: item.title,
        responsibleId: activity.responsibleId,
        dueAt: officialReviewChecklistDeadline(activity, item.itemKey),
        createdBy,
      }))
    );
  }
  return listActivityReviewChecklist(activity.id);
}

export async function applyOfficialReviewChecklistSchedule(
  activity: ChecklistScheduleActivity,
  actorId: number
) {
  const db = await requireDb();
  await ensureActivityReviewChecklist(activity, actorId);
  const checklist = await db
    .select()
    .from(reviewChecklistItems)
    .where(eq(reviewChecklistItems.activityId, activity.id));
  const templateKeys = new Set(REVIEW_CHECKLIST_TEMPLATE.map(item => item.itemKey));
  const changes = checklist
    .filter(item => templateKeys.has(item.itemKey as (typeof REVIEW_CHECKLIST_TEMPLATE)[number]["itemKey"]))
    .map(item => ({
      item,
      dueAt: officialReviewChecklistDeadline(
        activity,
        item.itemKey as (typeof REVIEW_CHECKLIST_TEMPLATE)[number]["itemKey"]
      ),
    }))
    .filter(({ item, dueAt }) => item.dueAt !== dueAt);

  for (const { item, dueAt } of changes) {
    await db
      .update(reviewChecklistItems)
      .set({ dueAt })
      .where(eq(reviewChecklistItems.id, item.id));
    await db.insert(reviewChecklistEvents).values({
      checklistItemId: item.id,
      activityId: activity.id,
      eventType: "prazo_alterado",
      summary: "Prazo recalculado conforme o cronograma oficial do capítulo.",
      actorId,
    });
  }

  return listActivityReviewChecklist(activity.id);
}

export async function getGovernanceOverview() {
  const db = await requireDb();
  const [approvalRows, assignmentRows, eventRows, projectEditorialRows, projectEditorialEventRows, members] = await Promise.all([
    db
      .select({
        id: projectGovernanceDecisions.id,
        decisionType: projectGovernanceDecisions.decisionType,
        decision: projectGovernanceDecisions.decision,
        note: projectGovernanceDecisions.note,
        decidedBy: projectGovernanceDecisions.decidedBy,
        decidedAt: projectGovernanceDecisions.decidedAt,
        decidedByName: users.name,
      })
      .from(projectGovernanceDecisions)
      .innerJoin(users, eq(projectGovernanceDecisions.decidedBy, users.id))
      .where(eq(projectGovernanceDecisions.decisionType, "implementacao_p0"))
      .orderBy(desc(projectGovernanceDecisions.decidedAt))
      .limit(1),
    db.select().from(tomeGovernanceAssignments),
    db.select().from(tomeGovernanceEvents).orderBy(desc(tomeGovernanceEvents.createdAt)),
    db.select().from(projectEditorialGovernance).orderBy(desc(projectEditorialGovernance.assignedAt)).limit(1),
    db.select().from(projectEditorialGovernanceEvents).orderBy(desc(projectEditorialGovernanceEvents.createdAt)),
    listTeamMembers(),
  ]);
  const memberById = new Map(members.map(member => [member.id, member]));
  const projectEditorial = projectEditorialRows[0] ?? null;
  return {
    p0Approval: approvalRows[0]
      ? { ...approvalRows[0], decidedByName: approvalRows[0].decidedByName ?? "Administrador" }
      : null,
    activeMembers: members.filter(member => member.active).map(member => ({
      id: member.id,
      name: member.name,
      title: member.title,
      institution: member.institution,
      groupName: member.groupName,
      groupRole: member.groupRole,
    })),
    projectEditorial: projectEditorial
      ? {
          coordinatorId: projectEditorial.coordinatorId,
          coordinatorName: memberById.get(projectEditorial.coordinatorId)?.name ?? "Não identificado",
          substituteId: projectEditorial.substituteId,
          substituteName: memberById.get(projectEditorial.substituteId)?.name ?? "Não identificado",
          assignedAt: projectEditorial.assignedAt,
          history: projectEditorialEventRows.map(event => ({
            ...event,
            previousCoordinatorName: event.previousCoordinatorId ? memberById.get(event.previousCoordinatorId)?.name ?? "Não identificado" : null,
            nextCoordinatorName: memberById.get(event.nextCoordinatorId)?.name ?? "Não identificado",
            previousSubstituteName: event.previousSubstituteId ? memberById.get(event.previousSubstituteId)?.name ?? "Não identificado" : null,
            nextSubstituteName: memberById.get(event.nextSubstituteId)?.name ?? "Não identificado",
          })),
        }
      : null,
    tomeAssignments: STUDY_TOMES.map(tome => {
      const assignment = assignmentRows.find(item => item.tome === tome) ?? null;
      const history = eventRows.filter(item => item.tome === tome).map(event => ({
        ...event,
        previousCoordinatorName: event.previousCoordinatorId ? memberById.get(event.previousCoordinatorId)?.name ?? "Não identificado" : null,
        nextCoordinatorName: event.nextCoordinatorId ? memberById.get(event.nextCoordinatorId)?.name ?? "Não identificado" : null,
        previousSubstituteName: event.previousSubstituteId ? memberById.get(event.previousSubstituteId)?.name ?? "Não identificado" : null,
        nextSubstituteName: event.nextSubstituteId ? memberById.get(event.nextSubstituteId)?.name ?? "Não identificado" : null,
      }));
      return {
        tome,
        coordinatorId: assignment?.coordinatorId ?? null,
        coordinatorName: assignment?.coordinatorId ? memberById.get(assignment.coordinatorId)?.name ?? "Não identificado" : null,
        substituteId: assignment?.substituteId ?? null,
        substituteName: assignment?.substituteId ? memberById.get(assignment.substituteId)?.name ?? "Não identificado" : null,
        assignedAt: assignment?.assignedAt ?? null,
        history,
      };
    }),
  };
}

export async function getDashboardData() {
  const db = await requireDb();
  const [settings, activityRows, sections, team, libraryCount, materialCount] =
    await Promise.all([
      getProjectSettings(),
      listActivities(),
      listSections(),
      listTeamMembers(),
      db.select({ count: sql<number>`count(*)` }).from(libraryItems),
      db.select({ count: sql<number>`count(*)` }).from(productionMaterials),
    ]);

  const parentActivities = activityRows.filter(
    activity => activity.parentActivityId == null
  );
  const executionSteps = activityRows.filter(
    activity => activity.parentActivityId != null
  );

  const bySection = sections.map(section => {
    const parents = parentActivities.filter(item => item.sectionId === section.id);
    const steps = executionSteps.filter(item => item.sectionId === section.id);
    const tracked = steps.length ? steps : parents;
    const progress = tracked.length
      ? Math.round(
          tracked.reduce((sum, item) => sum + item.progress, 0) / tracked.length
        )
      : 0;
    return {
      ...section,
      primaryActivityId: parents[0]?.id ?? null,
      progress,
      total: parents.length,
      subitemCount: steps.length,
      concluded: tracked.filter(item => item.status === "concluído").length,
      delayed: tracked.filter(item => item.status === "atrasado").length,
    };
  });

  const counts = {
    total: parentActivities.length,
    pending: parentActivities.filter(item => item.status === "pendente").length,
    inProgress: parentActivities.filter(item => item.status === "em andamento").length,
    concluded: parentActivities.filter(item => item.status === "concluído").length,
    delayed: parentActivities.filter(item => item.status === "atrasado").length,
  };

  const overallProgress = counts.total
    ? Math.round(
        parentActivities.reduce((sum, item) => sum + item.progress, 0) / counts.total
      )
    : 0;

  const tomeDefinitions = Array.from(
    new Map<string, { tome: string; title: string }>(
      PDF_ANALYTIC_SECTIONS.map(section => [
        section.tome,
        { tome: section.tome, title: section.tomeTitle || STUDY_TOME_TITLES[section.tome as keyof typeof STUDY_TOME_TITLES] || section.tome },
      ])
    ).values()
  );
  const tomeBySectionCode = new Map<string, string>(
    PDF_ANALYTIC_SECTIONS.map(section => [section.code, section.tome])
  );
  const byTome = tomeDefinitions.map(definition => {
    const tomeSections = bySection.filter(
      section => tomeBySectionCode.get(section.code) === definition.tome
    );
    const tomeSectionIds = new Set(tomeSections.map(section => section.id));
    const tomeParents = parentActivities.filter(item => tomeSectionIds.has(item.sectionId));
    const tomeSteps = executionSteps.filter(item => tomeSectionIds.has(item.sectionId));
    const tracked = tomeSteps.length ? tomeSteps : tomeParents;
    const active = tracked.filter(item => item.status !== "concluído");
    return {
      ...definition,
      chapterCount: tomeSections.length,
      parentCount: tomeParents.length,
      stepCount: tomeSteps.length,
      progress: tracked.length
        ? Math.round(tracked.reduce((sum, item) => sum + item.progress, 0) / tracked.length)
        : 0,
      concluded: tracked.filter(item => item.status === "concluído").length,
      delayed: tracked.filter(item => item.status === "atrasado").length,
      open: active.length,
      nextDueAt: active.sort((left, right) => left.dueAt - right.dueAt)[0]?.dueAt ?? null,
    };
  });

  return {
    settings,
    counts,
    hierarchy: {
      sectionCount: sections.length,
      parentCount: parentActivities.length,
      stepCount: executionSteps.length,
      totalCount: activityRows.length,
    },
    overallProgress,
    bySection,
    byTome,
    upcoming: parentActivities
      .filter(item => item.status !== "concluído")
      .sort((left, right) => left.dueAt - right.dueAt)
      .slice(0, 6),
    teamCount: team.filter(member => member.active).length,
    libraryCount: Number(libraryCount[0]?.count ?? 0),
    materialCount: Number(materialCount[0]?.count ?? 0),
  };
}

const DOCUMENT_WORKFLOW_STAGES = [
  { key: "planejada", label: "Planejada", stage: "Preparação" },
  { key: "em elaboração", label: "Em elaboração", stage: "Execução" },
  { key: "submetida à revisão da seção", label: "Submetida à revisão", stage: "Revisão da seção" },
  { key: "em revisão da seção", label: "Em revisão da seção", stage: "Revisão da seção" },
  { key: "ajustes solicitados", label: "Ajustes solicitados", stage: "Revisão da seção" },
  { key: "revisada pela seção", label: "Revisada pela seção", stage: "Consolidação" },
  { key: "consolidada no capítulo", label: "Consolidada no capítulo", stage: "Consolidação" },
  { key: "em revisão do tomo", label: "Em revisão do tomo", stage: "Aprovação" },
  { key: "aprovada no tomo", label: "Aprovada no tomo", stage: "Aprovação" },
  { key: "em revisão do projeto", label: "Em revisão do projeto", stage: "Aprovação" },
  { key: "aprovada para documentação final", label: "Aprovada para documentação final", stage: "Conclusão" },
] as const;

/** KPIs do funil documental: capítulos e seções canônicas, sem itens arquivados. */
export async function getDocumentWorkflowKpis() {
  const db = await requireDb();
  const [documentRows, priorityInterfaceRows] = await Promise.all([
    db
      .select({
        id: activities.id,
        parentActivityId: activities.parentActivityId,
        documentStatus: activities.documentStatus,
      })
      .from(activities)
      .where(eq(activities.structureStatus, "canonica")),
    db
      .select({ id: coordinationInterfaces.id })
      .from(coordinationInterfaces)
      .where(
        and(
          eq(coordinationInterfaces.blockingClass, "prioritária"),
          sql`${coordinationInterfaces.status} <> 'resolvida'`
        )
      ),
  ]);

  const countsByStatus = new Map<string, { chapters: number; sections: number }>();
  for (const document of documentRows) {
    const status = document.documentStatus;
    const current = countsByStatus.get(status) ?? { chapters: 0, sections: 0 };
    if (document.parentActivityId == null) current.chapters += 1;
    else current.sections += 1;
    countsByStatus.set(status, current);
  }

  const stages = DOCUMENT_WORKFLOW_STAGES.map(item => {
    const count = countsByStatus.get(item.key) ?? { chapters: 0, sections: 0 };
    return {
      ...item,
      chapters: count.chapters,
      sections: count.sections,
      total: count.chapters + count.sections,
    };
  });

  const chapters = documentRows.filter(item => item.parentActivityId == null).length;
  const sections = documentRows.length - chapters;
  const concluded = stages.find(item => item.key === "aprovada para documentação final")?.total ?? 0;

  return {
    totalDocuments: documentRows.length,
    chapters,
    sections,
    concluded,
    inProgress: documentRows.length - concluded,
    priorityInterfaceBlockers: priorityInterfaceRows.length,
    stages,
    updatedAt: new Date().toISOString(),
  };
}

export async function listLibraryItems(filters?: LibraryFilters) {
  const db = await requireDb();
  const normalized = normalizeLibraryFilters(filters);
  const conditions = [];
  if (normalized.search) {
    const term = `%${normalized.search}%`;
    conditions.push(
      or(
        like(libraryItems.title, term),
        like(libraryItems.description, term),
        like(libraryItems.theme, term)
      )
    );
  }
  if (normalized.theme) {
    conditions.push(eq(libraryItems.theme, normalized.theme));
  }
  if (normalized.sectionId) {
    conditions.push(eq(libraryItems.sectionId, normalized.sectionId));
  }

  return db
    .select({
      id: libraryItems.id,
      title: libraryItems.title,
      description: libraryItems.description,
      theme: libraryItems.theme,
      itemType: libraryItems.itemType,
      externalUrl: libraryItems.externalUrl,
      fileName: libraryItems.fileName,
      mimeType: libraryItems.mimeType,
      fileSize: libraryItems.fileSize,
      storageUrl: libraryItems.storageUrl,
      sectionId: libraryItems.sectionId,
      sectionCode: studySections.code,
      sectionTitle: studySections.title,
      createdAt: libraryItems.createdAt,
    })
    .from(libraryItems)
    .leftJoin(studySections, eq(libraryItems.sectionId, studySections.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(libraryItems.createdAt));
}

export async function getLibraryStatistics() {
  const db = await requireDb();
  const [totalCount, linkCount, fileCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(libraryItems),
    db.select({ count: sql<number>`count(*)` }).from(libraryItems).where(eq(libraryItems.itemType, "link")),
    db.select({ count: sql<number>`count(*)` }).from(libraryItems).where(eq(libraryItems.itemType, "arquivo")),
  ]);
  return {
    total: Number(totalCount[0]?.count ?? 0),
    links: Number(linkCount[0]?.count ?? 0),
    files: Number(fileCount[0]?.count ?? 0),
  };
}

export async function listProductionMaterials() {
  const db = await requireDb();
  const materials = await db
    .select({
      id: productionMaterials.id,
      title: productionMaterials.title,
      description: productionMaterials.description,
      activityId: productionMaterials.activityId,
      activityTitle: activities.title,
      responsibleId: activities.responsibleId,
      responsibleGroupId: teamMembers.groupId,
      responsibleGroupName: teamGroups.name,
      reviewStatus: productionMaterials.reviewStatus,
      currentRevision: productionMaterials.currentRevision,
      sectionId: productionMaterials.sectionId,
      sectionCode: studySections.code,
      sectionTitle: studySections.title,
      authorId: users.id,
      authorName: users.name,
      createdAt: productionMaterials.createdAt,
      updatedAt: productionMaterials.updatedAt,
    })
    .from(productionMaterials)
    .innerJoin(studySections, eq(productionMaterials.sectionId, studySections.id))
    .innerJoin(users, eq(productionMaterials.createdBy, users.id))
    .leftJoin(activities, eq(productionMaterials.activityId, activities.id))
    .leftJoin(teamMembers, eq(activities.responsibleId, teamMembers.id))
    .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id))
    .orderBy(desc(productionMaterials.updatedAt));

  const [revisions, comments, reviewers, submissions, decisions, allUsers] =
    await Promise.all([
    db
      .select()
      .from(materialRevisions)
      .orderBy(desc(materialRevisions.revisionNumber)),
    db
      .select({
        id: materialComments.id,
        materialId: materialComments.materialId,
        revisionId: materialComments.revisionId,
        submissionId: materialComments.submissionId,
        content: materialComments.content,
        commentType: materialComments.commentType,
        status: materialComments.status,
        implementationNote: materialComments.implementationNote,
        implementedAt: materialComments.implementedAt,
        implementedBy: materialComments.implementedBy,
        resolvedAt: materialComments.resolvedAt,
        resolvedBy: materialComments.resolvedBy,
        authorId: materialComments.authorId,
        authorName: users.name,
        createdAt: materialComments.createdAt,
      })
      .from(materialComments)
      .innerJoin(users, eq(materialComments.authorId, users.id))
      .orderBy(asc(materialComments.createdAt)),
    db
      .select({
        id: activityReviewers.id,
        activityId: activityReviewers.activityId,
        teamMemberId: activityReviewers.teamMemberId,
        reviewerName: teamMembers.name,
        reviewerTitle: teamMembers.title,
        institution: teamMembers.institution,
        groupName: teamGroups.name,
        userId: teamMembers.userId,
        status: activityReviewers.status,
        decisionNote: activityReviewers.decisionNote,
        decidedAt: activityReviewers.decidedAt,
      })
      .from(activityReviewers)
      .innerJoin(
        teamMembers,
        eq(activityReviewers.teamMemberId, teamMembers.id)
      )
      .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id))
      .orderBy(asc(teamMembers.name)),
    db
      .select({
        id: reviewSubmissions.id,
        activityId: reviewSubmissions.activityId,
        materialId: reviewSubmissions.materialId,
        revisionId: reviewSubmissions.revisionId,
        revisionNumber: materialRevisions.revisionNumber,
        status: reviewSubmissions.status,
        message: reviewSubmissions.message,
        submittedAt: reviewSubmissions.submittedAt,
        completedAt: reviewSubmissions.completedAt,
      })
      .from(reviewSubmissions)
      .innerJoin(
        materialRevisions,
        eq(reviewSubmissions.revisionId, materialRevisions.id)
      )
      .orderBy(desc(reviewSubmissions.submittedAt)),
    db
      .select({
        id: reviewDecisions.id,
        submissionId: reviewDecisions.submissionId,
        reviewerId: reviewDecisions.reviewerId,
        reviewerName: teamMembers.name,
        decision: reviewDecisions.decision,
        note: reviewDecisions.note,
        decidedAt: reviewDecisions.decidedAt,
      })
      .from(reviewDecisions)
      .innerJoin(teamMembers, eq(reviewDecisions.reviewerId, teamMembers.id))
      .orderBy(desc(reviewDecisions.decidedAt)),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);

  const userNameMap = new Map(allUsers.map(u => [u.id, u.name ?? "Usuário"]));

  return materials.map(material => {
    const materialSubmissions = submissions
      .filter(item => item.materialId === material.id)
      .map(submission => ({
        ...submission,
        decisions: decisions.filter(
          decision => decision.submissionId === submission.id
        ),
      }));

    const materialCommentsList = comments
      .filter(item => item.materialId === material.id)
      .map(item => ({
        ...item,
        status: (item.resolvedAt ? "resolvido" : item.status ?? "aberto") as "aberto" | "implementado" | "resolvido",
        implementedByName: item.implementedBy ? userNameMap.get(item.implementedBy) ?? null : null,
        resolvedByName: item.resolvedBy ? userNameMap.get(item.resolvedBy) ?? null : null,
      }));

    const activeSubmission =
      materialSubmissions.find(item => item.status !== "substituído") ?? null;

    const submissionComments = activeSubmission
      ? materialCommentsList.filter(c => !c.submissionId || c.submissionId === activeSubmission.id)
      : materialCommentsList;

    const openCommentCount = submissionComments.filter(
      c => c.status === "aberto" && c.commentType === "solicitação de ajuste"
    ).length;
    const implementedCommentCount = submissionComments.filter(
      c => c.status === "implementado"
    ).length;
    const resolvedCommentCount = submissionComments.filter(
      c => c.status === "resolvido"
    ).length;
    const totalAdjustmentComments = submissionComments.filter(
      c => c.commentType === "solicitação de ajuste"
    ).length;

    return {
      ...material,
      revisions: revisions.filter(item => item.materialId === material.id),
      comments: materialCommentsList,
      reviewers: material.activityId
        ? reviewers.filter(item => item.activityId === material.activityId)
        : [],
      submissions: materialSubmissions,
      activeSubmission,
      openCommentCount,
      implementedCommentCount,
      resolvedCommentCount,
      totalAdjustmentComments,
    };
  });
}

export async function syncActivityDocumentStatus(
  activityId: number,
  nextStatus: (typeof activities.$inferSelect)["documentStatus"],
  actorId: number,
  note?: string | null
) {
  const db = await requireDb();
  const current = await db
    .select({ status: activities.documentStatus })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);
  if (!current[0] || current[0].status === nextStatus) return;

  await db
    .update(activities)
    .set({ documentStatus: nextStatus })
    .where(eq(activities.id, activityId));

  await db.insert(activityDocumentWorkflowEvents).values({
    activityId,
    previousStatus: current[0].status,
    nextStatus,
    actorId,
    note: note ?? null,
  });
}

export async function listCoordinationInterfaces() {
  const db = await requireDb();
  const [rows, sectionRows, groupRows, activityRows, commentRows, eventRows, evidenceRows, analysisRows] =
    await Promise.all([
    db
      .select({
        id: coordinationInterfaces.id,
        title: coordinationInterfaces.title,
        description: coordinationInterfaces.description,
        interfaceType: coordinationInterfaces.interfaceType,
        responsibleId: coordinationInterfaces.responsibleId,
        responsibleName: teamMembers.name,
        responsibleGroupId: teamMembers.groupId,
        responsibleGroupName: teamGroups.name,
        priority: coordinationInterfaces.priority,
        blockingClass: coordinationInterfaces.blockingClass,
        status: coordinationInterfaces.status,
        dueAt: coordinationInterfaces.dueAt,
        resolution: coordinationInterfaces.resolution,
        resolvedAt: coordinationInterfaces.resolvedAt,
        createdBy: coordinationInterfaces.createdBy,
        createdByName: users.name,
        createdAt: coordinationInterfaces.createdAt,
        updatedAt: coordinationInterfaces.updatedAt,
      })
      .from(coordinationInterfaces)
      .leftJoin(
        teamMembers,
        eq(coordinationInterfaces.responsibleId, teamMembers.id)
      )
      .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id))
      .leftJoin(users, eq(coordinationInterfaces.createdBy, users.id))
      .orderBy(desc(coordinationInterfaces.updatedAt)),
    db
      .select({
        id: interfaceSections.id,
        interfaceId: interfaceSections.interfaceId,
        sectionId: interfaceSections.sectionId,
        code: studySections.code,
        title: studySections.title,
        role: interfaceSections.role,
      })
      .from(interfaceSections)
      .innerJoin(studySections, eq(interfaceSections.sectionId, studySections.id))
      .orderBy(asc(studySections.sortOrder)),
    db
      .select({
        id: interfaceGroups.id,
        interfaceId: interfaceGroups.interfaceId,
        groupId: interfaceGroups.groupId,
        name: teamGroups.name,
        institution: teamGroups.institution,
        role: interfaceGroups.role,
      })
      .from(interfaceGroups)
      .innerJoin(teamGroups, eq(interfaceGroups.groupId, teamGroups.id))
      .orderBy(asc(teamGroups.name)),
    db
      .select({
        id: interfaceActivities.id,
        interfaceId: interfaceActivities.interfaceId,
        activityId: interfaceActivities.activityId,
        planCode: activities.planCode,
        title: activities.title,
        role: interfaceActivities.role,
      })
      .from(interfaceActivities)
      .innerJoin(activities, eq(interfaceActivities.activityId, activities.id))
      .orderBy(asc(activities.planSortOrder)),
    db
      .select({
        id: interfaceComments.id,
        interfaceId: interfaceComments.interfaceId,
        authorId: interfaceComments.authorId,
        authorName: users.name,
        content: interfaceComments.content,
        createdAt: interfaceComments.createdAt,
      })
      .from(interfaceComments)
      .innerJoin(users, eq(interfaceComments.authorId, users.id))
      .orderBy(asc(interfaceComments.createdAt)),
    db
      .select({
        id: interfaceEvents.id,
        interfaceId: interfaceEvents.interfaceId,
        actorId: interfaceEvents.actorId,
        actorName: users.name,
        eventType: interfaceEvents.eventType,
        summary: interfaceEvents.summary,
        createdAt: interfaceEvents.createdAt,
      })
      .from(interfaceEvents)
      .innerJoin(users, eq(interfaceEvents.actorId, users.id))
      .orderBy(desc(interfaceEvents.createdAt)),
    db
      .select({
        id: interfaceEvidenceFiles.id,
        interfaceId: interfaceEvidenceFiles.interfaceId,
        activityId: interfaceEvidenceFiles.activityId,
        fileName: interfaceEvidenceFiles.fileName,
        mimeType: interfaceEvidenceFiles.mimeType,
        fileSize: interfaceEvidenceFiles.fileSize,
        storageUrl: interfaceEvidenceFiles.storageUrl,
        createdAt: interfaceEvidenceFiles.createdAt,
        uploadedBy: users.name,
      })
      .from(interfaceEvidenceFiles)
      .innerJoin(users, eq(interfaceEvidenceFiles.uploadedBy, users.id))
      .orderBy(desc(interfaceEvidenceFiles.createdAt)),
    db
      .select({
        id: interfaceAiAnalyses.id,
        interfaceId: interfaceAiAnalyses.interfaceId,
        model: interfaceAiAnalyses.model,
        status: interfaceAiAnalyses.status,
        resultJson: interfaceAiAnalyses.resultJson,
        errorMessage: interfaceAiAnalyses.errorMessage,
        createdAt: interfaceAiAnalyses.createdAt,
        requestedBy: users.name,
      })
      .from(interfaceAiAnalyses)
      .innerJoin(users, eq(interfaceAiAnalyses.requestedBy, users.id))
      .orderBy(desc(interfaceAiAnalyses.createdAt)),
  ]);

  return rows.map(item => ({
    ...item,
    sections: sectionRows.filter(section => section.interfaceId === item.id),
    groups: groupRows.filter(group => group.interfaceId === item.id),
    activities: activityRows.filter(activity => activity.interfaceId === item.id),
    comments: commentRows.filter(comment => comment.interfaceId === item.id),
    events: eventRows.filter(event => event.interfaceId === item.id),
    evidenceFiles: evidenceRows.filter(file => file.interfaceId === item.id),
    aiAnalyses: analysisRows.filter(analysis => analysis.interfaceId === item.id),
  }));
}

export async function getCoordinationInterface(id: number) {
  const rows = await listCoordinationInterfaces();
  return rows.find(item => item.id === id) ?? null;
}

export async function listNotificationLogs() {
  const db = await requireDb();
  return db
    .select({
      id: notificationLogs.id,
      event: notificationLogs.event,
      status: notificationLogs.status,
      recipientPhone: notificationLogs.recipientPhone,
      providerMessageId: notificationLogs.providerMessageId,
      errorMessage: notificationLogs.errorMessage,
      attempts: notificationLogs.attempts,
      nextAttemptAt: notificationLogs.nextAttemptAt,
      lastAttemptAt: notificationLogs.lastAttemptAt,
      sentAt: notificationLogs.sentAt,
      createdAt: notificationLogs.createdAt,
      activityTitle: activities.title,
      responsibleName: teamMembers.name,
    })
    .from(notificationLogs)
    .innerJoin(activities, eq(notificationLogs.activityId, activities.id))
    .innerJoin(teamMembers, eq(notificationLogs.teamMemberId, teamMembers.id))
    .orderBy(desc(notificationLogs.createdAt))
    .limit(50);
}

export async function listParticipantNotifications(userId: number, limit = 50) {
  const db = await requireDb();
  return db
    .select({
      id: participantNotifications.id,
      type: participantNotifications.type,
      title: participantNotifications.title,
      message: participantNotifications.message,
      actionUrl: participantNotifications.actionUrl,
      read: participantNotifications.read,
      readAt: participantNotifications.readAt,
      createdAt: participantNotifications.createdAt,
      activityId: participantNotifications.activityId,
      materialId: participantNotifications.materialId,
    })
    .from(participantNotifications)
    .where(eq(participantNotifications.recipientUserId, userId))
    .orderBy(desc(participantNotifications.createdAt))
    .limit(limit);
}

export async function countUnreadParticipantNotifications(userId: number): Promise<number> {
  const db = await requireDb();
  const rows = await db
    .select({ id: participantNotifications.id })
    .from(participantNotifications)
    .where(
      and(
        eq(participantNotifications.recipientUserId, userId),
        eq(participantNotifications.read, false)
      )
    );
  return rows.length;
}

export async function markParticipantNotificationRead(notificationId: number, userId: number) {
  const db = await requireDb();
  await db
    .update(participantNotifications)
    .set({
      read: true,
      readAt: Date.now(),
    })
    .where(
      and(
        eq(participantNotifications.id, notificationId),
        eq(participantNotifications.recipientUserId, userId)
      )
    );
  return { success: true };
}

export async function markAllParticipantNotificationsRead(userId: number) {
  const db = await requireDb();
  await db
    .update(participantNotifications)
    .set({
      read: true,
      readAt: Date.now(),
    })
    .where(
      and(
        eq(participantNotifications.recipientUserId, userId),
        eq(participantNotifications.read, false)
      )
    );
  return { success: true };
}

export async function listUsers() {
  const db = await requireDb();
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      appRole: users.appRole,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(asc(users.name));
}

export async function listUserAccessDirectory() {
  const db = await requireDb();
  const [accountRows, memberRows, provisionRows, eventRows] = await Promise.all([
    db
      .select({
        id: users.id,
        openId: users.openId,
        name: users.name,
        email: users.email,
        role: users.role,
        appRole: users.appRole,
        accessStatus: users.accessStatus,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(asc(users.name)),
    db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email,
        institution: teamMembers.institution,
        groupRole: teamMembers.groupRole,
        groupId: teamMembers.groupId,
        groupName: teamGroups.name,
      })
      .from(teamMembers)
      .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id)),
    db.select().from(userAccessProvisions).orderBy(asc(userAccessProvisions.name)),
    db.select().from(userAccessEvents).orderBy(desc(userAccessEvents.createdAt)).limit(50),
  ]);

  const membersByEmail = new Map(memberRows.filter(r => Boolean(r.email)).map(row => [row.email!.toLowerCase(), row]));
  const membersByName = new Map(memberRows.filter(r => Boolean(r.name)).map(row => [row.name!.toLowerCase(), row]));
  const provisionsByEmail = new Map(provisionRows.map(row => [row.email.toLowerCase(), row]));

  const accounts = accountRows.map(row => {
    const member = (row.email ? membersByEmail.get(row.email.toLowerCase()) : null) || (row.name ? membersByName.get(row.name.toLowerCase()) : null);
    return {
      kind: "conta" as const,
      id: row.id,
      openId: row.openId,
      name: row.name ?? "Participante",
      email: row.email ?? "",
      role: row.role,
      appRole: row.appRole,
      status: row.accessStatus,
      lastSignedIn: row.lastSignedIn,
      groupName: member?.groupName ?? null,
      groupRole: member?.groupRole ?? null,
      institution: member?.institution ?? null,
      provisionId: row.email ? provisionsByEmail.get(row.email.toLowerCase())?.id ?? null : null,
    };
  });

  const pending = provisionRows
    .filter(row => !accountRows.some(account => account.email?.toLowerCase() === row.email.toLowerCase()))
    .map(row => {
      const member = membersByEmail.get(row.email.toLowerCase()) || membersByName.get(row.name.toLowerCase());
      return {
        kind: "pre-cadastro" as const,
        id: row.id,
        openId: `provision_${row.id}`,
        name: row.name,
        email: row.email,
        role: row.role,
        appRole: row.appRole,
        status: row.status,
        lastSignedIn: null,
        groupName: member?.groupName ?? null,
        groupRole: member?.groupRole ?? null,
        institution: member?.institution ?? null,
        provisionId: row.id,
      };
    });

  return { entries: [...accounts, ...pending], events: eventRows };
}

export async function updateUserAccess(input: { actorUserId: number; target: "conta" | "pre-cadastro"; id: number; appRole: AppRole; status: "ativo" | "revogado" | "pendente" | "ativado"; note?: string }) {
  const db = await requireDb();
  if (input.target === "conta") {
    const current = (await db.select().from(users).where(eq(users.id, input.id)).limit(1))[0];
    if (!current) throw new Error("Usuário não localizado.");
    if (current.id === input.actorUserId && (input.appRole !== "administrador" || input.status === "revogado")) throw new Error("O administrador não pode revogar ou reduzir o próprio acesso.");
    await db.update(users).set({ appRole: input.appRole, role: input.appRole === "administrador" ? "admin" : "user", accessStatus: input.status === "revogado" ? "revogado" : "ativo" }).where(eq(users.id, input.id));
    await db.insert(userAccessEvents).values({ userId: input.id, actorUserId: input.actorUserId, eventType: input.status === "revogado" ? "acesso_revogado" : input.status === "ativo" ? "acesso_reativado" : "perfil_alterado", previousAppRole: current.appRole, nextAppRole: input.appRole, note: input.note ?? null });
  } else {
    const current = (await db.select().from(userAccessProvisions).where(eq(userAccessProvisions.id, input.id)).limit(1))[0];
    if (!current) throw new Error("Pré-cadastro não localizado.");
    const status = input.status === "revogado" ? "revogado" : input.status === "ativado" ? "ativado" : "pendente";
    await db.update(userAccessProvisions).set({ appRole: input.appRole, role: input.appRole === "administrador" ? "admin" : "user", status }).where(eq(userAccessProvisions.id, input.id));
    await db.insert(userAccessEvents).values({ provisionId: input.id, actorUserId: input.actorUserId, eventType: status === "revogado" ? "acesso_revogado" : status === "ativado" ? "acesso_reativado" : "pre_cadastro_atualizado", previousAppRole: current.appRole, nextAppRole: input.appRole, note: input.note ?? null });
  }
  return listUserAccessDirectory();
}
