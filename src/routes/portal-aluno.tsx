import { createFileRoute } from "@tanstack/react-router";
import { useMyStudentProfile, useStudentGrades, useStudentAttendance } from "@/hooks/use-school";
import { AppShell } from "@/components/app-shell";
import { GraduationCap, BookOpen, CalendarCheck } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/portal-aluno")({ component: Portal });

function Portal() {
  const { data: student, isLoading } = useMyStudentProfile();
  const { data: grades = [] } = useStudentGrades(student?.id ?? null);
  const { data: attendance = [] } = useStudentAttendance(student?.id ?? null);

  const freq = useMemo(() => {
    if (!attendance.length) return 0;
    const ok = attendance.filter((a: any) => a.status === "presente" || a.status === "justificada").length;
    const meio = attendance.filter((a: any) => a.status === "atrasado").length * 0.5;
    return ((ok + meio) / attendance.length) * 100;
  }, [attendance]);

  return (
    <AppShell title="Portal do Aluno" subtitle="Acompanhe suas notas, frequência e histórico.">
      {isLoading ? <p>Carregando...</p> : !student ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Sua conta ainda não está vinculada a um aluno.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-surface-1 p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.16_35)] text-lg font-bold text-primary-foreground">
                {student.nome.split(" ").map((s) => s[0]).slice(0,2).join("").toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{student.nome}</h2>
                <p className="text-xs text-muted-foreground">Matrícula: {student.matricula ?? "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Frequência" value={attendance.length ? freq.toFixed(0) + "%" : "—"} icon={CalendarCheck} />
            <Stat label="Avaliações" value={grades.length} icon={BookOpen} />
            <Stat label="Aulas registradas" value={attendance.length} icon={CalendarCheck} />
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 shadow-card">
            <div className="border-b border-border px-5 py-3"><h3 className="text-sm font-semibold">Notas</h3></div>
            <ul className="divide-y divide-border">
              {grades.map((g: any) => (
                <li key={g.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-medium">{g.assessment?.titulo}</div>
                    <div className="text-xs text-muted-foreground">{g.assessment?.tipo} · peso {g.assessment?.peso}</div>
                  </div>
                  <div className="text-right"><span className="text-lg font-semibold">{g.nota ?? "—"}</span><span className="text-xs text-muted-foreground"> / {g.assessment?.nota_maxima}</span></div>
                </li>
              ))}
              {grades.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma nota lançada.</li>}
            </ul>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}
