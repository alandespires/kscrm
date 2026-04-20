import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { STAGES, DEALS, formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Nexus CRM" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const conv = STAGES.filter(s => s.id !== "perdido").map(s => ({
    name: s.label.split(" ")[0],
    valor: DEALS.filter(d => d.stage === s.id).length,
  }));
  const sources = [
    { name: "Site", value: 38 }, { name: "Indicação", value: 26 },
    { name: "LinkedIn", value: 18 }, { name: "Anúncio", value: 12 }, { name: "Evento", value: 6 },
  ];
  const COLORS = ["oklch(0.685 0.175 45)", "oklch(0.72 0.21 142)", "oklch(0.7 0.12 220)", "oklch(0.78 0.16 80)", "oklch(0.55 0.18 25)"];

  return (
    <AppShell title="Relatórios" subtitle="Performance comercial e fontes de conversão">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-card">
          <h3 className="text-base font-semibold">Conversão por etapa</h3>
          <p className="text-xs text-muted-foreground">Volume de negócios por estágio do funil</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conv}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="name" stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.27 0 0)", borderRadius: 12 }} />
                <Bar dataKey="valor" fill="oklch(0.685 0.175 45)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-card">
          <h3 className="text-base font-semibold">Origem dos melhores leads</h3>
          <p className="text-xs text-muted-foreground">Distribuição percentual</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sources} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {sources.map((_, i) => <Cell key={i} fill={COLORS[i]} stroke="oklch(0.13 0 0)" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.27 0 0)", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          { label: "Receita prevista", value: formatBRL(DEALS.reduce((a, d) => a + d.value, 0)) },
          { label: "Receita fechada", value: formatBRL(DEALS.filter(d => d.stage === "fechado").reduce((a, d) => a + d.value, 0)) },
          { label: "Ticket médio", value: formatBRL(28400) },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface-2 p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}