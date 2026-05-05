import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { GraduationCap, LayoutDashboard, BookMarked, Users, IdCard, ClipboardList, FileText, CalendarCheck, Bell, Cog } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/escolar")({
  component: EscolarLayout,
});

const SUB = [
  { to: "/escolar", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/escolar/cursos", label: "Cursos", icon: BookMarked },
  { to: "/escolar/turmas", label: "Turmas", icon: Users },
  { to: "/escolar/alunos", label: "Alunos", icon: GraduationCap },
  { to: "/escolar/professores", label: "Professores", icon: IdCard },
  { to: "/escolar/diario", label: "Diário", icon: ClipboardList },
  { to: "/escolar/avaliacoes", label: "Avaliações", icon: FileText },
  { to: "/escolar/frequencia", label: "Frequência", icon: CalendarCheck },
  { to: "/escolar/comunicacao", label: "Comunicação", icon: Bell },
  { to: "/escolar/configuracoes", label: "Configurações", icon: Cog },
];

function EscolarLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AppShell
      title="KS Escolar"
      subtitle="Sistema pedagógico completo — turmas, notas, frequência e portal do aluno."
      action={
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <GraduationCap className="h-3.5 w-3.5" />
          Módulo Educacional
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface-1 p-1.5">
        {SUB.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to as any}
              className={[
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active ? "bg-surface-3 text-foreground shadow-card" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              ].join(" ")}
            >
              <Icon className={["h-4 w-4", active ? "text-primary" : ""].join(" ")} />
              {label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </AppShell>
  );
}
