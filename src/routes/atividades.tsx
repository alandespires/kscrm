import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Phone, Mail, MessageSquare, Users as UsersIcon, StickyNote, ArrowRightLeft,
  ListChecks, Search, Filter, X, Calendar, Loader2, Activity as ActivityIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAllActivities, type ActivityFilters } from "@/hooks/use-all-activities";
import { useLeads } from "@/hooks/use-leads";
import { useClients } from "@/hooks/use-clients";
import type { ActivityType } from "@/hooks/use-activities";

export const Route = createFileRoute("/atividades")({ component: AtividadesPage });

const TIPO_META: Record<ActivityType, { label: string; icon: any; tone: string }> = {
  ligacao:      { label: "Ligação",      icon: Phone,         tone: "text-[oklch(0.7_0.13_220)] bg-[oklch(0.7_0.13_220)/0.15]" },
  email:        { label: "Email",        icon: Mail,          tone: "text-warning bg-warning/15" },
  whatsapp:     { label: "WhatsApp",     icon: MessageSquare, tone: "text-success bg-success/15" },
  reuniao:      { label: "Reunião",      icon: UsersIcon,     tone: "text-primary bg-primary/15" },
  nota:         { label: "Nota",         icon: StickyNote,    tone: "text-muted-foreground bg-surface-3" },
  movimentacao: { label: "Movimentação", icon: ArrowRightLeft,tone: "text-primary bg-primary/15" },
  tarefa:       { label: "Tarefa",       icon: ListChecks,    tone: "text-warning bg-warning/15" },
};
const ALL_TIPOS = Object.keys(TIPO_META) as ActivityType[];

const RANGES = [
  { id: "7d",  label: "7 dias",  days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "90d", label: "90 dias", days: 90 },
  { id: "all", label: "Tudo",    days: 0 },
] as const;

function AtividadesPage() {
  const [tipos, setTipos] = useState<ActivityType[]>([]);
  const [leadId, setLeadId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<typeof RANGES[number]["id"]>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { data: leads = [] } = useLeads();
  const { data: clients = [] } = useClients();

  const filters = useMemo<ActivityFilters>(() => {
    let from: string | null = null;
    let to: string | null = null;
    if (customFrom) from = new Date(customFrom + "T00:00:00").toISOString();
    if (customTo) to = new Date(customTo + "T23:59:59").toISOString();
    if (!from && !to && range !== "all") {
      const r = RANGES.find((x) => x.id === range)!;
      from = new Date(Date.now() - r.days * 86400000).toISOString();
    }
    return {
      tipos: tipos.length ? tipos : undefined,
      leadId: leadId || null,
      clientId: clientId || null,
      from, to,
      search: search.trim() || undefined,
    };
  }, [tipos, leadId, clientId, search, range, customFrom, customTo]);

  const { data: activities = [], isLoading } = useAllActivities(filters);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof activities>();
    for (const a of activities) {
      const d = new Date(a.created_at);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries()); // already sorted by query
  }, [activities]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of activities) c[a.tipo] = (c[a.tipo] ?? 0) + 1;
    return c;
  }, [activities]);

  const leadsById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  function toggleTipo(t: ActivityType) {
    setTipos((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function clearFilters() {
    setTipos([]); setLeadId(""); setClientId(""); setSearch("");
    setRange("30d"); setCustomFrom(""); setCustomTo("");
  }

  const hasFilters = tipos.length > 0 || leadId || clientId || search || customFrom || customTo || range !== "30d";

  return (
    <AppShell title="Atividades" subtitle="Linha do tempo completa do CRM">
      {/* Filtros */}
      <div className="mb-5 rounded-2xl border border-border bg-surface-1 p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar na descrição..."
              className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm focus:border-primary/60 focus:outline-none"
            />
          </div>
          <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-xs focus:border-primary/60 focus:outline-none">
            <option value="">Todos os leads</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-xs focus:border-primary/60 focus:outline-none">
            <option value="">Todos os clientes</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-0.5">
            {RANGES.map((r) => (
              <button key={r.id} onClick={() => { setRange(r.id); setCustomFrom(""); setCustomTo(""); }}
                className={["h-8 rounded-md px-2.5 text-[11px] font-medium transition",
                  range === r.id && !customFrom && !customTo ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"].join(" ")}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 bg-transparent text-xs focus:outline-none" />
            <span className="text-muted-foreground">→</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 bg-transparent text-xs focus:outline-none" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface-2 px-3 text-xs text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" /> Limpar
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3 w-3" /> Tipos
          </span>
          {ALL_TIPOS.map((t) => {
            const meta = TIPO_META[t];
            const active = tipos.includes(t);
            const Icon = meta.icon;
            return (
              <button key={t} onClick={() => toggleTipo(t)}
                className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                  active ? "bg-primary text-primary-foreground shadow-glow" : "border border-border bg-surface-2 text-muted-foreground hover:text-foreground"].join(" ")}>
                <Icon className="h-3 w-3" />
                {meta.label}
                {counts[t] ? <span className={["ml-0.5 rounded px-1 text-[10px]", active ? "bg-primary-foreground/20" : "bg-surface-3"].join(" ")}>{counts[t]}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-border bg-surface-1 p-5 shadow-card">
        {isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : activities.length === 0 ? (
          <div className="grid place-items-center gap-2 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2"><ActivityIcon className="h-5 w-5 text-muted-foreground" /></div>
            <div className="text-sm font-medium">Nenhuma atividade encontrada</div>
            <div className="text-xs text-muted-foreground">Ajuste os filtros ou registre interações nos leads e clientes.</div>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, items]) => (
              <section key={date}>
                <header className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-2 bg-surface-1/95 px-1 py-1 backdrop-blur">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDateHeader(date)}
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] text-muted-foreground">{items.length}</span>
                </header>
                <ol className="relative ml-2 space-y-2.5 border-l border-dashed border-border pl-5">
                  {items.map((a) => {
                    const meta = TIPO_META[a.tipo];
                    const Icon = meta.icon;
                    const lead = a.lead_id ? leadsById.get(a.lead_id) : null;
                    const client = a.client_id ? clientsById.get(a.client_id) : null;
                    return (
                      <li key={a.id} className="relative">
                        <span className={["absolute -left-[27px] top-1 grid h-6 w-6 place-items-center rounded-full ring-4 ring-surface-1", meta.tone].join(" ")}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 transition hover:border-primary/30">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-snug text-foreground">{a.descricao}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <span className={["h-1.5 w-1.5 rounded-full", meta.tone.split(" ")[0].replace("text-", "bg-")].join(" ")} />
                                  {meta.label}
                                </span>
                                {lead && <span>· Lead: <span className="text-foreground">{lead.nome}</span></span>}
                                {client && <span>· Cliente: <span className="text-foreground">{client.nome}</span></span>}
                              </div>
                            </div>
                            <time className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                              {new Date(a.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </time>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function formatDateHeader(iso: string) {
  const d = new Date(iso + "T12:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const cmp = new Date(d); cmp.setHours(0,0,0,0);
  const diff = Math.round((today.getTime() - cmp.getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
