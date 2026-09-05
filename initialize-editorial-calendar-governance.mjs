import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL não está disponível para inicializar o calendário editorial.");
}

const connection = await mysql.createConnection(databaseUrl);

function deliveryDatesFromOfficialDueAt(officialDueAt) {
  const official = new Date(Number(officialDueAt));
  const year = official.getUTCFullYear();
  const month = official.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    editorialDeliveryAt: Date.UTC(year, month, 15, 12),
    bndesDeliveryAt: Date.UTC(year, month, Math.min(30, lastDay), 12),
  };
}

try {
  await connection.beginTransaction();

  const [activities] = await connection.query(
    "SELECT id, dueAt FROM activities WHERE structureStatus = 'canonica'"
  );
  for (const activity of activities) {
    const dates = deliveryDatesFromOfficialDueAt(activity.dueAt);
    await connection.query(
      "UPDATE activities SET editorialDeliveryAt = ?, bndesDeliveryAt = ? WHERE id = ?",
      [dates.editorialDeliveryAt, dates.bndesDeliveryAt, activity.id]
    );
  }

  await connection.query(
    "UPDATE coordination_interfaces SET blockingClass = CASE WHEN priority IN ('alta', 'crítica') THEN 'prioritária' ELSE 'não prioritária' END"
  );

  const [members] = await connection.query(
    "SELECT id, name, userId FROM team_members WHERE active = 1 AND (LOWER(name) LIKE '%floriano%' OR LOWER(name) LIKE '%cassiano%')"
  );
  const floriano = members.find(member => member.name.toLowerCase().includes("floriano"));
  const cassiano = members.find(member => member.name.toLowerCase().includes("cassiano"));
  if (!floriano || !cassiano?.userId) {
    throw new Error("Não foi possível localizar Floriano Pires e Cassiano Marins ativos para a governança editorial.");
  }

  const [existing] = await connection.query(
    "SELECT id, coordinatorId, substituteId FROM project_editorial_governance ORDER BY id DESC LIMIT 1"
  );
  const assignedAt = Date.now();
  const justification = "Designação inicial informada pela coordenação: Professor Floriano Pires como coordenador do projeto e Engenheiro Cassiano Marins como substituto.";
  if (existing[0]) {
    await connection.query(
      "UPDATE project_editorial_governance SET coordinatorId = ?, substituteId = ?, assignedBy = ?, assignedAt = ? WHERE id = ?",
      [floriano.id, cassiano.id, cassiano.userId, assignedAt, existing[0].id]
    );
    if (existing[0].coordinatorId !== floriano.id || existing[0].substituteId !== cassiano.id) {
      await connection.query(
        "INSERT INTO project_editorial_governance_events (previousCoordinatorId, nextCoordinatorId, previousSubstituteId, nextSubstituteId, justification, assignedBy) VALUES (?, ?, ?, ?, ?, ?)",
        [existing[0].coordinatorId, floriano.id, existing[0].substituteId, cassiano.id, justification, cassiano.userId]
      );
    }
  } else {
    await connection.query(
      "INSERT INTO project_editorial_governance (coordinatorId, substituteId, assignedBy, assignedAt) VALUES (?, ?, ?, ?)",
      [floriano.id, cassiano.id, cassiano.userId, assignedAt]
    );
    await connection.query(
      "INSERT INTO project_editorial_governance_events (previousCoordinatorId, nextCoordinatorId, previousSubstituteId, nextSubstituteId, justification, assignedBy) VALUES (NULL, ?, NULL, ?, ?, ?)",
      [floriano.id, cassiano.id, justification, cassiano.userId]
    );
  }

  await connection.commit();
  console.log(JSON.stringify({
    activitiesUpdated: activities.length,
    interfacePolicy: "alta/crítica → prioritária; baixa/média → não prioritária",
    coordinator: floriano.name,
    substitute: cassiano.name,
  }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
