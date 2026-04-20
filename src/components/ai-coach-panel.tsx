import { useEffect, useState } from "react";
import { Sparkles, Loader2, X, Zap, AlertCircle, TrendingUp, RefreshCw } from "lucide-react";
import { useAiCoach, type CoachAction } from "@/hooks/use-ai-coach";

const PRIO_TONE: Record<CoachAction["prioridade"], string> = {
  urgente: "bg-destructive/15 text-destructive border-destructive/30",
  alta: "bg-warning/15 text-warning border-warning/30",
  media: "bg-primary/15 text-primary border-primary/30",
  baixa: "bg-surface-3 text-muted-foreground border-border",
};

const FOCO_LABEL: Record<CoachAction["foco"], string> = {
  leads_quentes: "Leads quentes",
  tarefas: "Tarefas",
  prospeccao: "Prospecção",
  reativacao: "Reativação",
  performance: "Performance",
};

/** Botão compacto que dispara o IA Coach e abre um drawer com as recomendações. */
export function AiCoachButton() {
  const [open, setOpen] = useState(false);
  const coach = useAiCoach();

  // Auto-trigger ao abrir
  useEffect(() => {
    if (open && !coach.data && !coach.isPending) coach.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
        Ver sugestões
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface-1 shadow-elevated">
            <div className="sticky top-0 z-10 border-b border-border bg-surface-1/95 backdrop-blur">
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.16_35)] text-primary-foreground shadow-glow">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">IA Coach</h2>
                    <p className="text-[11px] text-muted-foreground">Recomendações personalizadas para hoje</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => coach.mutate()}
                    disabled={coach.isPending}
                    title="Atualizar"
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-3 hover:text-foreground disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${coach.isPending ? "animate-spin" : ""}`} />
                  </button>
                  <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-3"><X className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-5">
              {coach.isPending && (
                <div className="grid place-items-center py-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="mt-3 text-xs">Analisando sua operação...</p>
                </div>
              )}
              {coach.isError && !coach.isPending && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{(coach.error as Error)?.message ?? "Erro ao gerar sugestões."}</span>
                </div>
              )}
              {coach.data && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
                    <p className="text-sm leading-relaxed">{coach.data.resumo}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <CtxStat label="Leads" value={coach.data.context.total_leads} />
                    <CtxStat label="Tarefas" value={coach.data.context.tarefas_em_aberto} />
                    <CtxStat label="Atrasadas" value={coach.data.context.tarefas_atrasadas} accent={coach.data.context.tarefas_atrasadas > 0} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações recomendadas</h3>
                    {(coach.data.acoes ?? []).map((a, i) => (
                      <div key={i} className={`rounded-xl border p-3 ${PRIO_TONE[a.prioridade] ?? PRIO_TONE.media}`}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
                            <Zap className="h-2.5 w-2.5" /> {a.prioridade}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <TrendingUp className="h-2.5 w-2.5" /> {FOCO_LABEL[a.foco] ?? a.foco}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold leading-snug text-foreground">{a.titulo}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-foreground/80">{a.descricao}</p>
                      </div>
                    ))}
                    {coach.data.acoes?.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        Tudo sob controle. Continue com seu ritmo!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function CtxStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-2.5 text-center ${accent ? "border-warning/30 bg-warning/10" : "border-border bg-surface-2"}`}>
      <div className="text-xs font-bold tabular-nums">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
