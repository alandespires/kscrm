import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PrimaryButton, StatusPill } from "@/components/app-shell";
import { LEADS, formatBRL } from "@/lib/mock-data";
import { Plus, Building2, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Nexus CRM" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const clients = LEADS.filter((l) => l.status === "Convertido").concat(
    LEADS.filter((l) => l.status === "Qualificado").slice(0, 3)
  );
  return (
    <AppShell title="Clientes" subtitle="Contas ativas e histórico comercial completo"
      action={<PrimaryButton icon={Plus}>Novo cliente</PrimaryButton>}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((c, i) => (
          <div key={c.id} className="group rounded-2xl border border-border bg-surface-2 p-5 shadow-card transition hover:border-primary/40 hover:shadow-elevated">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-surface-3 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-3"><ArrowUpRight className="h-4 w-4" /></button>
            </div>
            <h3 className="mt-4 text-base font-semibold">{c.company}</h3>
            <p className="text-xs text-muted-foreground">{c.name} · {c.email}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
              <div>
                <div className="text-muted-foreground">MRR</div>
                <div className="mt-0.5 font-semibold tabular-nums">{formatBRL(2400 + i * 1100)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Contratos</div>
                <div className="mt-0.5 font-semibold">{1 + (i % 3)}</div>
              </div>
            </div>
            <div className="mt-3"><StatusPill tone="success">Ativo</StatusPill></div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}