export function normalizeProvisionEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

export function isProvisionActivatable(status: "pendente" | "ativado" | "revogado") {
  return status === "pendente" || status === "ativado";
}
