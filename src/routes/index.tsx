import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PrimaryButton, StatusPill } from "@/components/app-shell";
import {
  ArrowUpRight, TrendingUp, TrendingDown, Users, Target, DollarSign,
  CheckCircle2, Sparkles, Plus, ArrowRight, Phone, Mail, Zap,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ACTIVITIES, AI_INSIGHTS, DEALS, REVENUE_SERIES, STAGES, formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Nexus CRM" }] }),
  component: DashboardPage,
});

function KpiCard({ label, value, delta, trend, icon: Icon, accent }: {
  label: string; value: string; delta: string; trend: "up" | "down"; icon: any; accent?: boolean;
}) {
  return (
    <div className={[
      "group relative overflow-hidden rounded-2xl border border-border p-5 shadow-card transition hover:border-primary/40",
      accent ? "bg-gradient-to-br from-surface-2 to-surface-1" : "bg-surface-2",
    ].join(" ")}>
      <div className="flex items-start justify-between">
        <div className={[
          "grid h-9 w-9 place-items-center rounded-lg",
          accent ? "bg-primary/15 text-primary" : "bg-surface-3 text-muted-foreground",
        ].join(" ")}>
          <Icon className="h-4 w-4" />
        </div>
        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition group-hover:bg-surface-3 group-hover:text-foreground">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className={[
          "inline-flex items-center gap-0.5 text-[11px] font-semibold",
          trend === "up" ? "text-success" : "text-destructive",
        ].join(" ")}>
          {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta}
        </span>
      </div>
    </div>
  );
}

function DashboardPage() {
  const stageCounts = STAGES.map((s) => ({
    ...s,
    count: DEALS.filter((d) => d.stage === s.id).length,
    value: DEALS.filter((d) => d.stage === s.id).reduce((acc, d) => acc + d.value, 0),
  }));
  const totalPipeline = DEALS.filter((d) => d.stage !== "perdido" && d.stage !== "fechado").reduce((a, d) => a + d.value, 0);
  const won = DEALS.filter((d) => d.stage === "fechado").reduce((a, d) => a + d.value, 0);
  const maxStage = Math.max(...stageCounts.map((s) => s.count));

  return (
    <AppShell
      title="Bom dia, Anna 👋"
      subtitle="Aqui está o panorama da sua operação comercial hoje."
      action={
        <div className="flex gap-2">
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 text-sm text-muted-foreground hover:text-foreground">
            Esta semana <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <PrimaryButton icon={Plus}>Novo negócio</PrimaryButton>
        </div>
      }
    >
      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total de Leads" value="1.284" delta="+12.4%" trend="up" icon={Users} />
        <KpiCard label="Oportunidades abertas" value={String(DEALS.filter(d => d.stage !== "fechado" && d.stage !== "perdido").length)} delta="+5.2%" trend="up" icon={Target} accent />
        <KpiCard label="Receita prevista" value={formatBRL(totalPipeline)} delta="+18.7%" trend="up" icon={DollarSign} accent />
        <KpiCard label="Fechado no mês" value={formatBRL(won)} delta="-3.1%" trend="down" icon={CheckCircle2} />
      </div>

      {/* Main grid */}
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        {/* Receita */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold">Receita</h3>
              <p className="text-xs text-muted-foreground">Previsto vs. fechado nos últimos 7 meses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />Previsto</span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" />Fechado</span>
            </div>
          </div>
          <div className="h-72 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_SERIES} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.685 0.175 45)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.685 0.175 45)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.21 142)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.72 0.21 142)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="month" stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}k`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.27 0 0)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "oklch(0.985 0 0)" }}
                  formatter={(v: number) => `R$ ${v}k`}
                />
                <Area type="monotone" dataKey="previsto" stroke="oklch(0.685 0.175 45)" strokeWidth={2.5} fill="url(#g1)" />
                <Area type="monotone" dataKey="fechado" stroke="oklch(0.72 0.21 142)" strokeWidth={2.5} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* IA Insights */}
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-surface-1 shadow-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-base font-semibold">IA Insights</h3>
            </div>
            <Link to="/insights" className="text-xs text-muted-foreground hover:text-primary">Ver tudo</Link>
          </div>
          <div className="space-y-2 p-4">
            {AI_INSIGHTS.map((i) => {
              const tone = i.severity === "high" ? "success" : i.severity === "warn" ? "warn" : "info";
              return (
                <div key={i.id} className="rounded-xl border border-border bg-surface-2 p-4 transition hover:border-primary/40">
                  <div className="mb-2 flex items-center justify-between">
                    <StatusPill tone={tone as any}>{i.severity === "high" ? "Alta prioridade" : i.severity === "warn" ? "Atenção" : "Insight"}</StatusPill>
                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-semibold leading-snug">{i.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
                  <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-1.5 transition-all">
                    {i.action} <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pipeline resumido + atividades */}
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold">Pipeline comercial</h3>
              <p className="text-xs text-muted-foreground">Distribuição de negócios por etapa</p>
            </div>
            <Link to="/pipeline" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Abrir Kanban <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3 p-6">
            {stageCounts.map((s) => (
              <div key={s.id} className="flex items-center gap-4">
                <div className="w-32 text-xs font-medium text-muted-foreground">{s.label}</div>
                <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface-1">
                  <div
                    className="h-full rounded-md transition-all"
                    style={{
                      width: `${maxStage ? (s.count / maxStage) * 100 : 0}%`,
                      background: `linear-gradient(90deg, ${s.color} 0%, ${s.color} 60%, transparent 140%)`,
                      opacity: 0.85,
                    }}
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold">
                    {s.count} {s.count === 1 ? "negócio" : "negócios"}
                  </span>
                </div>
                <div className="w-24 text-right text-xs font-semibold tabular-nums">{formatBRL(s.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold">Atividade recente</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground">Filtros</button>
          </div>
          <ul className="divide-y divide-border">
            {ACTIVITIES.map((a) => {
              const Icon = a.type === "won" ? CheckCircle2 : a.type === "ai" ? Sparkles : a.type === "call" ? Phone : a.type === "task" ? Zap : Mail;
              const iconBg = a.type === "won" ? "bg-success/15 text-success" : a.type === "ai" ? "bg-primary/15 text-primary" : "bg-surface-3 text-muted-foreground";
              return (
                <li key={a.id} className="flex gap-3 px-6 py-3.5">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${iconBg}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{a.who}</span>{" "}
                      <span className="text-muted-foreground">{a.action}</span>{" "}
                      <span className="font-medium">{a.target}</span>
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{a.value}</span>·<span>{a.time}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
