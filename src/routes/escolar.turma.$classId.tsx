import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  useClasses, useEnrollments, useLessons, useUpsertLesson,
  useAttendance, useSetAttendance, useAssessments, useUpsertAssessment,
  useGrades, useSetGrade, useClassStats,
} from "@/hooks/use-school";
import { Check, X, Clock, FileWarning, ArrowLeft, Plus, Sparkles, CheckCheck, BookOpen, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/escolar/turma/$classId")({ component: ClassConsole });

const STATUSES = [
  { v: "presente", label: "P", icon: Check, cls: "bg-success/15 text-success border-success/40", title: "Presente" },
  { v: "falta", label: "F", icon: X, cls: "bg-destructive/15 text-destructive border-destructive/40", title: "Falta" },
  { v: "atrasado", label: "A", icon: Clock, cls: "bg-warning/15 text-warning border-warning/40", title: "Atrasado" },
  { v: "justificada", label: "J", icon: FileWarning, cls: "bg-muted text-muted-foreground border-border", title: "Justificada" },
] as const;

function ClassConsole() {
  const { classId } = Route.useParams();
  const { data: classes = [] } = useClasses();
  const klass = classes.find((c) => c.id === classId);
  const { data: enrollments = [] } = useEnrollments(classId);
  const { data: lessons = [] } = useLessons(classId);
  const { data: stats } = useClassStats(classId);

  const [tab, setTab] = useState<"hoje" | "notas" | "diario">("hoje");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/escolar" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
      </div>

      {/* Header da turma */}
      <header className="rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-surface-1 p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">{klass?.course?.nome ?? "Turma"}</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{klass?.nome ?? "—"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{klass?.teacher?.nome ?? "Sem professor"} · {klass?.horario ?? "—"} · Sala {klass?.sala ?? "—"}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Alunos" value={stats?.alunos ?? enrollments.length} />
            <Stat label="Presença" value={stats?.presencaPct != null ? `${stats.presencaPct}%` : "—"} accent={stats?.presencaPct != null && stats.presencaPct < 75 ? "text-warning" : "text-success"} />
            <Stat label="Média" value={stats?.media != null ? stats.media.toFixed(1) : "—"} accent={stats?.media != null && stats.media < 6 ? "text-destructive" : "text-foreground"} />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="inline-flex gap-1 rounded-xl border border-border bg-surface-1 p-1">
        {[
          { v: "hoje", label: "Aula de hoje", icon: CheckCheck },
          { v: "notas", label: "Notas", icon: BookOpen },
          { v: "diario", label: "Diário", icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.v;
          return (
            <button key={t.v} onClick={() => setTab(t.v as any)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-surface-3 text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === "hoje" && <TodayBoard classId={classId} enrollments={enrollments} lessons={lessons} />}
      {tab === "notas" && <GradesBoard classId={classId} enrollments={enrollments} />}
      {tab === "diario" && <DiaryList lessons={lessons} />}
    </div>
  );
}

function Stat({ label, value, accent = "text-foreground" }: { label: string; value: any; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function TodayBoard({ classId, enrollments, lessons }: any) {
  const upsertLesson = useUpsertLesson();
  const today = new Date().toISOString().slice(0, 10);
  const todayLesson = lessons.find((l: any) => l.data === today) ?? lessons[0];
  const [lessonId, setLessonId] = useState<string | null>(todayLesson?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ titulo: `Aula ${new Date().toLocaleDateString("pt-BR")}`, data: today, conteudo: "" });
  const { data: attendance = [] } = useAttendance(lessonId);
  const setAtt = useSetAttendance();
  const map = useMemo(() => new Map(attendance.map((a: any) => [a.student_id, a.status])), [attendance]);

  const markAllPresent = () => {
    if (!lessonId) return;
    enrollments.forEach((e: any) => setAtt.mutate({ lesson_id: lessonId, student_id: e.student_id, status: "presente" }));
  };

  if (!lessonId) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center shadow-card">
        <CheckCheck className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h3 className="mb-1 text-base font-semibold">Pronto para começar a aula?</h3>
        <p className="mb-4 text-sm text-muted-foreground">Crie a aula de hoje e lance presença em segundos.</p>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Iniciar aula</Button>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova aula</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
              <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
              <div><Label>Plano de aula</Label><Textarea rows={3} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
              <Button onClick={async () => {
                const id = await upsertLesson.mutateAsync({ ...form, class_id: classId });
                setLessonId(id); setCreating(false);
              }}>Criar e abrir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-2 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <select className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            {lessons.map((l: any) => <option key={l.id} value={l.id}>{new Date(l.data).toLocaleDateString("pt-BR")} · {l.titulo}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">{enrollments.length} alunos</span>
        </div>
        <Button size="sm" variant="outline" onClick={markAllPresent}><CheckCheck className="h-4 w-4" /> Todos presentes</Button>
      </div>

      <ul className="divide-y divide-border">
        {enrollments.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Sem alunos matriculados nesta turma.</li>}
        {enrollments.map((e: any) => {
          const cur = map.get(e.student_id);
          return (
            <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-surface-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-xs font-bold text-primary">
                  {e.student?.nome?.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <span className="truncate text-sm font-medium">{e.student?.nome}</span>
              </div>
              <div className="flex gap-1">
                {STATUSES.map((s) => (
                  <button key={s.v} title={s.title}
                    onClick={() => setAtt.mutate({ lesson_id: lessonId, student_id: e.student_id, status: s.v as any })}
                    className={`grid h-9 w-9 place-items-center rounded-lg border text-xs font-bold transition ${cur === s.v ? s.cls : "border-border text-muted-foreground hover:bg-surface-1"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GradesBoard({ classId, enrollments }: any) {
  const { data: assessments = [] } = useAssessments(classId);
  const upsertA = useUpsertAssessment();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo: "prova", peso: 1, nota_maxima: 10, data: new Date().toISOString().slice(0,10) });
  const current = assessments.find((a: any) => a.id === assessmentId) ?? assessments[0];
  const activeId = current?.id ?? null;
  const { data: grades = [] } = useGrades(activeId);
  const setGrade = useSetGrade();
  const map = useMemo(() => new Map(grades.map((g: any) => [g.student_id, g.nota])), [grades]);

  return (
    <div className="rounded-2xl border border-border bg-surface-2 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <select className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" value={activeId ?? ""} onChange={(e) => setAssessmentId(e.target.value)}>
            <option value="">— escolher avaliação —</option>
            {assessments.map((a: any) => <option key={a.id} value={a.id}>{a.titulo} ({a.tipo}, max {a.nota_maxima})</option>)}
          </select>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova avaliação</Button>
      </div>

      {!activeId ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Crie ou selecione uma avaliação para lançar notas.</div>
      ) : (
        <ul className="divide-y divide-border">
          {enrollments.map((e: any) => {
            const cur = map.get(e.student_id);
            return (
              <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm font-medium">{e.student?.nome}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" step="0.1" min={0} max={current?.nota_maxima ?? 10}
                    defaultValue={cur ?? ""}
                    className="h-9 w-24 text-right"
                    onBlur={(ev) => {
                      const v = ev.target.value === "" ? null : Number(ev.target.value);
                      setGrade.mutate({ assessment_id: activeId!, student_id: e.student_id, nota: v });
                    }}
                  />
                  <span className="text-xs text-muted-foreground">/ {current?.nota_maxima}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova avaliação</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="prova">Prova</option><option value="trabalho">Trabalho</option>
                <option value="atividade">Atividade</option><option value="participacao">Participação</option>
              </select>
            </div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
            <div><Label>Peso</Label><Input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })} /></div>
            <div><Label>Nota máxima</Label><Input type="number" value={form.nota_maxima} onChange={(e) => setForm({ ...form, nota_maxima: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!form.titulo) return;
              await upsertA.mutateAsync({ ...form, class_id: classId } as any);
              setCreating(false);
            }}><Save className="h-4 w-4" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiaryList({ lessons }: any) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 shadow-card">
      <ul className="divide-y divide-border">
        {lessons.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Sem registros no diário ainda.</li>}
        {lessons.map((l: any) => (
          <li key={l.id} className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{l.titulo}</div>
              <div className="text-xs text-muted-foreground">{new Date(l.data).toLocaleDateString("pt-BR")}</div>
            </div>
            {l.conteudo && <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{l.conteudo}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
