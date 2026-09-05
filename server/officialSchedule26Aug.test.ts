import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type ScheduleEntry = {
  detail_code: string;
  start_month: number;
  end_month: number;
};

const schedule = JSON.parse(
  readFileSync(
    new URL("../docs/source/cronograma-r1-r2-26-agosto-upload-2026-08-30-estruturado.json", import.meta.url),
    "utf8"
  )
) as ScheduleEntry[];

describe("cronograma R1/R2 de 26 de agosto", () => {
  it("mantém os 253 períodos extraídos do XLSM oficial, com códigos únicos", () => {
    expect(schedule).toHaveLength(253);
    expect(new Set(schedule.map(item => item.detail_code))).toHaveLength(253);
    expect(schedule.every(item => item.start_month >= 1 && item.end_month <= 8 && item.start_month <= item.end_month)).toBe(true);
  });

  it("preserva janelas representativas da matriz de referência", () => {
    expect(schedule.find(item => item.detail_code === "I.8.8")).toMatchObject({ start_month: 4, end_month: 5 });
    expect(schedule.find(item => item.detail_code === "II.2.2")).toMatchObject({ start_month: 1, end_month: 4 });
    expect(schedule.find(item => item.detail_code === "IV.3.2")).toMatchObject({ start_month: 6, end_month: 6 });
  });
});
