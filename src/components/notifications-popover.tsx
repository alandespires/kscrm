import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, Trash2, Sparkles, Users, Wallet, ListChecks, Building2, Flame, Snowflake, Zap, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ICONS: Record<string, any> = {
  lead_novo: Users,
  lead_quente: Flame,
  lead_frio: Snowflake,
  status_mudou: ArrowRightLeft,
  tarefa_criada: ListChecks,
  tarefa_atrasada: AlertTriangle,
  tarefa_concluida: Check,
  financeiro_vencendo: Wallet,
  financeiro_atrasado: AlertTriangle,
  financeiro_recebido: Wallet,
  cliente_novo: Building2,
  automacao_executada: Zap,
  insight_ia: Sparkles,
  sistema: Bell,
};

const TONE: Record<string, string> = {
  urgente: "text-destructive",
  alta: "text-warning",
  media: "text-primary",
  baixa: "text-muted-foreground",
};

export function NotificationsPopover() {
  const { list, unread, markRead, markAllRead, remove, clearAll } = useNotifications();
  const navigate = useNavigate();

  function handleClick(n: Notification) {
    if (!n.lida) markRead.mutate(n.id);
    if (n.link) navigate({ to: n.link as any });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface-1 text-muted-foreground transition hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-glow">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Notificações</div>
            <div className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Tudo em dia"}
            </div>
          </div>
          <div className="flex gap-1">
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                title="Marcar todas como lidas"
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </button>
            )}
            {list.length > 0 && (
              <button
                onClick={() => clearAll.mutate()}
                title="Limpar tudo"
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[440px] overflow-y-auto">
          {list.length === 0 ? (
            <div className="grid place-items-center gap-2 px-4 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">Nenhuma notificação</div>
              <div className="text-xs text-muted-foreground">Você será avisado por aqui.</div>
            </div>
          ) : (
            list.map((n) => {
              const Icon = ICONS[n.tipo] ?? Bell;
              const tone = TONE[n.prioridade] ?? "text-primary";
              return (
                <div
                  key={n.id}
                  className={[
                    "group flex gap-3 border-b border-border/60 px-4 py-3 transition hover:bg-surface-2/60",
                    !n.lida ? "bg-primary/[0.04]" : "",
                  ].join(" ")}
                >
                  <button onClick={() => handleClick(n)} className="flex flex-1 gap-3 text-left">
                    <div className={["mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2", tone].join(" ")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="line-clamp-1 flex-1 text-sm font-medium">{n.titulo}</div>
                        {!n.lida && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      {n.descricao && (
                        <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.descricao}</div>
                      )}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => remove.mutate(n.id)}
                    title="Remover"
                    className="self-start opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
