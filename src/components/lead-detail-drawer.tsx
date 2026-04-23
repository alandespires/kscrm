import { useState, type FormEvent } from "react";
import { X, Sparkles, Loader2, Mail, Phone, MessageSquare, Calendar, Plus, Building2, RefreshCw, Trash2, UserCheck } from "lucide-react";
import { useScoreLead } from "@/hooks/use-score-lead";
import { useDeleteLead, type LeadRow, type LeadStatus } from "@/hooks/use-leads";
import { useLeadActivities, useCreateActivity, type ActivityType } from "@/hooks/use-activities";
import { useTasks, useCreateTask, useToggleTask } from "@/hooks/use-tasks";
import { useConvertLeadToClient } from "@/hooks/use-convert-lead";
import { formatBRL } from "@/lib/mock-data";

const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo", contato_inicial: "Em contato", qualificacao: "Qualificado",
  proposta: "Proposta", negociacao: "Negociação", fechado: "Convertido", perdido: "Perdido",
};

const TIPO_ICON: Record<ActivityType, any> = {
  ligacao: Phone, email: Mail, whatsapp: MessageSquare, reuniao: Calendar,
  nota: MessageSquare, movimentacao: RefreshCw, tarefa: Calendar,
};

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function LeadDetailDrawer({ lead, onClose }: { lead: LeadRow | null; onClose: () => void }) {
  const open = !!lead;
  const score = useScoreLead();
  const del = useDeleteLead();
  const convert = useConvertLeadToClient();
  const { data: acts = [] } = useLeadActivities(lead?.id ?? null);
  const { data: tasks = [] } = useTasks({ leadId: lead?.id });
  const createAct = useCreateActivity();
  const createTask = useCreateTask();
  const toggle = useToggleTask();

  const [actTipo, setActTipo] = useState<ActivityType>("nota");
  const [actDesc, setActDesc] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  // Convert dialog state
  const [convertOpen, setConvertOpen] = useState(false);
  const [genFin, setGenFin] = useState(true);
  const [finCat, setFinCat] = useState<"venda" | "assinatura" | "servico" | "consultoria" | "outros">("venda");
  const [finVenc, setFinVenc] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [finValor, setFinValor] = useState<string>("");

  // Parcelamento
  const [parcelMode, setParcelMode] = useState(false);
  const [splitMode, setSplitMode] = useState<"pct" | "qtd">("pct");
  const [entradaPct, setEntradaPct] = useState<string>("25");
  const [parcelas, setParcelas] = useState<string>("4");
  const [entradaPaga, setEntradaPaga] = useState(true);
  const [intervaloDias, setIntervaloDias] = useState<string>("30");
  const [primeiraVenc, setPrimeiraVenc] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  if (!open || !lead) return null;

  const isScoring = score.isPending && score.variables === lead.id;

  async function submitAct(e: FormEvent) {
    e.preventDefault();
    if (!actDesc.trim() || !lead) return;
    await createAct.mutateAsync({ tipo: actTipo, descricao: actDesc, lead_id: lead.id });
    setActDesc("");
  }

  async function submitTask(e: FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !lead) return;
    await createTask.mutateAsync({ titulo: taskTitle, lead_id: lead.id });
    setTaskTitle("");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-surface-1 shadow-elevated">
        {/* header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface-1/95 backdrop-blur">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.16_35)] text-base font-bold text-primary-foreground">
                {lead.nome.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight">{lead.nome}</h2>
                {lead.empresa && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" /> {lead.empresa}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md bg-surface-3 px-2 py-0.5 text-[11px] font-medium">{STATUS_LABEL[lead.status]}</span>
                  {lead.valor_estimado && Number(lead.valor_estimado) > 0 && (
                    <span className="text-[11px] font-semibold tabular-nums text-success">{formatBRL(Number(lead.valor_estimado))}</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-3 hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-xs hover:border-primary/40 hover:text-primary">
                <Mail className="h-3 w-3" /> Email
              </a>
            )}
            {lead.whatsapp && (
              <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-xs hover:border-success/40 hover:text-success">
                <MessageSquare className="h-3 w-3" /> WhatsApp
              </a>
            )}
            <button
              onClick={() => score.mutate(lead.id)}
              disabled={isScoring}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60"
            >
              {isScoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {lead.ai_score ? "Regenerar IA" : "Analisar IA"}
            </button>
          </div>
        </div>

        {/* IA panel */}
        <section className="border-b border-border p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Análise IA
          </h3>
          {lead.ai_score || lead.ai_resumo || lead.ai_sugestao ? (
            <div className="space-y-3">
              {lead.ai_score != null && lead.ai_score > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-lg text-base font-bold tabular-nums ${
                    lead.ai_score >= 80 ? "bg-success/15 text-success" : lead.ai_score >= 50 ? "bg-warning/15 text-warning" : "bg-surface-3 text-muted-foreground"
                  }`}>{lead.ai_score}</div>
                  <div className="text-xs text-muted-foreground">Score de fechamento (0–100)</div>
                </div>
              )}
              {lead.ai_resumo && (
                <div className="rounded-lg border border-border bg-surface-2 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo</div>
                  <p className="mt-1 text-sm leading-relaxed">{lead.ai_resumo}</p>
                </div>
              )}
              {lead.ai_sugestao && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Próxima ação sugerida</div>
                  <p className="mt-1 text-sm leading-relaxed">{lead.ai_sugestao}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface-2/40 p-6 text-center text-xs text-muted-foreground">
              Clique em "Analisar IA" para gerar score, resumo e próxima ação.
            </div>
          )}
        </section>

        {/* Tasks */}
        <section className="border-b border-border p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tarefas vinculadas <span className="ml-1 text-foreground">{tasks.length}</span>
          </h3>
          <form onSubmit={submitTask} className="mb-3 flex gap-2">
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Nova tarefa..." className="h-9 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm focus:border-primary/60 focus:outline-none" />
            <button type="submit" disabled={createTask.isPending || !taskTitle.trim()} className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> Criar
            </button>
          </form>
          <ul className="space-y-1.5">
            {tasks.map((t) => {
              const done = t.status === "concluida";
              return (
                <li key={t.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <input type="checkbox" checked={done} onChange={(e) => toggle.mutate({ id: t.id, done: e.target.checked })} className="h-4 w-4 accent-primary" />
                  <span className={`flex-1 text-sm ${done ? "text-muted-foreground line-through" : ""}`}>{t.titulo}</span>
                  {t.prazo && <span className="text-[10px] text-muted-foreground tabular-nums">{new Date(t.prazo).toLocaleDateString("pt-BR")}</span>}
                </li>
              );
            })}
            {tasks.length === 0 && <li className="text-xs text-muted-foreground">Nenhuma tarefa.</li>}
          </ul>
        </section>

        {/* Activities timeline */}
        <section className="flex-1 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline <span className="ml-1 text-foreground">{acts.length}</span>
          </h3>
          <form onSubmit={submitAct} className="mb-4 space-y-2 rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex gap-2">
              <select value={actTipo} onChange={(e) => setActTipo(e.target.value as ActivityType)} className="h-9 rounded-lg border border-border bg-surface-1 px-2 text-xs">
                <option value="nota">Nota</option>
                <option value="ligacao">Ligação</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="reuniao">Reunião</option>
              </select>
              <input value={actDesc} onChange={(e) => setActDesc(e.target.value)} placeholder="Descrição..." className="h-9 flex-1 rounded-lg border border-border bg-surface-1 px-3 text-sm focus:border-primary/60 focus:outline-none" />
              <button type="submit" disabled={createAct.isPending || !actDesc.trim()} className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                Registrar
              </button>
            </div>
          </form>
          <ol className="relative space-y-3 border-l border-border pl-5">
            {acts.map((a) => {
              const Icon = TIPO_ICON[a.tipo] ?? MessageSquare;
              return (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[26px] grid h-5 w-5 place-items-center rounded-full border border-border bg-surface-2 text-primary">
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  <div className="rounded-lg border border-border bg-surface-2 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{a.tipo}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{fmtDateTime(a.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{a.descricao}</p>
                  </div>
                </li>
              );
            })}
            {acts.length === 0 && <li className="text-xs text-muted-foreground">Sem atividades ainda.</li>}
          </ol>
        </section>

        {/* footer actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border p-4">
          <button
            onClick={() => { if (confirm(`Remover ${lead.nome}?`)) { del.mutate(lead.id); onClose(); } }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir lead
          </button>
          <button
            onClick={() => setConvertOpen(true)}
            disabled={convert.isPending || lead.status === "fechado"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-success px-3 text-xs font-semibold text-success-foreground shadow-card transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            title={lead.status === "fechado" ? "Lead já fechado" : "Cria cliente vinculado e marca como fechado"}
          >
            {convert.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            {lead.status === "fechado" ? "Já convertido" : "Converter em cliente"}
          </button>
        </div>

        {/* Convert dialog */}
        {convertOpen && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setConvertOpen(false)}>
            <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-elevated" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="text-sm font-semibold">Converter em cliente</h3>
                <button onClick={() => setConvertOpen(false)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-surface-3"><X className="h-4 w-4" /></button>
              </div>
              <div className="max-h-[calc(90vh-110px)] space-y-3 overflow-y-auto p-4">
                <p className="text-xs text-muted-foreground">
                  Vamos criar o cliente <strong className="text-foreground">{lead.nome}</strong>
                  {lead.valor_estimado && Number(lead.valor_estimado) > 0 ? <> e gerar negócio fechado no valor de <strong className="text-foreground">{formatBRL(Number(lead.valor_estimado))}</strong></> : null}.
                </p>

                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-surface-2 p-3">
                  <input type="checkbox" checked={genFin} onChange={(e) => setGenFin(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Gerar entrada financeira?</div>
                    <div className="text-[11px] text-muted-foreground">Cria as cobranças vinculadas ao negócio.</div>
                  </div>
                </label>

                {genFin && (() => {
                  const totalNum = Number(finValor || lead.valor_estimado || 0);
                  const pctNum = Math.max(0, Math.min(100, Number(entradaPct) || 0));
                  const parcNum = Math.max(1, Number(parcelas) || 1);
                  const entradaVal = parcelMode ? Math.round((totalNum * pctNum) / 100 * 100) / 100 : 0;
                  const restante = Math.round((totalNum - entradaVal) * 100) / 100;
                  const parcelaVal = parcelMode ? Math.round((restante / parcNum) * 100) / 100 : 0;
                  return (
                    <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Valor total da venda</span>
                          <input type="number" step="0.01" value={finValor} onChange={(e) => setFinValor(e.target.value)} placeholder={String(Number(lead.valor_estimado ?? 0).toFixed(2))} className="mt-1 h-8 w-full rounded-md border border-border bg-surface-1 px-2 text-sm tabular-nums" />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Categoria</span>
                          <select value={finCat} onChange={(e) => setFinCat(e.target.value as any)} className="mt-1 h-8 w-full rounded-md border border-border bg-surface-1 px-2 text-sm">
                            {(["venda", "assinatura", "servico", "consultoria", "outros"] as const).map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </label>
                      </div>

                      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-surface-1 p-2.5">
                        <input type="checkbox" checked={parcelMode} onChange={(e) => setParcelMode(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                        <div className="flex-1">
                          <div className="text-xs font-semibold">Parcelar venda (sinal + parcelas)</div>
                          <div className="text-[10px] text-muted-foreground">Gera múltiplas cobranças com vencimentos automáticos.</div>
                        </div>
                      </label>

                      {!parcelMode && (
                        <label className="block">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vencimento</span>
                          <input type="date" value={finVenc} onChange={(e) => setFinVenc(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-border bg-surface-1 px-2 text-sm" />
                        </label>
                      )}

                      {parcelMode && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-1 p-0.5">
                            {(["pct", "qtd"] as const).map((m) => (
                              <button key={m} onClick={() => setSplitMode(m)}
                                className={["h-7 flex-1 rounded-md text-[11px] font-medium transition",
                                  splitMode === m ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"].join(" ")}>
                                {m === "pct" ? "Por % de entrada" : "Por nº de parcelas"}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {splitMode === "pct" ? (
                              <label className="block">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Entrada (%)</span>
                                <input type="number" min="0" max="100" step="1" value={entradaPct} onChange={(e) => setEntradaPct(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-border bg-surface-1 px-2 text-sm tabular-nums" />
                              </label>
                            ) : (
                              <label className="block">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sem entrada</span>
                                <div className="mt-1 grid h-8 place-items-center rounded-md border border-dashed border-border text-[11px] text-muted-foreground">0%</div>
                              </label>
                            )}
                            <label className="block">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nº parcelas (restante)</span>
                              <input type="number" min="1" step="1" value={parcelas} onChange={(e) => setParcelas(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-border bg-surface-1 px-2 text-sm tabular-nums" />
                            </label>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">1º vencimento</span>
                              <input type="date" value={primeiraVenc} onChange={(e) => setPrimeiraVenc(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-border bg-surface-1 px-2 text-sm" />
                            </label>
                            <label className="block">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Intervalo (dias)</span>
                              <input type="number" min="1" step="1" value={intervaloDias} onChange={(e) => setIntervaloDias(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-border bg-surface-1 px-2 text-sm tabular-nums" />
                            </label>
                          </div>

                          {splitMode === "pct" && entradaVal > 0 && (
                            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-success/10 px-2.5 py-2">
                              <input type="checkbox" checked={entradaPaga} onChange={(e) => setEntradaPaga(e.target.checked)} className="h-3.5 w-3.5 accent-success" />
                              <span className="text-[11px] font-medium text-success">Entrada já recebida hoje</span>
                            </label>
                          )}

                          {/* Preview */}
                          <div className="rounded-md border border-border bg-surface-2 p-2.5">
                            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo</div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <div className="text-[9px] uppercase text-muted-foreground">Total</div>
                                <div className="text-xs font-bold tabular-nums">{formatBRL(totalNum)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] uppercase text-muted-foreground">Entrada</div>
                                <div className="text-xs font-bold tabular-nums text-success">{formatBRL(entradaVal)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] uppercase text-muted-foreground">Restante</div>
                                <div className="text-xs font-bold tabular-nums text-warning">{formatBRL(restante)}</div>
                              </div>
                            </div>
                            <div className="mt-2 border-t border-border pt-1.5 text-center text-[10px] text-muted-foreground">
                              <strong className="text-foreground">{parcNum}x</strong> de <strong className="text-foreground tabular-nums">{formatBRL(parcelaVal)}</strong> a cada {intervaloDias} dias
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button onClick={() => setConvertOpen(false)} className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-xs hover:border-primary/40">Cancelar</button>
                  <button
                    onClick={async () => {
                      if (!lead) return;
                      const totalNum = Number(finValor || lead.valor_estimado || 0);
                      await convert.mutateAsync({
                        lead,
                        options: genFin ? {
                          generateFinancial: true,
                          finCategoria: finCat,
                          finVencimento: finVenc || null,
                          finValor: totalNum || undefined,
                          installments: parcelMode ? {
                            enabled: true,
                            totalValor: totalNum,
                            entradaPct: splitMode === "pct" ? Number(entradaPct) || 0 : 0,
                            entradaPaga,
                            parcelas: Math.max(1, Number(parcelas) || 1),
                            primeiraVenc: primeiraVenc || null,
                            intervaloDias: Math.max(1, Number(intervaloDias) || 30),
                            categoria: finCat,
                          } : undefined,
                        } : undefined,
                      });
                      setConvertOpen(false);
                      onClose();
                    }}
                    disabled={convert.isPending}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-success px-3 text-xs font-semibold text-success-foreground shadow-card disabled:opacity-50"
                  >
                    {convert.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                    Confirmar conversão
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
