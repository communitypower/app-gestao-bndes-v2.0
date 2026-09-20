import fs from "fs";
import path from "path";
import { PDF_ANALYTIC_SECTIONS, PDF_ANALYTIC_ITEMS } from "../shared/pdfAnalyticIndex";

const csvPath = "C:/Users/PC/.gemini/antigravity-ide/brain/4ff87356-9e4f-457a-ba78-b70180379bc9/.user_uploaded/media_1789924135276.csv";
const csvContent = fs.readFileSync(csvPath, "utf-8");

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows: { rawActivity: string; activity: string; monthStr: string; monthNum: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    let rawActivity = "";
    let monthStr = "";
    if (line.startsWith('"')) {
      const closingQuoteIdx = line.indexOf('",');
      if (closingQuoteIdx !== -1) {
        rawActivity = line.substring(1, closingQuoteIdx).trim();
        monthStr = line.substring(closingQuoteIdx + 2).trim();
      } else {
        continue;
      }
    } else {
      const parts = line.split(",");
      rawActivity = parts[0].trim();
      monthStr = parts[1] ? parts[1].trim() : "";
    }
    const monthNum = parseInt(monthStr.replace("M", ""), 10) || 6;
    rows.push({
      rawActivity,
      activity: rawActivity.trim(),
      monthStr,
      monthNum,
    });
  }
  return rows;
}

const csvRows = parseCSV(csvContent);

// Official month milestones for Cronograma_r1_200926
export const OFFICIAL_MONTH_MILESTONES = [
  { month: 1, label: "M1", startDate: "2026-08-20", dueDate: "2026-09-20", startAt: Date.UTC(2026, 7, 20, 0, 0, 0), dueAt: Date.UTC(2026, 8, 20, 23, 59, 59) },
  { month: 2, label: "M2", startDate: "2026-09-21", dueDate: "2026-10-20", startAt: Date.UTC(2026, 8, 21, 0, 0, 0), dueAt: Date.UTC(2026, 9, 20, 23, 59, 59) },
  { month: 3, label: "M3", startDate: "2026-10-21", dueDate: "2026-11-20", startAt: Date.UTC(2026, 9, 21, 0, 0, 0), dueAt: Date.UTC(2026, 10, 20, 23, 59, 59) },
  { month: 4, label: "M4", startDate: "2026-11-21", dueDate: "2026-12-20", startAt: Date.UTC(2026, 10, 21, 0, 0, 0), dueAt: Date.UTC(2026, 11, 20, 23, 59, 59) },
  { month: 5, label: "M5", startDate: "2026-12-21", dueDate: "2027-01-20", startAt: Date.UTC(2026, 11, 21, 0, 0, 0), dueAt: Date.UTC(2027, 0, 20, 23, 59, 59) },
  { month: 6, label: "M6", startDate: "2027-01-21", dueDate: "2027-02-20", startAt: Date.UTC(2027, 0, 21, 0, 0, 0), dueAt: Date.UTC(2027, 1, 20, 23, 59, 59) },
  { month: 7, label: "M7", startDate: "2027-02-21", dueDate: "2027-03-20", startAt: Date.UTC(2027, 1, 21, 0, 0, 0), dueAt: Date.UTC(2027, 2, 20, 23, 59, 59) },
] as const;

function getMilestone(month: number) {
  return OFFICIAL_MONTH_MILESTONES[month - 1] || OFFICIAL_MONTH_MILESTONES[OFFICIAL_MONTH_MILESTONES.length - 1];
}

// Map CSV row to items and chapters
// In CSV, entries can be:
// "Apresentação" -> AP
// "1. Introdução" -> I.1 (or Chapter 1 in current Tome)
// "1.1. Objetivos" -> item
// Let's match item by detailCode or title
const itemMap = new Map<string, number>(); // detailCode -> monthNum
const chapterMap = new Map<string, number>(); // chapterCode -> monthNum

// Let's build a sequential matching tracker across Tomos:
let currentTome = "Tomo I";
let currentTomeIdx = 1; // 1 = Tomo I, 2 = Tomo II, 3 = Tomo III, 4 = Tomo IV

for (const row of csvRows) {
  const act = row.activity;
  if (act.toLowerCase() === "apresentação") {
    chapterMap.set("AP", row.monthNum);
    continue;
  }

  // Check if it's a chapter header, e.g. "1. Introdução", "2. Economia Marítima", "1. Construção Naval Mundial"
  const chapterMatch = act.match(/^(\d+)\.\s+(.*)$/);
  const itemMatch = act.match(/^(\d+)\.(\d+)\.?\s+(.*)$/);

  if (itemMatch) {
    const chapNum = itemMatch[1];
    const itemNum = itemMatch[2];
    const itemTitle = itemMatch[3].trim();
    
    // Determine tome roman numeral
    let tomeRoman = "I";
    if (currentTomeIdx === 1) tomeRoman = "I";
    else if (currentTomeIdx === 2) tomeRoman = "II";
    else if (currentTomeIdx === 3) tomeRoman = "III";
    else if (currentTomeIdx === 4) tomeRoman = "IV";

    const detailCode = `${tomeRoman}.${chapNum}.${itemNum}`;
    itemMap.set(detailCode, row.monthNum);
  } else if (chapterMatch) {
    const chapNum = parseInt(chapterMatch[1], 10);
    const chapTitle = chapterMatch[2].trim();

    // Check if we switched to next Tomo when chapNum resets to 1 (except first)
    if (chapNum === 1 && currentTomeIdx === 1 && chapterMap.has("I.1")) {
      currentTomeIdx = 2;
    } else if (chapNum === 1 && currentTomeIdx === 2 && chapterMap.has("II.1")) {
      currentTomeIdx = 3;
    } else if (chapNum === 1 && currentTomeIdx === 3 && chapterMap.has("III.1")) {
      currentTomeIdx = 4;
    }

    let tomeRoman = "I";
    if (currentTomeIdx === 1) tomeRoman = "I";
    else if (currentTomeIdx === 2) tomeRoman = "II";
    else if (currentTomeIdx === 3) tomeRoman = "III";
    else if (currentTomeIdx === 4) tomeRoman = "IV";

    const chapterCode = `${tomeRoman}.${chapNum}`;
    chapterMap.set(chapterCode, row.monthNum);
  }
}

console.log("Matched chapters:", chapterMap.size);
console.log("Matched items:", itemMap.size);

// Check if any items are missing
const missingItems: string[] = [];
for (const item of PDF_ANALYTIC_ITEMS) {
  if (!itemMap.has(item.detailCode)) {
    missingItems.push(item.detailCode);
  }
}
console.log("Missing items:", missingItems);

// Now generate schedule structures
const scheduleSections = PDF_ANALYTIC_ITEMS.map(item => {
  const endMonth = itemMap.get(item.detailCode) || 6;
  const startMonth = 1; // Default start from kickoff M1, or active range
  const activeMonths = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => startMonth + i);
  const startMilestone = getMilestone(startMonth);
  const endMilestone = getMilestone(endMonth);

  const section = PDF_ANALYTIC_SECTIONS.find(s => s.code === item.sectionCode);

  return {
    detailCode: item.detailCode,
    title: item.title,
    tome: section?.tome ?? "Tomo I",
    chapter: item.sectionCode,
    startMonth,
    endMonth,
    activeMonths,
    startDate: startMilestone.startDate,
    dueDate: endMilestone.dueDate,
    startAt: startMilestone.startAt,
    dueAt: endMilestone.dueAt,
  };
});

const scheduleChapters: Record<string, any> = {};
for (const section of PDF_ANALYTIC_SECTIONS) {
  const children = scheduleSections.filter(s => s.chapter === section.code);
  let startMonth = 1;
  let endMonth = 6;
  if (children.length > 0) {
    startMonth = Math.min(...children.map(c => c.startMonth));
    endMonth = Math.max(...children.map(c => c.endMonth));
  } else if (chapterMap.has(section.code)) {
    endMonth = chapterMap.get(section.code)!;
  }
  const activeMonths = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => startMonth + i);
  const startMilestone = getMilestone(startMonth);
  const endMilestone = getMilestone(endMonth);

  scheduleChapters[section.code] = {
    code: section.code,
    title: section.title,
    tome: section.tome,
    startMonth,
    endMonth,
    activeMonths,
    startDate: startMilestone.startDate,
    dueDate: endMilestone.dueDate,
    startAt: startMilestone.startAt,
    dueAt: endMilestone.dueAt,
    childrenCount: children.length,
  };
}

// Generate the TypeScript file content
const outputTs = `/**
 * Cronograma Oficial do Estudo (Relatório 1)
 * Fonte: Cronograma_r1_200926 (Revisão Master BNDES - M1 a M7 com vencimento todo dia 20)
 */

export interface MonthMilestone {
  month: number;
  label: string;
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
}

export const OFFICIAL_MONTH_MILESTONES: ReadonlyArray<MonthMilestone> = ${JSON.stringify(OFFICIAL_MONTH_MILESTONES, null, 2)} as const;

export interface ScheduleSectionItem {
  detailCode: string;
  title: string;
  tome: string;
  chapter?: string | null;
  startMonth: number;
  endMonth: number;
  activeMonths: number[];
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
  group?: string | null;
}

export interface ScheduleChapterItem {
  code: string;
  title: string;
  tome: string;
  startMonth: number;
  endMonth: number;
  activeMonths: number[];
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
  group?: string | null;
  childrenCount?: number;
}

export const OFFICIAL_SCHEDULE_MES3_SECTIONS: ReadonlyArray<ScheduleSectionItem> = ${JSON.stringify(scheduleSections, null, 2)} as const;

export const OFFICIAL_SCHEDULE_MES3_CHAPTERS: Record<string, ScheduleChapterItem> = ${JSON.stringify(scheduleChapters, null, 2)} as const;

export const SCHEDULE_MES3_SECTIONS_BY_CODE = new Map<string, ScheduleSectionItem>(
  OFFICIAL_SCHEDULE_MES3_SECTIONS.map(item => [item.detailCode, item])
);

export function getScheduleForDetailCode(detailCode: string): ScheduleSectionItem | undefined {
  return SCHEDULE_MES3_SECTIONS_BY_CODE.get(detailCode);
}

export function getScheduleForChapterCode(chapterCode: string): ScheduleChapterItem | undefined {
  return OFFICIAL_SCHEDULE_MES3_CHAPTERS[chapterCode];
}
`;

fs.writeFileSync(
  path.resolve("c:/Users/PC/OneDrive/0.Projects/0.Estudo BNDES/App Gestão Estudo BNDES/app gestão bndes v2.0/shared/officialScheduleMes3.ts"),
  outputTs,
  "utf-8"
);

console.log("Successfully generated shared/officialScheduleMes3.ts!");
