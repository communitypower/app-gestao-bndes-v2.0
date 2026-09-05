import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb, ensureSeedData } from "../db";
import {
  studySections,
  teamGroups,
  teamMembers,
  teamGroupMemberships,
  activities,
  coordinationInterfaces,
  libraryItems,
  users,
} from "../../drizzle/schema";

async function main() {
  console.log("[Seed] Connecting to database...");
  const db = await getDb();
  if (!db) {
    console.error("[Seed] Error: Unable to initialize database connection.");
    process.exit(1);
  }

  console.log("[Seed] Running ensureSeedData...");
  await ensureSeedData(db);

  console.log("[Seed] Verifying seeded data counts:");
  const [
    sectionsCount,
    groupsCount,
    membersCount,
    membershipsCount,
    activitiesCount,
    interfacesCount,
    libraryCount,
    usersCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(studySections),
    db.select({ count: sql<number>`count(*)` }).from(teamGroups),
    db.select({ count: sql<number>`count(*)` }).from(teamMembers),
    db.select({ count: sql<number>`count(*)` }).from(teamGroupMemberships),
    db.select({ count: sql<number>`count(*)` }).from(activities),
    db.select({ count: sql<number>`count(*)` }).from(coordinationInterfaces),
    db.select({ count: sql<number>`count(*)` }).from(libraryItems),
    db.select({ count: sql<number>`count(*)` }).from(users),
  ]);

  console.log(` - Seções de Estudo (Capítulos): ${sectionsCount[0]?.count ?? 0}`);
  console.log(` - Grupos de Trabalho: ${groupsCount[0]?.count ?? 0}`);
  console.log(` - Integrantes da Equipe: ${membersCount[0]?.count ?? 0}`);
  console.log(` - Vínculos Grupo-Integrante: ${membershipsCount[0]?.count ?? 0}`);
  console.log(` - Atividades Canônicas: ${activitiesCount[0]?.count ?? 0}`);
  console.log(` - Interfaces de Coordenação: ${interfacesCount[0]?.count ?? 0}`);
  console.log(` - Itens da Biblioteca (Drive Plan): ${libraryCount[0]?.count ?? 0}`);
  console.log(` - Usuários Provisionados: ${usersCount[0]?.count ?? 0}`);
  console.log("[Seed] Seeding completed successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("[Seed] Seeding failed:", err);
  process.exit(1);
});
