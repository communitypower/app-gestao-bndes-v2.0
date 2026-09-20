import { describe, expect, it, vi } from "vitest";
import {
  canViewCoordinationInterface,
  assertCanViewCoordinationInterface,
  assertCanManageCoordinationInterface,
  assertCanResolveCoordinationInterface,
} from "./access";

describe("Coordination Interfaces - Chapter Coordinator Involvement", () => {
  const adminUser = { id: 100, role: "admin" as const };
  const memberUser = { id: 101, role: "user" as const };

  const chapterCoordMember = {
    id: 10,
    userId: 101,
    groupId: 5,
    groupRole: "coordenador" as const,
    active: true,
  };

  const outsiderMember = {
    id: 99,
    userId: 199,
    groupId: 99,
    groupRole: "participante" as const,
    active: true,
  };

  const interfaceGroupIds = [1, 2];
  const chapterCoordinatorIds = [10, 20];
  const responsibleMemberId = 1;

  it("permite que o coordenador do capítulo veja a interface mesmo se seu grupo não estiver na lista direta de grupos", () => {
    // Outsider cannot view
    expect(
      canViewCoordinationInterface(
        memberUser,
        outsiderMember,
        interfaceGroupIds,
        chapterCoordinatorIds,
        responsibleMemberId
      )
    ).toBe(false);

    // Chapter coordinator CAN view
    expect(
      canViewCoordinationInterface(
        memberUser,
        chapterCoordMember,
        interfaceGroupIds,
        chapterCoordinatorIds,
        responsibleMemberId
      )
    ).toBe(true);

    expect(() =>
      assertCanViewCoordinationInterface(
        memberUser,
        chapterCoordMember,
        interfaceGroupIds,
        chapterCoordinatorIds,
        responsibleMemberId
      )
    ).not.toThrow();
  });

  it("permite que o coordenador do capítulo comente e gerencie a interface", () => {
    expect(() =>
      assertCanManageCoordinationInterface(
        memberUser,
        chapterCoordMember,
        interfaceGroupIds,
        chapterCoordinatorIds,
        responsibleMemberId
      )
    ).not.toThrow();

    expect(() =>
      assertCanManageCoordinationInterface(
        memberUser,
        outsiderMember,
        interfaceGroupIds,
        chapterCoordinatorIds,
        responsibleMemberId
      )
    ).toThrow(/restrita aos grupos e coordenadores de capítulo envolvidos|Somente administradores/i);
  });

  it("permite que o coordenador do capítulo participe da resolução da interface", () => {
    expect(() =>
      assertCanResolveCoordinationInterface(
        memberUser,
        chapterCoordMember,
        responsibleMemberId,
        chapterCoordinatorIds
      )
    ).not.toThrow();

    expect(() =>
      assertCanResolveCoordinationInterface(
        memberUser,
        outsiderMember,
        responsibleMemberId,
        chapterCoordinatorIds
      )
    ).toThrow(/resolução final/i);
  });
});
