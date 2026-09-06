import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  index,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  index?: string;
}) {
  return (
    <header className="editorial-enter border-b paper-rule pb-3.5 mb-5">
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-primary">{eyebrow}</p>
        {index ? <span className="font-mono text-[11px] font-medium text-muted-foreground">{index}</span> : null}
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-4xl">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs md:text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    pendente: "border-[#CBD4D1] text-[#53625E] bg-[#F0F3F2]",
    "em andamento": "border-[#AFC6DD] text-[#245C92] bg-[#EAF2F9]",
    concluído: "border-[#B5CEBF] text-[#2F6B4F] bg-[#EAF3ED]",
    atrasado: "border-[#D9B4AC] text-[#943C2D] bg-[#F8ECE9]",
    "em elaboração": "border-[#CBD4D1] text-[#53625E] bg-[#F0F3F2]",
    "em revisão": "border-[#D9C79F] text-[#815918] bg-[#F8F1E2]",
    aprovado: "border-[#B5CEBF] text-[#2F6B4F] bg-[#EAF3ED]",
  };
  return (
    <span className={cn("inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em]", tones[status] || tones.pendente)}>
      {status}
    </span>
  );
}

export function SectionMark({ code }: { code: string }) {
  return (
    <span className="font-mono inline-flex min-w-12 items-center justify-center rounded-sm border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">
      {code}
    </span>
  );
}

export function Metric({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string | number;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("technical-panel border-t-[3px] px-4 py-4", accent ? "border-t-primary" : "border-t-foreground/50")}> 
      <p className="data-label">{label}</p>
      <p className={cn("font-mono mt-3 text-3xl font-semibold tracking-[-.04em]", accent && "text-primary")}>{value}</p>
      {note ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function EmptyEditorial({ title, text }: { title: string; text: string }) {
  return (
    <div className="technical-panel px-6 py-12 text-center">
      <p className="font-display text-2xl font-semibold tracking-[-.025em]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="space-y-6 py-2">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-20 w-3/5" />
      <div className="grid gap-5 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-28" key={index} />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
