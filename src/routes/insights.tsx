import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { AI_INSIGHTS, DEALS, formatBRL } from "@/lib/mock-data";
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, Flame } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({ meta: [{ title: "IA Insights — Nexus CRM" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const ranked = [...DEALS].sort((a, b) => b.aiScore - a.aiScore).slice(0, 6);
  return (
    <AppShell title="IA Insights" subtitle="Sua assistente comercial analisou 1.284 leads nas últimas 24h">
      <div className="grid gap-5 xl:grid-cols-3">
        {AI_INSIGHTS.map((i) => {
          const tone = i.severity === "high" ? "success" : i.severity === "warn" ? "warn" : "info";
          return (
            <div key={i.id} className="rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-surface-1 p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary"><Sparkles className="h-4 w-4" /></div>
                <StatusPill tone={tone as any}>{i.severity === "high" ? "Alta prioridade" : i.severity === "warn" ? "Atenção" : "Insight"}</StatusPill>
              </div>
              <h3 className="text-base font-semibold leading-snug">{i.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{i.body}</p>
              <button className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-1.5 transition-all">
                {i.action} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Priorização inteligente</h3>
          </div>
          <span className="text-xs text-muted-foreground">Score IA · 0–100</span>
        </div>
        <ul className="divide-y divide-border">
          {ranked.map((d) => {
            const trend = d.aiScore >= 70;
            return (
              <li key={d.id} className="grid grid-cols-12 items-center gap-4 px-6 py-4">
                <div className="col-span-5">
                  <div className="text-sm font-semibold">{d.title}</div>
                  <div className="text-xs text-muted-foreground">{d.company} · {d.contact}</div>
                </div>
                <div className="col-span-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-1">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${d.aiScore}%` }} />
                  </div>
                </div>
                <div className="col-span-1 text-right text-sm font-bold tabular-nums">{d.aiScore}</div>
                <div className="col-span-2 text-right text-sm font-semibold tabular-nums">
                  <span className={`inline-flex items-center gap-1 ${trend ? "text-success" : "text-muted-foreground"}`}>
                    {trend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {d.value > 0 ? formatBRL(d.value) : "—"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}