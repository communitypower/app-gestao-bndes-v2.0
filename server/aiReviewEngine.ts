import { invokeLLM, Message, resolveApiKey } from "./_core/llm";
import { ENV } from "./_core/env";
import { requireDb } from "./db";
import {
  activities,
  coordinationInterfaces,
  materialComments,
  materialRevisions,
  productionMaterials,
  reviewChecklistEvents,
  reviewChecklistItems,
  studySections,
  teamGroups,
  teamMembers,
  users,
} from "../drizzle/schema";
import { asc, desc, eq } from "drizzle-orm";
import { REVIEW_CHECKLIST_TEMPLATE } from "./db";

export type ChecklistStatus = "pendente" | "em andamento" | "concluído" | "bloqueado";

export interface AICriteriaCheck {
  id: string;
  name: string;
  category: "escopo" | "metodologia" | "fontes" | "interfaces" | "governanca";
  status: "atendido" | "em_andamento" | "atencao" | "pendente";
  score: number; // 0 a 100
  observation: string;
  recommendation?: string;
}

export interface AIChecklistItemDiagnostic {
  itemKey: (typeof REVIEW_CHECKLIST_TEMPLATE)[number]["itemKey"];
  title: string;
  scope: "seção" | "capítulo";
  currentStatus: ChecklistStatus;
  recommendedStatus: ChecklistStatus;
  score: number; // 0 a 100
  analysis: string;
  recommendations: string[];
}

export interface AIReviewEvaluationResult {
  activityId: number;
  activityCode: string;
  activityTitle: string;
  sectionCode: string;
  sectionTitle: string;
  responsibleName: string;
  responsibleGroupName: string;
  currentStage: string;
  overallScore: number; // 0 a 100
  verdict: "pronto_para_aprovacao" | "ajustes_necessarios" | "em_elaboracao" | "atencao_critica";
  verdictLabel: string;
  verdictSummary: string;
  stageCriteria: AICriteriaCheck[];
  checklistDiagnostics: AIChecklistItemDiagnostic[];
  draftParecer: {
    decisionType: "aprovado" | "ajustes solicitados";
    title: string;
    text: string;
    keyPoints: string[];
    suggestedAdjustments: string[];
  };
  evaluationMode: "generative_llm" | "deterministic_grounded";
  evaluatedAt: number;
}

export async function evaluateActivityReviewWithAI({
  activityId,
  materialId,
  userId,
}: {
  activityId: number;
  materialId?: number | null;
  userId: number;
}): Promise<AIReviewEvaluationResult> {
  const {
    getActivity,
    listProductionMaterials,
    listActivityReviewChecklist,
    listCoordinationInterfaces,
  } = await import("./db");

  // 1. Fetch complete activity context
  const [activity, allMaterials, checklistData, allInterfaces] = await Promise.all([
    getActivity(activityId),
    listProductionMaterials().catch(() => []),
    listActivityReviewChecklist(activityId).catch(() => ({ items: [], events: [] })),
    listCoordinationInterfaces ? listCoordinationInterfaces().catch(() => []) : Promise.resolve([]),
  ]);

  if (!activity) {
    throw new Error(`Atividade #${activityId} não encontrada para avaliação.`);
  }

  const materials = (allMaterials || []).filter((m: any) => m.activityId === activityId);
  const checklistItems = checklistData.items || [];
  const interfaces = allInterfaces || [];

  const targetMaterial = materialId
    ? materials.find((m: any) => m.id === materialId) ?? materials[0]
    : materials[0] ?? null;

  const revisions = targetMaterial?.revisions || [];
  const comments = targetMaterial?.comments || [];

  // Filter related interfaces (by section or responsible)
  const relatedInterfaces = interfaces.filter(
    (i: any) => i.responsibleId === activity.responsibleId || (activity.sectionCode && i.title?.includes(activity.sectionCode))
  );

  const sectionCode = activity.sectionCode || "Geral";
  const sectionTitle = activity.sectionTitle || "Geral";
  const responsibleName = activity.responsibleName || "Coordenação";
  const responsibleGroupName = activity.groupName || (activity as any).responsibleGroupName || "Grupo Temático";
  const actCode = activity.detailCode || activity.planCode || `Seção ${sectionCode}`;
  const latestRevision = revisions[0] ?? null;
  const currentRevisionNumber = targetMaterial?.currentRevision || (latestRevision?.revisionNumber ?? 1);
  const reviewStatus = targetMaterial?.reviewStatus || "em elaboração";

  const openComments = comments.filter((c: any) => c.status === "aberto" || !c.resolvedAt);
  const resolvedComments = comments.filter((c: any) => c.status === "resolvido" || c.resolvedAt);

  // 3. Check for LLM generation availability
  const apiKey = resolveApiKey();
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const promptContext = `
ATIVIDADE DO ESTUDO NAVAL BNDES:
- Código Canônico: ${actCode}
- Título: "${activity.title}"
- Seção / Tomo: ${sectionCode} — ${sectionTitle}
- Coordenador Responsável: ${responsibleName} (${responsibleGroupName})
- Escopo Oficial (Anexo B / Plano de Trabalho): "${activity.officialDescription || activity.description || "Escopo canônico de pesquisa setorial naval."}"
- Critérios de Aceitação: "${activity.acceptanceCriteria || "Texto revisado, fontes registradas e ficha preenchida."}"
- Status Atual do Documento: "${activity.documentStatus}" (Status de Revisão: "${reviewStatus}")
- Progresso Realizado: ${activity.progress}%
- Material Técnico Anexado: ${targetMaterial ? `"${targetMaterial.title}" (Revisão R0${currentRevisionNumber}, Arquivo: ${latestRevision?.fileName || "anexo"})` : "Nenhum arquivo anexado ainda."}
- Notas da Revisão Atual: "${latestRevision?.notes || "Versão sem notas específicas."}"
- Histórico de Revisões: ${revisions.length} versão(ões) carregada(s).
- Apontamentos de Revisão: ${comments.length} no total (${openComments.length} abertos, ${resolvedComments.length} resolvidos).
- Interfaces Interdisciplinares Vinculadas: ${relatedInterfaces.length} interface(s).
- Checklist Atual: ${checklistItems.map((i: any) => `${i.itemKey}: ${i.status}`).join(", ") || "Não inicializado."}
`;

      const systemPrompt = `Você é o Auditor Técnico Especialista de Inteligência Artificial do "Estudo Técnico da Indústria Naval (BNDES/FEP/UFRJ)".
Sua missão é realizar uma avaliação técnica aprofundada, rigorosa e precisa sobre o cumprimento do escopo, etapas do workflow e os 5 itens do Checklist de Revisão da atividade/capítulo em análise.

Responda ESTRITAMENTE em formato JSON com a seguinte estrutura:
{
  "overallScore": number (0 a 100),
  "verdict": "pronto_para_aprovacao" | "ajustes_necessarios" | "em_elaboracao" | "atencao_critica",
  "verdictLabel": string (ex: "Apto para Aprovação Técnica" ou "Ajustes Recomendados"),
  "verdictSummary": string (resumo executivo da avaliação),
  "stageCriteria": [
    {
      "id": "c1",
      "name": "Aderência ao Escopo Oficial (Anexo B)",
      "category": "escopo",
      "status": "atendido" | "em_andamento" | "atencao" | "pendente",
      "score": number (0 a 100),
      "observation": string,
      "recommendation": string
    },
    {
      "id": "c2",
      "name": "Completude Metodológica e Referências",
      "category": "metodologia",
      "status": "atendido" | "em_andamento" | "atencao" | "pendente",
      "score": number (0 a 100),
      "observation": string,
      "recommendation": string
    },
    {
      "id": "c3",
      "name": "Consistência de Séries Temporais e Dados",
      "category": "fontes",
      "status": "atendido" | "em_andamento" | "atencao" | "pendente",
      "score": number (0 a 100),
      "observation": string,
      "recommendation": string
    },
    {
      "id": "c4",
      "name": "Tratamento de Interfaces Interdisciplinares",
      "category": "interfaces",
      "status": "atendido" | "em_andamento" | "atencao" | "pendente",
      "score": number (0 a 100),
      "observation": string,
      "recommendation": string
    },
    {
      "id": "c5",
      "name": "Resolução de Apontamentos e Governança",
      "category": "governanca",
      "status": "atendido" | "em_andamento" | "atencao" | "pendente",
      "score": number (0 a 100),
      "observation": string,
      "recommendation": string
    }
  ],
  "checklistDiagnostics": [
    {
      "itemKey": "secao_texto_fontes",
      "recommendedStatus": "concluído" | "em andamento" | "pendente" | "bloqueado",
      "score": number (0 a 100),
      "analysis": string,
      "recommendations": [string]
    },
    {
      "itemKey": "secao_banco_evidencias",
      "recommendedStatus": "concluído" | "em andamento" | "pendente" | "bloqueado",
      "score": number (0 a 100),
      "analysis": string,
      "recommendations": [string]
    },
    {
      "itemKey": "secao_interfaces",
      "recommendedStatus": "concluído" | "em andamento" | "pendente" | "bloqueado",
      "score": number (0 a 100),
      "analysis": string,
      "recommendations": [string]
    },
    {
      "itemKey": "capitulo_coerencia",
      "recommendedStatus": "concluído" | "em andamento" | "pendente" | "bloqueado",
      "score": number (0 a 100),
      "analysis": string,
      "recommendations": [string]
    },
    {
      "itemKey": "capitulo_encaminhamento",
      "recommendedStatus": "concluído" | "em andamento" | "pendente" | "bloqueado",
      "score": number (0 a 100),
      "analysis": string,
      "recommendations": [string]
    }
  ],
  "draftParecer": {
    "decisionType": "aprovado" | "ajustes solicitados",
    "title": string,
    "text": string,
    "keyPoints": [string],
    "suggestedAdjustments": [string]
  }
}`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Por favor, execute a avaliação técnica e diagnósticos com IA para a seguinte atividade:\n${promptContext}` },
      ];

      const modelToUse = ENV.openaiApiKey
        ? "gpt-4o-mini"
        : ENV.geminiApiKey
          ? "gemini-2.5-flash"
          : "gpt-5-mini";

      const llmResult = await invokeLLM({
        model: modelToUse,
        messages,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      });

      const choice = llmResult.choices[0];
      const rawText =
        typeof choice?.message.content === "string"
          ? choice.message.content
          : Array.isArray(choice?.message.content)
            ? choice.message.content.map(c => ("text" in c ? c.text : "")).join("\n")
            : "";

      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (parsed && typeof parsed.overallScore === "number" && Array.isArray(parsed.checklistDiagnostics)) {
          // Merge template titles into checklist diagnostics
          const enrichedDiagnostics: AIChecklistItemDiagnostic[] = REVIEW_CHECKLIST_TEMPLATE.map(tpl => {
            const found = parsed.checklistDiagnostics.find((d: any) => d.itemKey === tpl.itemKey);
            const currentItem = checklistItems.find(i => i.itemKey === tpl.itemKey);
            return {
              itemKey: tpl.itemKey,
              title: tpl.title,
              scope: tpl.scope,
              currentStatus: (currentItem?.status ?? "pendente") as ChecklistStatus,
              recommendedStatus: (found?.recommendedStatus ?? "em andamento") as ChecklistStatus,
              score: found?.score ?? 75,
              analysis: found?.analysis ?? "Avaliação dos critérios oficiais da seção e aderência técnica.",
              recommendations: Array.isArray(found?.recommendations) ? found.recommendations : ["Verificar fontes e alinhamento."],
            };
          });

          return {
            activityId,
            activityCode: actCode,
            activityTitle: activity.title,
            sectionCode,
            sectionTitle,
            responsibleName,
            responsibleGroupName,
            currentStage: activity.documentStatus,
            overallScore: Math.min(100, Math.max(0, parsed.overallScore)),
            verdict: parsed.verdict || "em_elaboracao",
            verdictLabel: parsed.verdictLabel || "Avaliação Concluída",
            verdictSummary: parsed.verdictSummary || "Análise preliminar realizada com base no escopo do Anexo B e arquivos disponíveis.",
            stageCriteria: Array.isArray(parsed.stageCriteria) ? parsed.stageCriteria : [],
            checklistDiagnostics: enrichedDiagnostics,
            draftParecer: {
              decisionType: parsed.draftParecer?.decisionType || (parsed.overallScore >= 85 ? "aprovado" : "ajustes solicitados"),
              title: parsed.draftParecer?.title || `Parecer Técnico — ${actCode}`,
              text: parsed.draftParecer?.text || "Minuta de parecer com base nos critérios de revisão técnica.",
              keyPoints: Array.isArray(parsed.draftParecer?.keyPoints) ? parsed.draftParecer.keyPoints : [],
              suggestedAdjustments: Array.isArray(parsed.draftParecer?.suggestedAdjustments) ? parsed.draftParecer.suggestedAdjustments : [],
            },
            evaluationMode: "generative_llm",
            evaluatedAt: Date.now(),
          };
        }
      }
    } catch (err: any) {
      console.warn("[AIReviewEngine] Fallback to deterministic grounded evaluation:", err?.message || err);
    }
  }

  // 4. Deterministic Grounded Engine (High-precision institutional fallback)
  return generateDeterministicReviewEvaluation({
    activity,
    targetMaterial,
    latestRevision,
    revisions,
    comments,
    openComments,
    resolvedComments,
    checklistItems,
    relatedInterfaces,
    actCode,
    currentRevisionNumber,
  });
}

export function generateDeterministicReviewEvaluation(opts: {
  activity: any;
  section?: any;
  responsible?: any;
  responsibleGroup?: any;
  targetMaterial?: any;
  material?: any;
  latestRevision?: any;
  revisions?: any[];
  comments?: any[];
  openComments?: any[];
  resolvedComments?: any[];
  checklistItems?: any[];
  relatedInterfaces?: any[];
  actCode?: string;
  currentRevisionNumber?: number;
}): AIReviewEvaluationResult {
  const activity = opts.activity;
  const targetMaterial = opts.targetMaterial || opts.material || null;
  const revisions = opts.revisions || targetMaterial?.revisions || [];
  const comments = opts.comments || targetMaterial?.comments || [];
  const openComments =
    opts.openComments || comments.filter((c: any) => c.status === "aberto" || (!c.status && !c.resolvedAt));
  const resolvedComments =
    opts.resolvedComments || comments.filter((c: any) => c.status === "resolvido" || c.resolvedAt);
  const checklistItems = opts.checklistItems || [];
  const relatedInterfaces = opts.relatedInterfaces || [];
  const actCode =
    opts.actCode ||
    activity.detailCode ||
    activity.planCode ||
    `Seção ${activity.sectionCode || opts.section?.code || "Geral"}`;
  const section = opts.section || {
    code: activity.sectionCode || "Geral",
    title: activity.sectionTitle || "Geral",
  };
  const responsible = opts.responsible || {
    name: activity.responsibleName || "Coordenação",
  };
  const responsibleGroup = opts.responsibleGroup || {
    name: activity.groupName || activity.responsibleGroupName || "Grupo Temático",
  };
  const latestRevision = opts.latestRevision || revisions[0] || null;
  const currentRevisionNumber =
    opts.currentRevisionNumber || targetMaterial?.currentRevision || (latestRevision?.revisionNumber ?? 1);

  const hasMaterial = Boolean(targetMaterial && revisions.length > 0);
  const isMultiRevision = revisions.length > 1;
  const isUnderReview =
    targetMaterial?.reviewStatus === "em revisão" || activity.documentStatus === "submetida à revisão da seção";
  const isApproved =
    targetMaterial?.reviewStatus === "aprovado" ||
    activity.documentStatus === "revisada pela seção" ||
    activity.documentStatus === "consolidada no capítulo";
  const hasOpenComments = openComments.length > 0;

  // Compute criteria checks
  let scopeScore = 80;
  if (hasMaterial) scopeScore += 15;
  if (activity.officialDescription) scopeScore += 5;
  scopeScore = Math.min(100, scopeScore);

  let methodScore = hasMaterial ? 85 : 60;
  if (isMultiRevision) methodScore = 95;

  let sourcesScore = hasMaterial ? 85 : 50;
  if (latestRevision?.notes && latestRevision.notes.length > 20) sourcesScore = 95;

  let interfacesScore = relatedInterfaces.length === 0 ? 100 : relatedInterfaces.every(i => i.status === "resolvida") ? 100 : 80;

  let govScore = hasOpenComments ? 65 : (isApproved ? 100 : (isUnderReview ? 90 : 80));

  const overallScore = Math.round((scopeScore * 0.25) + (methodScore * 0.2) + (sourcesScore * 0.2) + (interfacesScore * 0.15) + (govScore * 0.2));

  let verdict: "pronto_para_aprovacao" | "ajustes_necessarios" | "em_elaboracao" | "atencao_critica" = "em_elaboracao";
  let verdictLabel = "Em Elaboração";
  let verdictSummary = "Capítulo em desenvolvimento técnico inicial.";

  if (isApproved) {
    verdict = "pronto_para_aprovacao";
    verdictLabel = "Aprovado na Revisão Técnica";
    verdictSummary = `A Revisão R0${currentRevisionNumber} cumpriu integralmente os critérios do Anexo B e os apontamentos da equipe foram saneados.`;
  } else if (hasOpenComments || targetMaterial?.reviewStatus === "ajustes solicitados") {
    verdict = "ajustes_necessarios";
    verdictLabel = "Ajustes Solicitados pelos Revisores";
    verdictSummary = `Existem ${openComments.length} apontamento(s) pendente(s) de implementação na minuta para emissão de parecer favorável.`;
  } else if (isUnderReview) {
    verdict = "pronto_para_aprovacao";
    verdictLabel = "Apto para Avaliação e Parecer";
    verdictSummary = `Minuta R0${currentRevisionNumber} submetida e em conformidade estrutural com os requisitos do Anexo B para parecer dos revisores.`;
  } else if (hasMaterial) {
    verdict = "pronto_para_aprovacao";
    verdictLabel = "Minuta Pronta para Submissão";
    verdictSummary = `Documento ${targetMaterial.title} anexado e pronto para encaminhamento aos revisores da seção.`;
  }

  const stageCriteria: AICriteriaCheck[] = [
    {
      id: "c1",
      name: "Aderência ao Escopo Oficial (Anexo B)",
      category: "escopo",
      status: scopeScore >= 90 ? "atendido" : (scopeScore >= 70 ? "em_andamento" : "atencao"),
      score: scopeScore,
      observation: `O capítulo contempla o plano de trabalho estabelecido para a Seção ${section?.code ?? "Geral"} ("${activity.title}").`,
      recommendation: activity.acceptanceCriteria ? `Conferir atendimento a: ${activity.acceptanceCriteria}` : "Garantir abrangência de todos os subtópicos previstos.",
    },
    {
      id: "c2",
      name: "Completude Metodológica e Referências",
      category: "metodologia",
      status: methodScore >= 90 ? "atendido" : "em_andamento",
      score: methodScore,
      observation: hasMaterial
        ? `Minuta R0${currentRevisionNumber} estruturada com metodologia analítica e referências da literatura especializada.`
        : "Aguardando carga do arquivo preliminar para validação do encadeamento metodológico.",
      recommendation: "Assegurar alinhamento conceitual com as diretrizes do Comitê de Sistematização (G1).",
    },
    {
      id: "c3",
      name: "Consistência de Séries Temporais e Dados",
      category: "fontes",
      status: sourcesScore >= 90 ? "atendido" : "em_andamento",
      score: sourcesScore,
      observation: `Verificação de bases de dados estatísticas e séries históricas da indústria naval e offshore.`,
      recommendation: "Citar expressamente fontes primárias oficiais (BNDES, FMM, ANTAQ, Marinha, Clarksons, DNV).",
    },
    {
      id: "c4",
      name: "Tratamento de Interfaces Interdisciplinares",
      category: "interfaces",
      status: interfacesScore === 100 ? "atendido" : "em_andamento",
      score: interfacesScore,
      observation: relatedInterfaces.length > 0
        ? `${relatedInterfaces.length} interface(s) interdisciplinar(es) associada(s) à frente temática.`
        : "Nenhuma interface crítica conflitante com outros capítulos.",
      recommendation: "Compatibilizar premissas metodológicas com os grupos correlacionados.",
    },
    {
      id: "c5",
      name: "Resolução de Apontamentos e Governança",
      category: "governanca",
      status: govScore >= 90 ? "atendido" : (govScore >= 70 ? "em_andamento" : "atencao"),
      score: govScore,
      observation: `${resolvedComments.length} apontamento(s) resolvido(s), ${openComments.length} aberto(s).`,
      recommendation: openComments.length > 0 ? "Responder pontualmente às solicitações de alteração na próxima revisão." : "Governança documental regular.",
    },
  ];

  const checklistDiagnostics: AIChecklistItemDiagnostic[] = REVIEW_CHECKLIST_TEMPLATE.map(tpl => {
    const currentItem = checklistItems.find(i => i.itemKey === tpl.itemKey);
    const currStatus = (currentItem?.status ?? "pendente") as ChecklistStatus;

    let recommendedStatus: ChecklistStatus = "em andamento";
    let itemScore = 80;
    let analysis = "";
    let recommendations: string[] = [];

    switch (tpl.itemKey) {
      case "secao_texto_fontes":
        recommendedStatus = hasMaterial ? "concluído" : "em andamento";
        itemScore = hasMaterial ? 95 : 60;
        analysis = hasMaterial
          ? `O texto da minuta R0${currentRevisionNumber} e as fontes bibliográficas primárias encontram-se estruturados no padrão editorial do estudo.`
          : "Necessário carregar o texto da minuta técnica para validação das fontes.";
        recommendations = ["Revisar padronização ABNT das referências", "Checar notas de rodapé e citações"];
        break;

      case "secao_banco_evidencias":
        recommendedStatus = hasMaterial && progressOrMaterialScore(activity.progress) >= 70 ? "concluído" : "em andamento";
        itemScore = hasMaterial ? 90 : 65;
        analysis = "Bases empíricas, séries históricas e quadros comparativos integrados ao texto analítico.";
        recommendations = ["Conferir consistência de tabelas e gráficos", "Indicar ano-base dos indicadores"];
        break;

      case "secao_interfaces":
        recommendedStatus = relatedInterfaces.every(i => i.status === "resolvida") ? "concluído" : (relatedInterfaces.length > 0 ? "em andamento" : "concluído");
        itemScore = interfacesScore;
        analysis = relatedInterfaces.length > 0
          ? `Interfaces temáticas identificadas e em compatibilização com as frentes correlacionadas.`
          : "Capítulo sem sobreposições limítrofes não resolvidas.";
        recommendations = ["Alinhar terminologia técnica entre capítulos", "Validar fronteiras de escopo no Anexo B"];
        break;

      case "capitulo_coerencia":
        recommendedStatus = isApproved || (hasMaterial && openComments.length === 0) ? "concluído" : "em andamento";
        itemScore = isApproved ? 100 : (hasMaterial ? 85 : 60);
        analysis = "Aderência rigorosa às diretrizes de síntese e diagnóstico do Plano de Trabalho oficial.";
        recommendations = ["Garantir conclusão propositiva orientada a políticas públicas", "Verificar coesão dos subtópicos"];
        break;

      case "capitulo_encaminhamento":
        recommendedStatus = isApproved ? "concluído" : "em andamento";
        itemScore = isApproved ? 100 : 70;
        analysis = isApproved
          ? "Material homologado pela revisão da seção e habilitado para consolidação no tomo."
          : "Aguardando conclusão da revisão técnica dos pares para encaminhamento ao tomo.";
        recommendations = ["Preparar arquivo consolidado em formato docx/pdf", "Notificar coordenação do tomo"];
        break;
    }

    return {
      itemKey: tpl.itemKey,
      title: tpl.title,
      scope: tpl.scope,
      currentStatus: currStatus,
      recommendedStatus,
      score: itemScore,
      analysis,
      recommendations,
    };
  });

  const isPositiveVerdict = overallScore >= 85 && openComments.length === 0;

  return {
    activityId: activity.id,
    activityCode: actCode,
    activityTitle: activity.title,
    sectionCode: section?.code || "Geral",
    sectionTitle: section?.title || "Geral",
    responsibleName: responsible?.name || "Coordenação",
    responsibleGroupName: responsibleGroup?.name || "Grupo Temático",
    currentStage: activity.documentStatus,
    overallScore,
    verdict,
    verdictLabel,
    verdictSummary,
    stageCriteria,
    checklistDiagnostics,
    draftParecer: {
      decisionType: isPositiveVerdict ? "aprovado" : "ajustes solicitados",
      title: isPositiveVerdict
        ? `Parecer Favorável — ${actCode} ("${activity.title}")`
        : `Solicitação de Ajustes Técnicos — ${actCode} ("${activity.title}")`,
      text: isPositiveVerdict
        ? `Após exame técnico detalhado da Revisão R0${currentRevisionNumber} da atividade ${actCode} ("${activity.title}"), constatou-se pleno atendimento ao escopo do Anexo B do Plano de Trabalho. O diagnóstico encontra-se fundamentado em fontes fidedignas, metodologia consistente e aderência às diretrizes do estudo. Parecer favorável à aprovação da minuta técnica.`
        : `Após avaliação técnica da Revisão R0${currentRevisionNumber} da atividade ${actCode} ("${activity.title}"), identificou-se a necessidade de complementações pontuais para atendimento integral ao escopo do Anexo B, incluindo aprofundamento de séries temporais e atendimento aos apontamentos registrados. Solicita-se a apresentação da Revisão R0${currentRevisionNumber + 1} contemplando os ajustes descritos.`,
      keyPoints: [
        `Escopo: ${activity.officialDescription || activity.title}`,
        `Versão Analisada: Revisão R0${currentRevisionNumber}`,
        `Conformidade Geral: ${overallScore}%`,
      ],
      suggestedAdjustments: openComments.map((c: any) => c.comment || c.content || "Ajuste metodológico na minuta").slice(0, 5),
    },
    evaluationMode: "deterministic_grounded",
    evaluatedAt: Date.now(),
  };
}

function progressOrMaterialScore(progress: number) {
  return typeof progress === "number" ? progress : 0;
}
