import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PrimaryButton, StatusPill } from "@/components/app-shell";
import { LEADS } from "@/lib/mock-data";
import { Plus, Download, Filter, MoreHorizontal, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Leads — Nexus CRM" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const statusTone = (s: string) =>
    s === "Convertido" ? "success" : s === "Qualificado" ? "info" : s === "Em contato" ? "warn" : "neutral";

  return (
    <AppShell
      title="Leads"
      subtitle={`${LEADS.length} leads ativos · 12 novos esta semana`}
      action={
        <div className="flex gap-2">
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 text-sm text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> Importar
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 text-sm text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <PrimaryButton icon={Plus}>Novo lead</PrimaryButton>
        </div>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-1/60">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium">Contato</th>
                <th className="px-5 py-3 font-medium">Origem</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Responsável</th>
                <th className="px-5 py-3 font-medium">Criado</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {LEADS.map((l) => (
                <tr key={l.id} className="transition hover:bg-surface-1/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/70 to-[oklch(0.55_0.16_35)] text-xs font-bold text-primary-foreground">
                        {l.initials}
                      </div>
                      <span className="font-medium">{l.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{l.company}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <button className="hover:text-primary"><Mail className="h-3.5 w-3.5" /></button>
                      <button className="hover:text-success"><Phone className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{l.source}</td>
                  <td className="px-5 py-3.5">
                    <StatusPill tone={statusTone(l.status) as any}>{l.status}</StatusPill>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{l.owner}</td>
                  <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{l.createdAt}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}