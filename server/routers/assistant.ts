import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM, Message, resolveApiKey } from "../_core/llm";
import { ENV } from "../_core/env";
import { requireDb } from "../db";
import {
  activities,
  coordinationInterfaces,
  libraryItems,
  studySections,
  teamGroups,
  teamMembers,
  users,
} from "../../drizzle/schema";
import { eq, like, or, sql } from "drizzle-orm";
import {
  STUDY_SECTIONS,
  STUDY_TOMES,
  TEAM_GROUP_SEED,
  TEAM_SEED,
  CHAPTER_RESPONSIBLE_MAP,
  teamGroupForMember,
} from "../../shared/domain";
import { STUDY_SECTION_DESCRIPTIONS } from "../../shared/studyDescriptions";
import { PDF_ANALYTIC_ITEMS } from "../../shared/pdfAnalyticIndex";

const scopeEnum = z.enum(["all", "structure", "activities", "library", "interfaces", "groups"]);

function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const STOP_WORDS = new Set(["dos", "das", "de", "da", "do", "junior", "jr", "filho", "neto", "prof", "dr", "dra", "professor", "professora", "consultor", "doutorando"]);
const COMMON_FIRST_NAMES = new Set(["carlos", "luiz", "marcelo", "marcos", "andre", "antonio", "pedro", "paulo", "sergio", "joao"]);

function matchMemberInText(text: string) {
  const normText = normalizeText(text);

  // 1. Direct full name match
  for (const m of TEAM_SEED) {
    const normFullName = normalizeText(m.name);
    if (normText.includes(normFullName)) {
      return m;
    }
  }

  // 2. Multi-word scored match with distinctive name weighting
  let bestMember: (typeof TEAM_SEED)[number] | null = null;
  let bestScore = 0;

  for (const m of TEAM_SEED) {
    const normFullName = normalizeText(m.name);
    const memberParts = normFullName
      .split(/\s+/)
      .filter(p => p.length > 2 && !STOP_WORDS.has(p));

    let matchedPartsCount = 0;
    let hasDistinctiveMatch = false;

    for (const part of memberParts) {
      const regex = new RegExp(`\\b${part}\\b`, "i");
      if (regex.test(normText)) {
        matchedPartsCount++;
        if (!COMMON_FIRST_NAMES.has(part)) {
          hasDistinctiveMatch = true;
        }
      }
    }

    if (matchedPartsCount === 0) continue;

    const score = matchedPartsCount * 10 + (hasDistinctiveMatch ? 20 : 0);

    if (score > bestScore) {
      bestScore = score;
      bestMember = m;
    }
  }

  return bestScore >= 10 ? bestMember : null;
}

export const assistantRouter = router({
  getKnowledgeMetrics: protectedProcedure.query(async () => {
    const db = await requireDb();
    const [sectionsCount, activitiesCount, libraryCount, interfacesCount, membersCount, groupsCount] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(studySections),
        db.select({ count: sql<number>`count(*)` }).from(activities),
        db.select({ count: sql<number>`count(*)` }).from(libraryItems),
        db.select({ count: sql<number>`count(*)` }).from(coordinationInterfaces),
        db.select({ count: sql<number>`count(*)` }).from(teamMembers),
        db.select({ count: sql<number>`count(*)` }).from(teamGroups),
      ]);

    const key = resolveApiKey();

    return {
      totalSections: Number(sectionsCount[0]?.count ?? STUDY_SECTIONS.length),
      totalActivities: Number(activitiesCount[0]?.count ?? PDF_ANALYTIC_ITEMS.length),
      totalLibraryItems: Number(libraryCount[0]?.count ?? 0),
      totalInterfaces: Number(interfacesCount[0]?.count ?? 0),
      totalMembers: Number(membersCount[0]?.count ?? TEAM_SEED.length),
      totalGroups: Number(groupsCount[0]?.count ?? TEAM_GROUP_SEED.length),
      hasLlmKey: Boolean(key && key.trim().length > 0),
    };
  }),

  getParticipants: protectedProcedure.query(() => {
    return TEAM_SEED.map(m => {
      const group = teamGroupForMember(m.name);
      const seedGroup = TEAM_GROUP_SEED.find(g => g.coordinatorName === m.name);
      const isCoordinator = Boolean(seedGroup) || m.appRole === "coordenador";
      const coordinatedChapters = Object.entries(CHAPTER_RESPONSIBLE_MAP)
        .filter(([_, respName]) => respName === m.name)
        .map(([code]) => code);

      return {
        name: m.name,
        title: m.title,
        institution: m.institution,
        email: m.email,
        appRole: m.appRole,
        groupName: group?.name ?? (m.name.includes("Floriano") ? "G1 — Sistematização (Coord. Geral)" : "Coordenação Geral"),
        isCoordinator,
        coordinatedChapters,
      };
    });
  }),

  getSuggestedPrompts: protectedProcedure.query(() => {
    return [
      {
        id: "p1",
        category: "Estrutura & Tomos",
        label: "O que aborda o Tomo I.1 e qual o escopo do Relatório 1?",
        scope: "structure" as const,
      },
      {
        id: "p2",
        category: "Equipe & Governança",
        label: "Quem são os coordenadores e integrantes dos 11 grupos temáticos?",
        scope: "groups" as const,
      },
      {
        id: "p3",
        category: "Biblioteca & Normas",
        label: "Quais referências temos cadastradas sobre o Fundo da Marinha Mercante (FMM) e BR do Mar?",
        scope: "library" as const,
      },
      {
        id: "p4",
        category: "Cronograma & Atividades",
        label: "Quais são as principais atividades analíticas ligadas ao segmento de Óleo e Gás (Tomo I.6)?",
        scope: "activities" as const,
      },
      {
        id: "p5",
        category: "Transição Energética",
        label: "Como a descarbonização e os combustíveis alternativos são abordados no Estudo (Tomo I.8 e II.9)?",
        scope: "structure" as const,
      },
      {
        id: "p6",
        category: "Estaleiros & Base Produtiva",
        label: "Qual o diagnóstico e metodologia de benchmarking de estaleiros previstos no Tomo II.4 e II.8?",
        scope: "structure" as const,
      },
      {
        id: "p7",
        category: "Políticas Públicas",
        label: "Quais são os eixos de análise de políticas industriais e conteúdo local no Tomo III?",
        scope: "structure" as const,
      },
      {
        id: "p8",
        category: "Cenários Prospectivos",
        label: "Como o Tomo IV estrutura a simulação de cenários de demanda e o diagnóstico integrado?",
        scope: "structure" as const,
      },
      {
        id: "p9",
        category: "Interfaces Técnicas",
        label: "Como funciona a governança de interfaces e cruzamento de dados entre seções?",
        scope: "interfaces" as const,
      },
    ];
  }),

  searchKnowledge: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(2),
        limit: z.number().int().min(1).max(20).default(5),
      })
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const q = `%${input.query}%`;

      const [matchedSections, matchedActivities, matchedLibrary, matchedMembers] = await Promise.all([
        db
          .select({
            id: studySections.id,
            code: studySections.code,
            title: studySections.title,
            description: studySections.officialDescription,
          })
          .from(studySections)
          .where(
            or(
              like(studySections.code, q),
              like(studySections.title, q),
              like(studySections.officialDescription, q)
            )
          )
          .limit(input.limit),
        db
          .select({
            id: activities.id,
            detailCode: activities.detailCode,
            planCode: activities.planCode,
            title: activities.title,
            description: activities.description,
          })
          .from(activities)
          .where(
            or(
              like(activities.title, q),
              like(activities.detailCode, q),
              like(activities.description, q)
            )
          )
          .limit(input.limit),
        db
          .select({
            id: libraryItems.id,
            title: libraryItems.title,
            theme: libraryItems.theme,
            description: libraryItems.description,
            externalUrl: libraryItems.externalUrl,
          })
          .from(libraryItems)
          .where(
            or(
              like(libraryItems.title, q),
              like(libraryItems.theme, q),
              like(libraryItems.description, q)
            )
          )
          .limit(input.limit),
        db
          .select({
            id: teamMembers.id,
            name: teamMembers.name,
            title: teamMembers.title,
            institution: teamMembers.institution,
            email: teamMembers.email,
          })
          .from(teamMembers)
          .where(
            or(
              like(teamMembers.name, q),
              like(teamMembers.institution, q),
              like(teamMembers.title, q)
            )
          )
          .limit(input.limit),
      ]);

      return {
        sections: matchedSections,
        activities: matchedActivities,
        library: matchedLibrary,
        members: matchedMembers,
      };
    }),

  ask: protectedProcedure
    .input(
      z.object({
        message: z.string().trim().min(1, "A mensagem não pode estar vazia"),
        scope: scopeEnum.default("all"),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const userMessage = input.message.trim();
      const scope = input.scope;

      // 1. Gather rich context from database
      const [allSections, allActivities, allGroups, allMembers, sampleLibrary, allInterfaces] =
        await Promise.all([
          db.select().from(studySections),
          db.select().from(activities).limit(300),
          db.select().from(teamGroups),
          db.select().from(teamMembers),
          db.select().from(libraryItems).limit(350),
          db.select().from(coordinationInterfaces).limit(50),
        ]);

      // Compile knowledge synthesis for RAG context
      const sectionsContext = allSections
        .map(
          s =>
            `- Seção ${s.code}: "${s.title}" — Responsável/Coordenação: ${CHAPTER_RESPONSIBLE_MAP[s.code] || "Equipe"}. Descrição: ${s.officialDescription || STUDY_SECTION_DESCRIPTIONS[s.code as keyof typeof STUDY_SECTION_DESCRIPTIONS] || ""}`
        )
        .join("\n");

      const membersContext = TEAM_SEED.map(m => {
        const group = teamGroupForMember(m.name);
        const coordinatedChapters = Object.entries(CHAPTER_RESPONSIBLE_MAP)
          .filter(([_, respName]) => respName === m.name)
          .map(([code]) => code);
        const chaptersStr =
          coordinatedChapters.length > 0
            ? `Coordena os Capítulos/Tomos: ${coordinatedChapters.join(", ")}`
            : "Pesquisador / Colaborador Técnico";
        return `- ${m.name} (${m.title || "Pesquisador"}, ${m.institution || "UFRJ"}) [${m.appRole}]: ${group ? `Grupo: ${group.name}` : "Coordenação Geral"}. ${chaptersStr}`;
      }).join("\n");

      const groupsContext = allGroups
        .map(g => {
          const members = allMembers.filter(m => m.groupId === g.id);
          const coord = members.find(m => m.groupRole === "coordenador")?.name || "Coordenação";
          return `- ${g.name} (${g.institution || "UFRJ/Parceiros"}) — Coordenador: ${coord}. Integrantes: ${members.map(m => m.name).join(", ")}`;
        })
        .join("\n");

      const relevantLibrary = sampleLibrary
        .filter(l => {
          const lowerQ = userMessage.toLowerCase();
          const words = lowerQ.split(/\s+/).filter(w => w.length > 3);
          const t = (l.title + " " + (l.theme || "") + " " + (l.description || "")).toLowerCase();
          return words.some(w => t.includes(w));
        })
        .slice(0, 15);

      const libraryContext = relevantLibrary
        .map(l => `- [Ref #${l.id}] "${l.title}" (Tema: ${l.theme || "Geral"}) ${l.externalUrl ? `[Link](${l.externalUrl})` : ""}`)
        .join("\n");

      // Find activities relevant to query or mentioned member
      const matchedMemberInPrompt = matchMemberInText(userMessage);

      const relevantActivities = allActivities
        .filter(a => {
          const code = a.detailCode || a.planCode || "";
          if (code && userMessage.toLowerCase().includes(code.toLowerCase())) return true;
          if (matchedMemberInPrompt) {
            const memberChapters = Object.entries(CHAPTER_RESPONSIBLE_MAP)
              .filter(([_, respName]) => respName === matchedMemberInPrompt.name)
              .map(([ch]) => ch);
            if (memberChapters.some(ch => code === ch || code.startsWith(ch + ".") || a.planCode === ch)) {
              return true;
            }
          }
          return userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 4).some(w => a.title.toLowerCase().includes(w));
        })
        .slice(0, 30);

      const activitiesContext = relevantActivities
        .map(a => `- Item ${a.detailCode || a.planCode}: "${a.title}" (Status: ${a.status}, Progresso: ${a.progress}%)`)
        .join("\n");

      const systemPrompt = `Você é o Assistente Técnico de Inteligência Artificial do "Estudo Técnico da Indústria Naval — Diagnósticos e Políticas Públicas para o Desenvolvimento Industrial e Tecnológico", contratado pelo BNDES no âmbito do FEP e coordenado pela UFRJ.

DIRETRIZES FUNDAMENTAIS:
1. Responda em português com precisão técnica, tom formal, executivo e acadêmico rigoroso.
2. Utilize estritamente os fatos e dados canônicos do Estudo BNDES (14 Tomos/Seções, 253 atividades analíticas do Anexo B oficial de 26 de agosto, 11 Grupos de Trabalho e acervo bibliográfico).
3. Quando perguntado sobre qualquer integrante da equipe (ex.: Cassiano Marins de Souza, Floriano Pires, Carlos Rocha, Marta Reyes, etc.), detalhe o nome completo, instituição, cargo, grupo de trabalho do qual participa ou coordena, os capítulos/tomos sob sua coordenação oficial e as atividades analíticas vinculadas.
4. Quando perguntado genericamente sobre os integrantes ou equipe do estudo, apresente a estrutura completa: Coordenação Geral, Coordenadores dos 11 Grupos Temáticos (G1 a G11), Pesquisadores e Instituições participantes.
5. Quando citar capítulos ou seções, mencione o código canônico (ex.: "Tomo I.1", "Capítulo II.4", "Tomo III.5 - FMM").
6. Formate as respostas com elegância em Markdown (títulos, listas com marcadores, destaques em negrito, tabelas quando apropriado).

DADOS CANÔNICOS DO ESTUDO:
---
INTEGRANTES DA EQUIPE E ATRIBUIÇÕES:
${membersContext}

ESTRUTURA DE SEÇÕES E CAPÍTULOS:
${sectionsContext}

GRUPOS DE TRABALHO E COORDENAÇÃO:
${groupsContext}

${activitiesContext ? `ATIVIDADES RELEVANTES ENCONTRADAS:\n${activitiesContext}\n` : ""}
${libraryContext ? `DOCUMENTOS DA BIBLIOTECA RELEVANTES:\n${libraryContext}\n` : ""}
---
Usuário logado: ${ctx.user?.name || "Pesquisador"} (${ctx.user?.appRole || "Membro da equipe"}).
Escopo da consulta atual: ${scope}.`;

      // 2. Attempt LLM generation if available
      const apiKey = resolveApiKey();
      if (apiKey && apiKey.trim().length > 0) {
        try {
          const messages: Message[] = [
            { role: "system", content: systemPrompt },
            ...input.history.slice(-6).map(h => ({
              role: h.role as "user" | "assistant",
              content: h.content,
            })),
            { role: "user", content: userMessage },
          ];

          const modelToUse = ENV.openaiApiKey
            ? "gpt-4o-mini"
            : ENV.geminiApiKey
              ? "gemini-2.5-flash"
              : "gpt-5-mini";

          const llmResult = await invokeLLM({
            model: modelToUse,
            messages,
            max_tokens: 2500,
          });

          const choice = llmResult.choices[0];
          const textResponse =
            typeof choice?.message.content === "string"
              ? choice.message.content
              : Array.isArray(choice?.message.content)
                ? choice.message.content.map(c => ("text" in c ? c.text : "")).join("\n")
                : "Resposta não gerada.";

          return {
            content: textResponse,
            mode: "generative_llm" as const,
            references: relevantLibrary.map(l => ({ id: l.id, title: l.title, url: l.externalUrl })),
            activities: relevantActivities.map(a => ({ code: a.detailCode || a.planCode || "", title: a.title })),
          };
        } catch (err: any) {
          console.warn("[Assistant] LLM invoke fallback to deterministic grounding:", err?.message || err);
        }
      }

      // 3. Robust Deterministic Grounding & Context Engine (Offline / Standalone fallback)
      const fallbackResponse = generateDeterministicAnswer({
        query: userMessage,
        sections: allSections,
        activities: allActivities,
        groups: allGroups,
        members: allMembers,
        library: sampleLibrary,
        interfaces: allInterfaces,
      });

      return {
        content: fallbackResponse,
        mode: "deterministic_grounded" as const,
        references: relevantLibrary.map(l => ({ id: l.id, title: l.title, url: l.externalUrl })),
        activities: relevantActivities.map(a => ({ code: a.detailCode || a.planCode || "", title: a.title })),
      };
    }),
});

interface DeterministicContext {
  query: string;
  sections: any[];
  activities: any[];
  groups: any[];
  members: any[];
  library: any[];
  interfaces: any[];
}

function generateDeterministicAnswer(ctx: DeterministicContext): string {
  const normQ = normalizeText(ctx.query);

  // Pattern 1: Search by Specific Team Member Name (e.g. Cassiano, Floriano, Carlos Rocha, Marta, Armando, etc.)
  const memberSearch = matchMemberInText(ctx.query);

  if (memberSearch) {
    const m = memberSearch;
    const group = teamGroupForMember(m.name);
    const seedGroup = TEAM_GROUP_SEED.find(g => g.coordinatorName === m.name);
    const isCoordinator = Boolean(seedGroup) || m.appRole === "coordenador";
    const coordinatedChapters = Object.entries(CHAPTER_RESPONSIBLE_MAP)
      .filter(([_, respName]) => respName === m.name)
      .map(([code]) => code);

    let answer = `### 👤 Integrante: ${m.name}\n\n`;
    answer += `**Cargo / Título:** ${m.title || "Pesquisador"} | **Instituição:** ${m.institution || "UFRJ"}\n`;
    answer += `**Perfil de Acesso:** ${m.appRole}\n`;
    if (group) {
      answer += `**Grupo Temático Principal:** ${group.name} ${isCoordinator ? "*(Coordenador do Grupo)*" : "*(Pesquisador Integrante)*"}\n`;
    }
    if (m.name === "Floriano Carlos Martins Pires Jr.") {
      answer += `**Função Institucional:** Coordenador Geral do Projeto (UFRJ · FEP/BNDES) | Administrador do Sistema\n`;
    } else if (m.name === "Cassiano Marins de Souza") {
      answer += `**Função Institucional:** Coordenador do Grupo G10 (Construção Naval Mundial e Análise Econômica), Membro do G1 (Sistematização), Substituto Editorial da Coordenação do Projeto | Administrador do Sistema\n`;
    } else if (m.name === "Denise Cunha") {
      answer += `**Função Institucional:** Administradora Executiva do Projeto (UFRJ) | Administradora do Sistema\n`;
    } else if (m.name === "Luiz Felipe Assis") {
      answer += `**Função Institucional:** Coordenador do Grupo G4 (Transporte Marítimo Mundial), Membro do G1 (Sistematização) (UFRJ) | Administrador do Sistema\n`;
    } else if (m.name === "Marcos Pedreira da Silva") {
      answer += `**Função Institucional:** Técnico de TI / Suporte Técnico (UFRJ) | Administrador do Sistema\n`;
    } else if (m.name === "Marcos Pereira") {
      answer += `**Função Institucional:** Professor (UFPE) | Integrante do Grupo G11 (Construção Naval no Brasil)\n`;
    }

    if (coordinatedChapters.length > 0) {
      answer += `\n#### 📑 Capítulos e Tomos sob sua Coordenação Oficial:\n`;
      coordinatedChapters.forEach(code => {
        const sec = ctx.sections.find(s => s.code === code);
        answer += `- **Tomo ${code}**: ${sec?.title || "Capítulo do estudo"}\n`;
      });

      // Find analytical activities linked to these chapters
      const memberActivities = ctx.activities.filter(a => {
        const code = a.detailCode || a.planCode || "";
        return coordinatedChapters.some(ch => code === ch || code.startsWith(ch + ".") || a.planCode === ch);
      });

      if (memberActivities.length > 0) {
        answer += `\n#### 📋 Atividades Analíticas Atribuídas (${memberActivities.length} itens no cronograma oficial de 26 de agosto):\n`;
        memberActivities.slice(0, 15).forEach(act => {
          answer += `- **${act.detailCode || act.planCode || "Item"}**: ${act.title} *(Status: ${act.status})*\n`;
        });
        if (memberActivities.length > 15) {
          answer += `*... e mais ${memberActivities.length - 15} sub-itens detalhados no módulo de Gestão de Atividades.*\n`;
        }
      }
    } else {
      answer += `\n#### 📋 Atribuições de Pesquisa e Suporte Técnico:\n`;
      answer += `- Atuação em colaboração direta com os grupos temáticos e revisão de materiais de pesquisa.\n`;
    }

    return answer;
  }

  // Pattern 2: General Query about Team Members / Research Team (Integrantes do Estudo / Equipe do Projeto)
  if (
    normQ.includes("integrante") ||
    normQ.includes("pesquisador") ||
    normQ.includes("equipe") ||
    normQ.includes("membros") ||
    normQ.includes("quem faz parte") ||
    normQ.includes("quadro de membros") ||
    normQ.includes("todos os membros")
  ) {
    let answer = `### 👥 Quadro de Integrantes e Grupos de Pesquisa do Estudo BNDES\n\n`;
    answer += `O **Estudo Técnico da Indústria Naval (BNDES · FEP / UFRJ)** reúne mais de 25 pesquisadores e especialistas de diversas universidades e centros de excelência (UFRJ, COPPE, IE, IPT, UFPA, UFPE, UFU, FACAMP, UCL, TPMI-Índia e consultores especializados).\n\n`;

    answer += `#### 🏛️ Coordenação Geral e Administradores do Sistema:\n`;
    answer += `- **Prof. Floriano Carlos Martins Pires Jr.** — Coordenador Geral do Projeto · Administrador (UFRJ)\n`;
    answer += `- **Denise Cunha** — Administradora Executiva do Projeto · Administradora (UFRJ)\n`;
    answer += `- **Cassiano Marins de Souza** — Coordenador do Grupo G10, Membro do G1 e Substituto Editorial da Coordenação · Administrador (Consultoria/UFRJ)\n`;
    answer += `- **Prof. Luiz Felipe Assis** — Coordenador do Grupo G4 e Membro do G1 · Administrador (UFRJ)\n`;
    answer += `- **Marcos Pedreira da Silva** — Técnico de TI / Suporte Técnico · Administrador (UFRJ)\n\n`;

    answer += `#### 🔬 Os 11 Grupos Temáticos de Trabalho (G1 a G11):\n`;
    TEAM_GROUP_SEED.forEach((g, idx) => {
      const coordinatedSecs = Object.entries(CHAPTER_RESPONSIBLE_MAP)
        .filter(([_, resp]) => resp === g.coordinatorName)
        .map(([code]) => code);
      const capStr = coordinatedSecs.length > 0 ? ` [Capítulos: ${coordinatedSecs.join(", ")}]` : "";
      const membersStr = g.memberNames.length > 0 ? ` | Integrantes: ${g.memberNames.join(", ")}` : "";
      answer += `${idx + 1}. **${g.name}** *(${g.institution})* — **Coord:** ${g.coordinatorName}${capStr}${membersStr}\n`;
    });

    answer += `\n💡 *Dica:* Para consultar as atividades detalhadas de um integrante específico, pergunte pelo nome (ex.: *"Quais são as atividades atribuídas a Cassiano?"* ou *"Quem coordena o Grupo 2?"*).`;
    return answer;
  }

  // Pattern 3: Match specific Section/Tomo (e.g., I.1, II.4, III.5, IV.2, AP)
  const sectionCodeMatch = ctx.query.match(/\b(ap|[i|v|x]+[0-9]*\.[0-9]+)\b/i);
  if (sectionCodeMatch) {
    const code = sectionCodeMatch[1].toUpperCase();
    const section = ctx.sections.find(s => s.code.toUpperCase() === code);
    if (section) {
      const coordinator = CHAPTER_RESPONSIBLE_MAP[section.code] || "Coordenação Geral";
      const relatedActivities = ctx.activities.filter(
        a => a.sectionId === section.id || a.planCode === section.code || a.detailCode?.startsWith(section.code + ".")
      );
      const desc =
        section.officialDescription ||
        STUDY_SECTION_DESCRIPTIONS[section.code as keyof typeof STUDY_SECTION_DESCRIPTIONS] ||
        "Sem descrição cadastrada.";

      let answer = `### 📘 Seção/Tomo ${section.code} — ${section.title}\n\n`;
      answer += `**Coordenação Responsável:** ${coordinator}\n\n`;
      answer += `**Escopo Oficial do Plano de Trabalho:**\n${desc}\n\n`;

      if (relatedActivities.length > 0) {
        answer += `#### 📋 Atividades Analíticas Vinculadas (${relatedActivities.length} itens no Anexo B):\n`;
        relatedActivities.slice(0, 8).forEach(act => {
          answer += `- **${act.detailCode || act.planCode || "Item"}**: ${act.title} *(Status: ${act.status})*\n`;
        });
        if (relatedActivities.length > 8) {
          answer += `*... e mais ${relatedActivities.length - 8} sub-itens detalhados no módulo de Atividades.*\n`;
        }
      }

      // Check library references
      const relatedLib = ctx.library.filter(
        l => l.sectionId === section.id || l.title.toLowerCase().includes(section.code.toLowerCase())
      );
      if (relatedLib.length > 0) {
        answer += `\n#### 📚 Referências Bibliográficas Relacionadas:\n`;
        relatedLib.slice(0, 4).forEach(l => {
          answer += `- ${l.title} ${l.externalUrl ? `([Acessar Referência](${l.externalUrl}))` : ""}\n`;
        });
      }

      return answer;
    }
  }

  // Pattern 4: Specific Activity Code (e.g. I.1.1, II.2.3, IV.3.2)
  const activityCodeMatch = ctx.query.match(/\b([i|v|x]+\.[0-9]+\.[0-9]+)\b/i);
  if (activityCodeMatch) {
    const actCode = activityCodeMatch[1].toUpperCase();
    const act = ctx.activities.find(a => a.detailCode?.toUpperCase() === actCode);
    if (act) {
      let answer = `### 📋 Atividade Analítica ${act.detailCode} — ${act.title}\n\n`;
      answer += `**Status:** ${act.status} | **Progresso:** ${act.progress}%\n`;
      if (act.description) {
        answer += `**Descrição:** ${act.description}\n\n`;
      }
      if (act.planningSummary) {
        answer += `**Síntese Metodológica:** ${act.planningSummary}\n\n`;
      }
      return answer;
    }
  }

  // Pattern 5: Search for Groups (G1 a G11 ou Grupo 1 a Grupo 11)
  const groupMatch = ctx.query.match(/(?:grupo|g)\s*([0-9]{1,2})\b/i);
  if (groupMatch) {
    const groupNum = groupMatch[1];
    const group = ctx.groups.find(
      g =>
        g.name.toLowerCase().includes(`g${groupNum} `) ||
        g.name.toLowerCase().startsWith(`g${groupNum} `) ||
        g.name.toLowerCase().includes(`g${groupNum} —`) ||
        g.name.toLowerCase().includes(`grupo ${groupNum}`) ||
        g.name.toLowerCase().includes(`grupo ${groupNum} —`)
    );
    if (group) {
      const members = ctx.members.filter(m => m.groupId === group.id);
      const coordinator = members.find(m => m.groupRole === "coordenador");
      const seedGroup = TEAM_GROUP_SEED.find(
        g =>
          g.name.toLowerCase().includes(`g${groupNum} `) ||
          g.name.toLowerCase().startsWith(`g${groupNum} `) ||
          g.name.toLowerCase().includes(`g${groupNum} —`)
      );

      let answer = `### 👥 ${group.name} (Grupo ${groupNum})\n\n`;
      answer += `**Instituição Vinculada:** ${group.institution || "UFRJ / COPPE"}\n`;
      answer += `**Coordenador(a):** ${coordinator?.name || seedGroup?.coordinatorName || "Coordenação do Grupo"}\n\n`;
      answer += `#### 🎓 Integrantes da Equipe:\n`;
      if (members.length > 0) {
        members.forEach(m => {
          answer += `- **${m.name}** — ${m.title || "Pesquisador"} *(${m.institution || "UFRJ"})* [${m.groupRole}]\n`;
        });
      } else if (seedGroup?.memberNames) {
        seedGroup.memberNames.forEach(name => {
          answer += `- **${name}** — Pesquisador *(UFRJ)*\n`;
        });
      } else {
        answer += `- Coordenador: **${seedGroup?.coordinatorName || "Equipe"}**\n`;
      }

      // Find chapters coordinated by this group coordinator
      const targetCoord = coordinator?.name || seedGroup?.coordinatorName;
      if (targetCoord) {
        const coordinatedSections = Object.entries(CHAPTER_RESPONSIBLE_MAP)
          .filter(([_, name]) => name === targetCoord)
          .map(([code]) => code);

        if (coordinatedSections.length > 0) {
          answer += `\n#### 📑 Capítulos sob Coordenação deste Grupo:\n`;
          coordinatedSections.forEach(c => {
            const sec = ctx.sections.find(s => s.code === c);
            answer += `- **Tomo ${c}**: ${sec?.title || "Capítulo do estudo"}\n`;
          });
        }
      }

      return answer;
    }
  }

  // Pattern 6: Thematic Topics
  if (normQ.includes("fmm") || normQ.includes("marinha mercante") || normQ.includes("afrmm") || normQ.includes("fundo")) {
    return `### ⚓ Fundo da Marinha Mercante (FMM) e Marinha Mercante

O Fundo da Marinha Mercante e a regulação da marinha mercante brasileira são tratados em profundidade no **Tomo I.4** (Mercados e Frotas), **Tomo III.4** (Políticas Brasileiras) e especialmente no **Tomo III.5** (*O Fundo da Marinha Mercante e os Instrumentos Financeiros*, sob coordenação de Marcos Cozzolino).

#### Principais Linhas de Análise:
1. **Arrecadação e Aplicação do AFRMM**: Estrutura institucional, agentes financeiros intervenientes e concessão de crédito.
2. **Custo Efetivo de Capital e Garantias**: Comparação de taxas, riscos cambiais e garantias exigidas pelo BNDES/FMM.
3. **Impacto da Lei do BR do Mar**: Alterações regulatórias, novas regras de afretamento e destinação dos recursos do FMM.
4. **Navegação Interior e Cabotagem**: Aplicação de recursos no transporte fluvial e modernização de frotas regionais.

💡 *Dica:* Na **Biblioteca de Referências**, há relatórios anuais de prestação de contas do FMM e análises regulatórias do BNDES e ANTAQ disponíveis para consulta.`;
  }

  if (normQ.includes("offshore") || normQ.includes("petroleo") || normQ.includes("oleo e gas") || normQ.includes("fpso") || normQ.includes("sonda")) {
    return `### 🌊 Segmento Offshore, Óleo & Gás e Energias Oceânicas

O segmento offshore constitui uma das âncoras da demanda naval no Brasil, abordado principalmente no **Tomo I.6** (*A Indústria Naval e Offshore e a Exploração de Óleo e Gás*, coordenado pelo Prof. Marcelo Igor) e no **Tomo II.4** (*Diagnóstico dos Estaleiros*, coordenado pela Profa. Marta Reyes).

#### Eixos de Investigação do Estudo:
- **Mercado de FPSOs e Sondas**: Demandas de construção de cascos, integração de módulos no Brasil vs. Ásia, e contratos de afretamento de longo prazo da Petrobras.
- **Embarcações de Apoio Marítimo (OSVs)**: Necessidades de renovação de frota de apoio, PSVs, AHTS e navios de estimulação.
- **Eólica Offshore**: Cenários prospectivos para instalação de parques eólicos na costa brasileira e requisitos de embarcações especializadas (WTIV, CTV, SOV).
- **Descomissionamento**: Desafios de reciclagem verde e descomissionamento de plataformas e linhas submarinas na Bacia de Campos e Santos.`;
  }

  if (normQ.includes("descarbonizacao") || normQ.includes("combustiveis") || normQ.includes("transicao") || normQ.includes("imo") || normQ.includes("metanol") || normQ.includes("amonia") || normQ.includes("hidrogenio")) {
    return `### 🌿 Descarbonização e Transição Energética Marítima

A descarbonização da navegação e da construção naval é tratada de forma transversal nos **Tomos I.8, II.9 e III.1** (sob coordenação do Prof. Jean-David Caprace e Prof. Carlos Rocha):

- **Metas Globais (IMO 2030/2050)**: Diretrizes de redução de emissões de gases de efeito estufa no transporte marítimo.
- **Combustíveis Alternativos**: Potencial brasileiro em Biometano, Metanol Verde, Hidrogênio, Amônia Verde e Bunkering Verde.
- **Retrofitting e Eficiência Energética**: Adaptação de cascos, motores bicombustíveis, eletrificação de embarcações fluviais e apoio portuário.
- **Descarbonização nos Estaleiros**: Práticas de sustentabilidade na infraestrutura construtiva e certificações ambientais.`;
  }

  if (normQ.includes("estaleiro") || normQ.includes("capacidade produtiva") || normQ.includes("benchmarking") || normQ.includes("dique") || normQ.includes("produtividade")) {
    return `### 🏗️ Estaleiros Brasileiros e Base Produtiva

A base produtiva, infraestrutura e competitividade dos estaleiros são o núcleo do **Tomo II** (*Indústria Naval: Base Produtiva, Tecnologia e Competitividade*, com liderança dos grupos G10 e G11):

- **Tomo II.4 — Diagnóstico dos Estaleiros**: Levantamento de instalações ativas e inativas, diques secos, rampas de lançamento, cais de acabamento e linhas de montagem de blocos e módulos.
- **Tomo II.5 — Reparo, Conversão e Descomissionamento**: Avaliação da capacidade nacional para docagem de navios mercantes e militares.
- **Tomo II.6 — Cadeia de Fornecedores**: Fornecimento nacional de chapas de aço naval, tintas marítimas, motores e sistemas de automação.
- **Tomo II.8 — Benchmarking Tecnológico**: Comparação de produtividade (horas-homem por tonelada compensada - CGT) entre estaleiros brasileiros, asiáticos e europeus.`;
  }

  if (normQ.includes("defesa") || normQ.includes("militar") || normQ.includes("marinha do brasil") || normQ.includes("prosub") || normQ.includes("tamandare")) {
    return `### 🛡️ Construção Naval Militar e Defesa

A demanda militar e os programas estratégicos da Marinha do Brasil são analisados no **Tomo I.7** (*A Indústria Naval e a Defesa*, coordenado por Andre Ricardo Pinheiro / G9):

- **Programas Estratégicos**: Acompanhamento do Programa de Desenvolvimento de Submarinos (PROSUB), Fragatas Classe Tamandaré e Navios-Patrulha (NPa).
- **Inovação e Transferência de Tecnologia**: Análise de cláusulas de offset, clusters de defesa e absorção de engenharia militar.
- **Sinergias Civil-Militar**: Utilização de estaleiros civis para manutenção e modernização de meios navais da esquadra brasileira.`;
  }

  if (normQ.includes("fluvial") || normQ.includes("hidrovia") || normQ.includes("navegacao interior") || normQ.includes("amazonia") || normQ.includes("bacia")) {
    return `### 🚢 Navegação Interior e Transporte Fluvial

A navegação em rios e bacias hidrográficas é tratada nos **Tomos I.5** (*Navegação Interior e Transporte Fluvial*, coordenado pelo Dr. Carlos Padovezi / G7) e **III.4**:

- **Principais Corredores Logísticos**: Bacias Amazônica, Paraguai-Paraná, Tocantins-Araguaia e São Francisco.
- **Demanda por Embarcações**: Comboios de barcaças graneleiras, empurradores de grande potência e transporte de passageiros regional.
- **Desafios de Infraestrutura**: Calados críticos em épocas de estiagem, sinalização náutica e integração multimodal ferroviária/rodoviária.`;
  }

  if (normQ.includes("politica") || normQ.includes("conteudo local") || normQ.includes("nib") || normQ.includes("nova industria brasil") || normQ.includes("subsidio")) {
    return `### 🏛️ Política Industrial e Regulação Marítima

O **Tomo III** (*Política Industrial e Política Marítima*) apresenta a análise abrangente dos instrumentos de fomento e regulação:

- **Tomo III.1 — Fundamentos Econômicos**: Justificativas para apoio à indústria naval e alinhamento com as Missões da Nova Indústria Brasil (NIB), coordenado pelo Prof. Carlos Rocha.
- **Tomo III.3 — Experiências Internacionais**: Estudo de casos comparativos de políticas públicas na Coreia do Sul, China, Japão e União Europeia, coordenado por Cassiano Marins.
- **Tomo III.6 — Conteúdo Local**: Regras e impactos de conteúdo local em contratos da ANP e encomendas de bens de capital naval.
- **Tomo III.7 — Lições dos Ciclos Históricos**: Aprendizados dos planos navais das décadas de 1970/1980 (Sunaman/PCN) e 2000/2010 (Promef/Petrobras).`;
  }

  if (normQ.includes("cenario") || normQ.includes("projecao") || normQ.includes("sintese") || normQ.includes("tomo iv") || normQ.includes("relatorio 2")) {
    return `### 🔮 Diagnóstico Integrado e Cenários Prospectivos (Tomo IV)

O **Tomo IV** consolida os achados dos Tomos I, II e III para estruturar projeções de futuro e subsidiar as políticas públicas do BNDES:

- **Tomo IV.1 — Diagnóstico Integrado**: Articulação de gargalos, sinergias e viabilidade econômica da indústria naval brasileira.
- **Tomo IV.2 — Cenários Prospectivos**: Simulações quantitativas de demanda em cenários otimista, base e conservador (2026–2040).
- **Tomo IV.3 — Síntese e Diretrizes**: Recomendações estratégicas e bases conceituais para a elaboração do Plano de Ação e do Relatório 2.`;
  }

  if (normQ.includes("interface") || normQ.includes("inconsistencia") || normQ.includes("coordenacao")) {
    return `### 🔗 Governança de Interfaces e Coordenação entre Seções

O sistema de **Interfaces entre Seções** permite mapear e resolver preventivamente inconsistências conceituais, metodológicas e numéricas entre os diferentes grupos de pesquisa.

#### Como Funciona:
1. **Identificação**: Qualquer coordenador ou pesquisador pode registrar uma interface indicando as seções e grupos envolvidos.
2. **Classificação de Severidade**:
   - *Bloqueante*: Impede a finalização de relatório ou entrega de atividade.
   - *Atenção Técnica*: Requer alinhamento de premissas ou fontes de dados.
   - *Informativa*: Alinhamento de escopo sem impacto impeditivo.
3. **Pré-análise por IA**: Cruzamento automático de textos de evidência para apontar divergências antes da deliberação da coordenação geral.
4. **Deliberação e Resolução**: Registro formal da decisão consensual entre os líderes de capítulo.`;
  }

  // Fallback with Smart Search Match
  const words = normQ.split(/\s+/).filter(w => w.length > 3);
  const matchedS = ctx.sections.filter(s =>
    words.some(w => normalizeText(s.title).includes(w) || normalizeText(s.officialDescription).includes(w))
  );

  if (matchedS.length > 0) {
    let answer = `### 🔍 Resultados Relacionados ao seu Termo de Busca\n\nIdentificamos os seguintes capítulos do estudo relacionados à sua pergunta:\n\n`;
    matchedS.slice(0, 3).forEach(s => {
      answer += `#### 📘 **Tomo ${s.code} — ${s.title}**\n`;
      answer += `*Coordenação:* ${CHAPTER_RESPONSIBLE_MAP[s.code] || "Equipe"}\n`;
      answer += `${s.officialDescription}\n\n`;
    });
    answer += `💡 *Dica:* Para detalhar, pergunte diretamente sobre um dos capítulos acima (ex.: "O que aborda o Tomo ${matchedS[0].code}?").`;
    return answer;
  }

  // General Overview Response
  return `### 🏛️ Assistente Técnico do Estudo BNDES — Indústria Naval

Olá! Estou conectado à base de conhecimento oficial do **Estudo Técnico da Indústria Naval (BNDES · FEP / UFRJ)**.

#### Dados Canônicos Ativos na Plataforma:
- **14 Capítulos/Tomos Canônicos**: Cobertura integral dos Tomos I (Mercados e Demandas), II (Construção Naval e Estaleiros), III (Políticas Públicas) e IV (Síntese e Cenários).
- **253 Atividades Analíticas**: Cronograma oficial do Anexo B de 26 de agosto com prazos, responsáveis e entregáveis.
- **11 Grupos de Pesquisa**: Grupos temáticos mobilizados na UFRJ e instituições parceiras.
- **Acervo de Referências**: 328 documentos, normas, relatórios do BNDES, FMM e estudos internacionais catalogados.

#### Exemplos de Perguntas que você pode fazer:
1. *"Quais são as atividades atribuídas a Cassiano Marins?"*
2. *"Quem são os integrantes do estudo e quais são os grupos de trabalho?"*
3. *"Qual é o escopo detalhado do Tomo II.4?"*
4. *"Quais integrantes e responsabilidades compõem o Grupo 2?"*
5. *"Quais referências temos sobre o Fundo da Marinha Mercante (FMM)?"*
6. *"Quais atividades estão previstas para o Tomo III.1?"*`;
}
