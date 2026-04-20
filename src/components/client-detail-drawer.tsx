import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Building2, Mail, Phone, Sparkles, Loader2, CheckCircle2, MessageSquare, Calendar, RefreshCw, ArrowRightLeft } from "lucide-react";
import type { ClientRow } from "@/hooks/use-clients";
import { formatBRL } from "@/lib/mock-data";

const TIPO_ICON: Record<string, any> = {
  ligacao: Phone, email: Mail, whatsapp: MessageSquare, reuniao: Calendar,
  nota: MessageSquare, movimentacao: RefreshCw, tarefa: Calendar,
};

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ClientDetailDrawer({ client, onClose }: { client: ClientRow | null; onClose: () => void }) {
  const open = !!client;

  // Lead original (se houver)
  const leadQ = useQuery({
    queryKey: ["client-lead", client?.lead_id],
    enabled: !!client?.lead_id,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", client!.lead_id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Activities herdadas: do lead original + do próprio cliente
  const activitiesQ = useQuery({
    queryKey: ["client-activities", client?.id, client?.lead_id],
    enabled: !!client,
    queryFn: async () => {
      const filters: string[] = [];
      if (client!.id) filters.push(`client_id.eq.${client!.id}`);
      if (client!.lead_id) filters.push(`lead_id.eq.${client!.lead_id}`);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .or(filters.join(","))
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Deals fechados vinculados
  const dealsQ = useQuery({
    queryKey: ["client-deals", client?.lead_id],
    enabled: !!client?.lead_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("lead_id", client!.lead_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!open || !client) return null;

  const lead = leadQ.data;
  const activities = activitiesQ.data ?? [];
  const deals = dealsQ.data ?? [];
  const dealsFechados = deals.filter((d: any) => d.stage === "fechado");
  const totalConvertido = dealsFechados.reduce((a: number, d: any) => a + Number(d.valor ?? 0), 0);

  // Conversão = activity de movimentacao com action=convert_to_client OU primeira fechado
  const conversao = activities.find((a: any) => a.metadata?.action === "convert_to_client");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-surface-1 shadow-elevated">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface-1/95 backdrop-blur">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-surface-3 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight">{client.empresa || client.nome}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{client.nome}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {client.contrato_valor && Number(client.contrato_valor) > 0 && (
                    <span className="rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-success">
                      {formatBRL(Number(client.contrato_valor))}/mês
                    </span>
                  )}
                  {client.contrato_inicio && (
                    <span className="text-[11px] text-muted-foreground">desde {fmtDate(client.contrato_inicio)}</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-3"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
            {client.email && (
              <a href={`mailto:${client.email}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-xs hover:border-primary/40 hover:text-primary">
                <Mail className="h-3 w-3" /> {client.email}
              </a>
            )}
            {client.whatsapp && (
              <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-xs hover:border-success/40 hover:text-success">
                <MessageSquare className="h-3 w-3" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Histórico de conversão */}
        <section className="border-b border-border p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <ArrowRightLeft className="h-3 w-3" /> Histórico de conversão
          </h3>
          {leadQ.isLoading ? (
            <div className="grid place-items-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : !lead ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-2/40 p-4 text-center text-xs text-muted-foreground">
              Cliente cadastrado manualmente — sem lead de origem.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lead original</div>
                  {lead.ai_score != null && lead.ai_score > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Sparkles className="h-2.5 w-2.5" /> {lead.ai_score}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm font-semibold">{lead.nome}{lead.empresa ? ` · ${lead.empresa}` : ""}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <Stat label="Origem" value={lead.origem || "—"} />
                  <Stat label="Interesse" value={lead.interesse || "—"} />
                  <Stat label="Valor estimado" value={lead.valor_estimado ? formatBRL(Number(lead.valor_estimado)) : "—"} />
                </div>
                {lead.ai_resumo && (
                  <p className="mt-3 rounded-md border border-border bg-surface-1 p-2.5 text-[11px] leading-relaxed text-muted-foreground">{lead.ai_resumo}</p>
                )}
                {lead.tags && lead.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {lead.tags.map((t: string) => (
                      <span key={t} className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MetricCard label="Criado em" value={fmtDate(lead.created_at)} />
                <MetricCard label="Convertido em" value={conversao ? fmtDate(conversao.created_at) : fmtDate(client.created_at)} />
                <MetricCard label="Total fechado" value={formatBRL(totalConvertido)} />
              </div>

              {dealsFechados.length > 0 && (
                <div className="rounded-lg border border-border bg-surface-2 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Negócios fechados</div>
                  <ul className="mt-2 space-y-1.5">
                    {dealsFechados.map((d: any) => (
                      <li key={d.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-success" /> {d.titulo}</span>
                        <span className="font-semibold tabular-nums text-success">{formatBRL(Number(d.valor))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Timeline herdada */}
        <section className="flex-1 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline completa <span className="ml-1 text-foreground">{activities.length}</span>
          </h3>
          {activitiesQ.isLoading ? (
            <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <ol className="relative space-y-3 border-l border-border pl-5">
              {activities.length === 0 && <li className="text-xs text-muted-foreground">Sem atividades registradas.</li>}
              {activities.map((a: any) => {
                const Icon = TIPO_ICON[a.tipo] ?? MessageSquare;
                const fromLead = a.lead_id && a.lead_id === client.lead_id && !a.client_id;
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[26px] grid h-5 w-5 place-items-center rounded-full border border-border bg-surface-2 text-primary">
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                    <div className="rounded-lg border border-border bg-surface-2 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{a.tipo}</span>
                          {fromLead && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary">Herdado do lead</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{fmtDateTime(a.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed">{a.descricao}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-1 p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-xs font-medium" title={value}>{value}</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-2.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs font-semibold tabular-nums">{value}</div>
    </div>
  );
}
