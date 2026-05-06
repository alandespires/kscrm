import { createFileRoute, Link } from "@tanstack/react-router";
import { useSchoolDashboard, useTodayClasses, useTeacherAlerts } from "@/hooks/use-school";
import { Users, GraduationCap, BookCheck, AlertTriangle, ArrowRight, Clock, FileWarning, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/escolar/")({ component: SchoolDashboard });

function SchoolDashboard() {
  const { data } = useSchoolDashboard();
  const today = useTodayClasses();
  const { data: alerts } = useTeacherAlerts();

  const alunosHoje = today.length * 0; // computed via stats per class — leave as turmas count anchor
  const concluidas = today.filter((c) => c.status !== "ativo").length;
  const pendencias = (alerts?.avaliacoesPendentes?.length ?? 0) + (alerts?.alunosRisco?.length ?? 0);

  const kpis = [
    { label: "Turmas hoje", value: today.length, icon: CalendarDays, accent: "text-primary" },
    { label: "Total de alunos", value: data?.alunos ?? 0, icon: GraduationCap, accent: "text-accent" },
    { label: "Aulas concluídas", value: concluidas, icon: BookCheck, accent: "text-success" },
    { label: "Pendências", value: pendencias, icon: AlertTriangle, accent: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="group rounded-2xl border border-border bg-surface-2 p-5 shadow-card transition hover:border-primary/40">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</span>
                <Icon className={`h-4 w-4 ${k.accent}`} />
              </div>
              <div className="text-4xl font-bold tracking-tight">{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Turmas do dia */}
      <section className="rounded-2xl border border-border bg-surface-2 shadow-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Turmas de hoje</h2>
            <p className="text-xs text-muted-foreground">Tudo que você precisa fazer agora.</p>
          </div>
          <Link to="/escolar/mapa" className="text-xs font-semibold text-primary hover:underline">Ver semana →</Link>
        </header>
        <div className="divide-y divide-border">
          {today.length === 0 && (
            <div className="px-5 py-10 text-center">
              <CalendarDays className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">Sem turmas agendadas para hoje.</p>
            </div>
          )}
          {today.map((c: any) => (
            <Link
              key={c.id}
              to="/escolar/turma/$classId"
              params={{ classId: c.id }}
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface-3"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface-1 font-bold text-primary" style={{ background: c.course?.cor ? `${c.course.cor}1a` : undefined }}>
                {c.nome.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.nome}</div>
                <div className="truncate text-xs text-muted-foreground">{c.course?.nome ?? "—"} · {c.teacher?.nome ?? "Sem professor"}</div>
              </div>
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <Clock className="h-3.5 w-3.5" />{c.horario ?? "—"}
              </div>
              <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-card">
                Entrar <ArrowRight className="ml-1 inline h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Alertas inteligentes */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold">Alunos em risco</h3>
          </div>
          {alerts?.alunosRisco?.length ? (
            <ul className="space-y-2">
              {alerts.alunosRisco.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="font-medium">{a.nome}</span>
                  <span className="text-xs text-warning">{a.faltas}/{a.total} faltas</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum aluno com faltas críticas. ✨</p>
          )}
        </div>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold">Notas pendentes</h3>
          </div>
          {alerts?.avaliacoesPendentes?.length ? (
            <ul className="space-y-2">
              {alerts.avaliacoesPendentes.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="truncate font-medium">{a.titulo}</span>
                  <span className="text-xs text-destructive">{a.faltam} sem nota</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Tudo em dia. 🎯</p>
          )}
        </div>
      </section>

      {/* Atalhos rápidos */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link to="/escolar/mapa" className="group rounded-2xl border border-border bg-surface-2 p-5 shadow-card transition hover:border-primary/40">
          <CalendarDays className="mb-2 h-5 w-5 text-primary" />
          <div className="text-sm font-semibold">Mapa de turmas</div>
          <div className="text-xs text-muted-foreground">Visão semanal</div>
        </Link>
        <Link to="/escolar/alunos" className="group rounded-2xl border border-border bg-surface-2 p-5 shadow-card transition hover:border-primary/40">
          <Users className="mb-2 h-5 w-5 text-primary" />
          <div className="text-sm font-semibold">Gestão pedagógica</div>
          <div className="text-xs text-muted-foreground">Alunos · Cursos · Turmas</div>
        </Link>
        <Link to="/escolar/comunicacao" className="group rounded-2xl border border-border bg-surface-2 p-5 shadow-card transition hover:border-primary/40">
          <BookCheck className="mb-2 h-5 w-5 text-primary" />
          <div className="text-sm font-semibold">Comunicação</div>
          <div className="text-xs text-muted-foreground">Avisos para turmas e alunos</div>
        </Link>
      </div>
    </div>
  );
}
