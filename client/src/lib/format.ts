export const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export function formatDate(value: number | Date | string) {
  return dateFormatter.format(new Date(value));
}

export function initials(name?: string | null) {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

export function fileSize(bytes?: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function dueTone(dueAt: number, status: string) {
  if (status === "concluído") return "neutral" as const;
  const now = Date.now();
  if (dueAt < now || status === "atrasado") return "danger" as const;
  const days = Math.ceil((dueAt - now) / (24 * 60 * 60 * 1000));
  if (days <= 3) return "warning" as const;
  return "neutral" as const;
}
