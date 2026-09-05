// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  rows: [
    {
      id: 1,
      code: "CAMPO-01",
      title: "Visitas técnicas a estaleiros brasileiros",
      description: "Coleta de dados primários e entrevistas estruturadas.",
      category: "visita a estaleiro" as const,
      country: "Brasil",
      location: "A definir",
      relatedActivityId: 101,
      relatedPlanCode: "I.2.1",
      relatedActivityTitle: "Estaleiros brasileiros",
      responsibleId: null,
      responsibleName: null,
      groupId: null,
      groupName: null,
      startAt: null,
      dueAt: null,
      status: "pendente" as const,
    },
  ],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ fieldwork: { list: { invalidate: vi.fn() } } }),
    fieldwork: {
      list: { useQuery: () => ({ data: fixtures.rows, isLoading: false }) },
      options: {
        useQuery: () => ({
          data: { canManage: true, activities: [], groups: [], members: [] },
        }),
      },
      create: { useMutation: () => ({ mutateAsync: fixtures.create, isPending: false }) },
      update: { useMutation: () => ({ mutateAsync: fixtures.update, isPending: false }) },
    },
  },
}));

import FieldworkPage from "./Fieldwork";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

describe("atividades de campo e divulgação", () => {
  it("apresenta a atividade de fonte primária e a ação de registro", () => {
    render(<FieldworkPage />);
    expect(screen.getByRole("heading", { name: "Atividades de campo e divulgação" })).toBeInTheDocument();
    expect(screen.getAllByText("CAMPO-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Visitas técnicas a estaleiros brasileiros").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /nova atividade/i })).toBeInTheDocument();
  });
});
