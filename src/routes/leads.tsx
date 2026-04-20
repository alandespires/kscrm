import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { useLeads, useDeleteLead, type LeadStatus } from "@/hooks/use-leads";
import { Download, Filter, Trash2, Mail, Phone, Loader2, Inbox } from "lucide-react";

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Leads — Nexus CRM" }] }),
  component: LeadsPage,
});

const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo", contato_inicial: "Em contato", qualificacao: "Qualificado",
  proposta: "Proposta", negociacao: "Negociação", fechado: "Convertido", perdido: "Perdido",
};

const statusTone = (s: LeadStatus) =>
  s === "fechado" ? "success" : s === "qualificacao" || s === "negociacao" ? "info"
  : s === "contato_inicial" || s === "proposta" ? "warn" : s === "perdido" ? "danger" : "neutral";

function initialsOf(name: string) {
  return name.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const del = useDeleteLead();
  const novosSemana = leads.filter((l) => {
    const d = new Date(l.created_at);
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <AppShell
      title="Leads"
      subtitle={`${leads.length} leads ativos · ${novosSemana} novos esta semana`}
      action={
        <div className="flex gap-2">
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 text-sm text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> Importar
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 text-sm text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <LeadFormDialog />
        </div>
      }
    >
      {isLoading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : leads.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-surface-1/40 py-20 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Nenhum lead ainda</h3>
          <p className="mb-5 mt-1 max-w-sm text-sm text-muted-foreground">Comece criando seu primeiro lead — ele aparece aqui e no Pipeline.</p>
          <LeadFormDialog />
        </div>
      ) : (
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
                <th className="px-5 py-3 font-medium">Criado</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((l) => (
                <tr key={l.id} className="transition hover:bg-surface-1/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/70 to-[oklch(0.55_0.16_35)] text-xs font-bold text-primary-foreground">
                        {initialsOf(l.nome)}
                      </div>
                      <span className="font-medium">{l.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{l.empresa ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {l.email && <a href={`mailto:${l.email}`} className="hover:text-primary"><Mail className="h-3.5 w-3.5" /></a>}
                      {l.whatsapp && <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-success"><Phone className="h-3.5 w-3.5" /></a>}
                      {!l.email && !l.whatsapp && <span className="text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{l.origem ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <StatusPill tone={statusTone(l.status) as any}>{STATUS_LABEL[l.status]}</StatusPill>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{fmtDate(l.created_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => { if (confirm(`Remover ${l.nome}?`)) del.mutate(l.id); }} className="text-muted-foreground transition hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </AppShell>
  );
}