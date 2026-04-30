import { type ReactNode } from "react";
import { Sparkles, Plus, ArrowUpRight } from "lucide-react";
import { AppShell, PrimaryButton, StatusPill } from "@/components/app-shell";

export type StubKpi = { label: string; value: string; delta?: string };
export type StubItem = { id: string; title: string; subtitle?: string; meta?: string; tone?: "success" | "warn" | "info" | "danger" | "neutral"; status?: string };

export function ModuleStub({
  title, subtitle, ctaLabel = "Criar novo", icon: Icon, kpis = [], items = [], description, sections,
}: {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  icon: any;
  kpis?: StubKpi[];
  items?: StubItem[];
  description: string;
  sections?: { title: string; body: ReactNode }[];
}) {
  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      action={
        <div className="flex items-center gap-2">
          <StatusPill tone="info">Beta</StatusPill>
          <PrimaryButton icon={Plus}>{ctaLabel}</PrimaryButton>
        </div>
      }
    >
      <div className="mb-6 flex items-start gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-2 via-surface-2 to-surface-1 p-6 shadow-card">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <StatusPill tone="warn">Em desenvolvimento</StatusPill>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="hidden items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary md:flex">
          <Sparkles className="h-3 w-3" /> Em breve
        </div>
      </div>

      {kpis.length > 0 && (
        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-surface-2 p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{k.value}</span>
                {k.delta && <span className="text-[11px] font-semibold text-success">{k.delta}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {sections?.map((s) => (
        <div key={s.title} className="mb-5 overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold">{s.title}</h3>
          </div>
          <div className="p-6">{s.body}</div>
        </div>
      ))}

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold">Visão geral</h3>
            <span className="text-xs text-muted-foreground">{items.length} registros</span>
          </div>
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-surface-3/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-semibold">{it.title}</h4>
                    {it.status && <StatusPill tone={it.tone ?? "neutral"}>{it.status}</StatusPill>}
                  </div>
                  {it.subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{it.subtitle}</p>}
                </div>
                {it.meta && <div className="text-xs font-semibold tabular-nums text-muted-foreground">{it.meta}</div>}
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
