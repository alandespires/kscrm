import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PrimaryButton, StatusPill } from "@/components/app-shell";
import { Plus, Zap, ArrowRight, Mail, MessageCircle, Bell, Tag, ListChecks } from "lucide-react";

export const Route = createFileRoute("/automacao")({
  head: () => ({ meta: [{ title: "Automação — Nexus CRM" }] }),
  component: AutomacaoPage,
});

const FLOWS = [
  { id: "1", name: "Lead em Proposta → cria tarefa de follow-up", trigger: "Stage = Proposta", actions: [ListChecks, Bell], runs: 124, active: true },
  { id: "2", name: "Novo lead inbound → WhatsApp boas-vindas", trigger: "Origem = Site", actions: [MessageCircle, Tag], runs: 89, active: true },
  { id: "3", name: "Lead esfriando → notificar dono", trigger: "IA: score ↓", actions: [Bell, Mail], runs: 47, active: true },
  { id: "4", name: "Negócio fechado → email de onboarding", trigger: "Stage = Fechado", actions: [Mail, ListChecks], runs: 32, active: false },
];

function AutomacaoPage() {
  return (
    <AppShell title="Automação" subtitle="Fluxos SE → ENTÃO que rodam em segundo plano"
      action={<PrimaryButton icon={Plus}>Novo fluxo</PrimaryButton>}>
      <div className="space-y-3">
        {FLOWS.map((f) => (
          <div key={f.id} className="group flex items-center gap-4 rounded-2xl border border-border bg-surface-2 p-5 shadow-card transition hover:border-primary/40">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{f.name}</h3>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-surface-3 px-2 py-0.5 font-mono">SE: {f.trigger}</span>
                <ArrowRight className="h-3 w-3" />
                <div className="flex items-center gap-1">
                  {f.actions.map((A, i) => (
                    <div key={i} className="grid h-6 w-6 place-items-center rounded-md bg-surface-3"><A className="h-3 w-3" /></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Execuções</div>
              <div className="text-sm font-semibold tabular-nums">{f.runs}</div>
            </div>
            <StatusPill tone={f.active ? "success" : "neutral"}>{f.active ? "Ativo" : "Pausado"}</StatusPill>
          </div>
        ))}
      </div>
    </AppShell>
  );
}