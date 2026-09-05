import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "../../..");
const read = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");

describe("sistema visual técnico e executivo", () => {
  it("define os tokens e utilitários institucionais compartilhados", () => {
    const css = read("client/src/index.css");

    expect(css).toContain("--primary: oklch(0.39 0.065 190)");
    expect(css).toContain("--font-mono: \"IBM Plex Mono\"");
    expect(css).toContain(".technical-panel");
    expect(css).toContain(".data-label");
  });

  it("aplica painéis técnicos aos oito módulos e elimina os padrões editoriais antigos", () => {
    const pages = [
      "Home.tsx",
      "Activities.tsx",
      "Calendar.tsx",
      "Team.tsx",
      "Library.tsx",
      "Production.tsx",
      "Interfaces.tsx",
      "Administration.tsx",
    ];

    for (const page of pages) {
      const source = read(`client/src/pages/${page}`);
      expect(source, page).toContain("technical-panel");
      expect(source, page).not.toContain("bg-[#f5f0e6]");
      expect(source, page).not.toContain("rounded-none uppercase");
      expect(source, page).not.toContain("font-display text-4xl");
    }
  });
});
