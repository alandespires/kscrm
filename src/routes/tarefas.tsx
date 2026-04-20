import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PrimaryButton, StatusPill } from "@/components/app-shell";
import { TASKS } from "@/lib/mock-data";
import { Plus, Calendar, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas — Nexus CRM" }] }),
  component: TarefasPage,
});

function TarefasPage() {
  const groups = [
    { label: "Hoje", items: TASKS.filter((t) => t.due.startsWith("Hoje")) },
    { label: "Próximas", items: TASKS.filter((t) => !t.due.startsWith("Hoje")) },
  ];
  return (
    <AppShell title="Tarefas" subtitle="Follow-ups e ações comerciais priorizadas"
      action={<PrimaryButton icon={Plus}>Nova tarefa</PrimaryButton>}>
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((g) => (
          <div key={g.label} className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{g.label}</h3>
                <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{g.items.length}</span>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {g.items.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-surface-1/50">
                  <button>{t.done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />}</button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    <div className="text-[11px] text-muted-foreground">{t.due}</div>
                  </div>
                  <StatusPill tone={t.priority === "Alta" ? "danger" : "warn"}>{t.priority}</StatusPill>
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-surface-3 text-[10px] font-bold">{t.owner}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AppShell>
  );
}