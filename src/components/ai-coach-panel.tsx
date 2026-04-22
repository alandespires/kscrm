import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, X, Zap, AlertCircle, TrendingUp, RefreshCw, Send, MessageSquare, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAiCoach, type CoachAction } from "@/hooks/use-ai-coach";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

type ChatMsg = { role: "user" | "assistant"; content: string };

const SUGESTOES_RAPIDAS = [
  "Como está meu faturamento este mês?",
  "Quais leads quentes preciso atacar agora?",
  "Gere um relatório de inadimplência",
  "O que posso melhorar no meu pipeline?",
];

/** Botão compacto que abre o painel KassIA com sugestões + conversa. */
export function AiCoachButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"sugestoes" | "chat">("chat");

  return (
    <>
      <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
        Conversar com a IA
      </button>
      {open && <KassiaPanel onClose={() => setOpen(false)} tab={tab} setTab={setTab} />}
    </>
  );
}

function KassiaPanel({ onClose, tab, setTab }: { onClose: () => void; tab: "sugestoes" | "chat"; setTab: (t: "sugestoes" | "chat") => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-surface-1 shadow-elevated">
        <div className="border-b border-border bg-surface-1/95 backdrop-blur">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.16_35)] text-primary-foreground shadow-glow">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">KassIA</h2>
                <p className="text-[11px] text-muted-foreground">Sua copiloto inteligente do KS CRM</p>
              </div>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-3"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex gap-1 px-3 pb-2">
            <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquare}>Conversar</TabBtn>
            <TabBtn active={tab === "sugestoes"} onClick={() => setTab("sugestoes")} icon={Lightbulb}>Sugestões</TabBtn>
          </div>
        </div>

        {tab === "sugestoes" ? <SugestoesView /> : <ChatView />}
      </aside>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: any; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function SugestoesView() {
  const coach = useAiCoach();
  useEffect(() => {
    if (!coach.data && !coach.isPending) coach.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-3 flex items-center justify-end">
        <button
          onClick={() => coach.mutate()}
          disabled={coach.isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${coach.isPending ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>
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
  );
}

function ChatView() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Olá! Eu sou a **KassIA** 👋\n\nPosso ajudar com relatórios, dúvidas sobre o CRM, análises de leads, financeiro e estratégias de venda. O que você quer ver hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    const next: ChatMsg[] = [...messages, { role: "user", content }, { role: "assistant", content: "" }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/kassia-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({
          messages: next.filter((m) => m.content || m.role === "user").slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (resp.status === 429) throw new Error("Muitas requisições. Aguarde alguns segundos.");
      if (resp.status === 402) throw new Error("Créditos de IA esgotados.");
      if (!resp.ok || !resp.body) throw new Error("Falha ao conectar com a KassIA");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages((cur) => {
                const copy = [...cur];
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
            }
          } catch {
            /* ignore parse errors on partial chunks */
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erro na KassIA");
      setMessages((cur) => {
        const copy = [...cur];
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${e.message ?? "Erro ao responder."}` };
        return copy;
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface-2 text-foreground"
              }`}
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_table]:text-xs [&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px]">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        {messages.length <= 1 && !sending && (
          <div className="space-y-1.5 pt-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sugestões</p>
            {SUGESTOES_RAPIDAS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-xs text-foreground transition hover:border-primary/40 hover:bg-surface-3"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-border bg-surface-1 p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-2 p-1.5 focus-within:border-primary/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Pergunte qualquer coisa para a KassIA..."
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </form>
    </div>
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
