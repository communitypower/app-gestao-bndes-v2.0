import "dotenv/config";
import { getDb, resetAndSeedPilotDatabase } from "../db";

async function main() {
  console.log("===============================================================");
  console.log("  PREPARAÇÃO PARA RODADA PILOTO — ESTUDO BNDES");
  console.log("  Reset Limpo de Testes & Carga Estrutural Canônica");
  console.log("===============================================================");

  const db = await getDb();
  if (!db) {
    console.error("[Pilot Reset] Erro: Não foi possível conectar ao banco de dados.");
    process.exit(1);
  }

  const result = await resetAndSeedPilotDatabase(db);

  console.log("\n📊 Relatório de Integridade Estrutural:");
  console.log(`  • Seções do Estudo: ${result.stats.sections}`);
  console.log(`  • Capítulos Canônicos (Fichas): ${result.stats.parentChapters}`);
  console.log(`  • Total de Atividades / Etapas: ${result.stats.totalActivities}`);
  console.log(`  • Grupos Temáticos: ${result.stats.groups}`);
  console.log(`  • Integrantes da Equipe: ${result.stats.members}`);
  console.log(`  • Vínculos Grupo-Membro: ${result.stats.memberships}`);
  console.log(`  • Interfaces Interdisciplinares: ${result.stats.interfaces}`);
  console.log(`  • Acervo da Biblioteca (Drive): ${result.stats.libraryItems}`);
  console.log(`  • Usuários Provisionados: ${result.stats.users}`);
  console.log("\n🧹 Dados Transientes de Testes:");
  console.log(`  • Materiais de Produção Ativos: ${result.stats.materials} (esperado 0)`);
  console.log(`  • Submissões de Revisão: ${result.stats.submissions} (esperado 0)`);
  console.log(`  • Notificações Pendentes: ${result.stats.notifications} (esperado 0)`);
  console.log("\n✅ Ambiente pronto para a nova rodada piloto com a equipe!\n");

  process.exit(0);
}

main().catch(err => {
  console.error("[Pilot Reset] Falha ao executar reset piloto:", err);
  process.exit(1);
});
