import { createFileRoute, Link } from "@tanstack/react-router";
import { useSchoolDashboard } from "@/hooks/use-school";
import { BookMarked, Users, GraduationCap, IdCard, ClipboardList, Bell } from "lucide-react";

export const Route = createFileRoute("/escolar/")({
  component: SchoolDashboard,
});

function SchoolDashboard() {
  const { data, isLoading } = useSchoolDashboard();
  const kpis = [
    { label: "Cursos ativos", value: data?.cursos ?? 0, icon: BookMarked },
    { label: "Turmas ativas", value: data?.turmas ?? 0, icon: Users },
    { label: "Alunos", value: data?.alunos ?? 0, icon: GraduationCap },
    { label: "Professores", value: data?.professores ?? 0, icon: IdCard },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-border bg-surface-2 p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-semibold tracking-tight">{isLoading ? "—" : k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-2 p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Últimas aulas</h3>
          </div>
          {data?.ultimasAulas?.length ? (
            <ul className="divide-y divide-border">
              {data.ultimasAulas.map((l: any) => (
                <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate font-medium">{l.titulo}</span>
                  <span className="text-xs text-muted-foreground">{new Date(l.data).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma aula registrada ainda.</p>
          )}
          <Link to="/escolar/diario" className="mt-4 inline-block text-xs font-semibold text-primary">Abrir diário →</Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Comunicados recentes</h3>
          </div>
          {data?.ultimosComunicados?.length ? (
            <ul className="divide-y divide-border">
              {data.ultimosComunicados.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate font-medium">{a.titulo}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum comunicado.</p>
          )}
          <Link to="/escolar/comunicacao" className="mt-4 inline-block text-xs font-semibold text-primary">Enviar comunicado →</Link>
        </div>
      </div>
    </div>
  );
}
