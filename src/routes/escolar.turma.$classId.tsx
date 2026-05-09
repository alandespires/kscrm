import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useClasses, useEnrollments, useLessons, useUpsertLesson,
  useAttendance, useSetAttendance, useAssessments, useUpsertAssessment,
  useGrades, useSetGrade, useClassStats,
} from "@/hooks/use-school";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check, X, Clock, FileWarning, ArrowLeft, Plus, CheckCheck, Save,
  CalendarDays, ListChecks, Layers, GraduationCap, ChevronRight, Lock, CircleDot,
  Search, Filter, Download, Sparkles, Loader2, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { toast } from "sonner";

export const Route = createFileRoute("/escolar/turma/$classId")({ component: ClassConsole });

const STATUSES = [
  { v: "presente", short: "P", icon: Check, dotCls: "bg-success", btn: "bg-success/15 text-success border-success/40", title: "Presente" },
  { v: "atrasado", short: "A", icon: Clock, dotCls: "bg-warning", btn: "bg-warning/15 text-warning border-warning/40", title: "Atrasado" },
  { v: "falta", short: "F", icon: X, dotCls: "bg-destructive", btn: "bg-destructive/15 text-destructive border-destructive/40", title: "Falta" },
  { v: "justificada", short: "J", icon: FileWarning, dotCls: "bg-accent", btn: "bg-accent/20 text-accent border-accent/40", title: "Justificada" },
] as const;

function ClassConsole() {
  const { classId } = Route.useParams();
  const { data: classes = [] } = useClasses();
  const klass = classes.find((c) => c.id === classId);
  const { data: enrollments = [] } = useEnrollments(classId);
  const { data: lessons = [] } = useLessons(classId);
  const { data: stats } = useClassStats(classId);

  const [tab, setTab] = useState<"chamada" | "linha" | "modulos">("chamada");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/escolar" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao painel
        </Link>
      </div>

      {/* Header */}
      <header className="ks-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{klass?.course?.nome ?? "Turma"}</div>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
              <GraduationCap className="h-5 w-5 text-primary" />
              Turma {klass?.nome ?? "—"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {klass?.teacher?.nome ?? "Sem professor"} · {klass?.horario ?? "—"} · Sala {klass?.sala ?? "—"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Alunos" value={stats?.alunos ?? enrollments.length} />
            <Stat label="Presença" value={stats?.presencaPct != null ? `${stats.presencaPct}%` : "—"}
              accent={stats?.presencaPct != null && stats.presencaPct < 75 ? "text-warning" : "text-success"} />
            <Stat label="Média" value={stats?.media != null ? stats.media.toFixed(1) : "—"}
              accent={stats?.media != null && stats.media < 6 ? "text-destructive" : "text-foreground"} />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="inline-flex gap-1 rounded-xl border border-border bg-surface-1 p-1">
        {[
          { v: "chamada", label: "Chamada & Notas", icon: ListChecks },
          { v: "linha", label: "Linha do tempo", icon: CalendarDays },
          { v: "modulos", label: "Módulos do curso", icon: Layers },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.v;
          return (
            <button key={t.v} onClick={() => setTab(t.v as any)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-surface-3 text-foreground shadow-card" : "text-muted-foreground hover:text-foreground hover:bg-surface-2"}`}>
              <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === "chamada" && <RollCallBoard classId={classId} enrollments={enrollments} lessons={lessons} />}
      {tab === "linha" && <Timeline classId={classId} lessons={lessons} enrollments={enrollments} />}
      {tab === "modulos" && <ModulesBoard classId={classId} courseName={klass?.course?.nome} />}
    </div>
  );
}

function Stat({ label, value, accent = "text-foreground" }: { label: string; value: any; accent?: string }) {
  return (
    <div className="ks-card px-4 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

/* ============ CHAMADA + NOTAS (sem tela de gate) ============ */
function RollCallBoard({ classId, enrollments, lessons }: any) {
  const upsertLesson = useUpsertLesson();
  const today = new Date().toISOString().slice(0, 10);

  // Aula ativa: hoje, ou a mais recente, ou cria automaticamente uma rascunho ao salvar
  const initialLesson = useMemo(() => lessons.find((l: any) => l.data === today) ?? lessons[0], [lessons, today]);
  const [lessonId, setLessonId] = useState<string | null>(initialLesson?.id ?? null);
  useEffect(() => { if (!lessonId && initialLesson) setLessonId(initialLesson.id); }, [initialLesson, lessonId]);

  const [creatingDate, setCreatingDate] = useState(today);
  const [creatingTitle, setCreatingTitle] = useState("");
  const [showNew, setShowNew] = useState(false);

  const [finalizado, setFinalizado] = useState(false);
  useEffect(() => { setFinalizado(false); }, [lessonId]);

  const { data: attendance = [] } = useAttendance(lessonId);
  const setAtt = useSetAttendance();
  const map = useMemo(() => new Map(attendance.map((a: any) => [a.student_id, a.status])), [attendance]);

  // Avaliações para input rápido de nota
  const { data: assessments = [] } = useAssessments(classId);
  const upsertA = useUpsertAssessment();
  const [assessmentId, setAssessmentId] = useState<string>("");
  useEffect(() => { if (!assessmentId && assessments[0]) setAssessmentId(assessments[0].id); }, [assessments, assessmentId]);
  const { data: grades = [] } = useGrades(assessmentId || null);
  const setGrade = useSetGrade();
  const gMap = useMemo(() => new Map(grades.map((g: any) => [g.student_id, g.nota])), [grades]);
  const currentA = assessments.find((a) => a.id === assessmentId);

  const ensureLesson = async () => {
    if (lessonId) return lessonId;
    const id = await upsertLesson.mutateAsync({
      class_id: classId, titulo: `Aula ${new Date().toLocaleDateString("pt-BR")}`, data: today,
    });
    setLessonId(id);
    return id;
  };

  const setStatus = async (student_id: string, status: any) => {
    const id = await ensureLesson();
    setAtt.mutate({ lesson_id: id, student_id, status });
  };

  const markAllPresent = async () => {
    const id = await ensureLesson();
    enrollments.forEach((e: any) => setAtt.mutate({ lesson_id: id, student_id: e.student_id, status: "presente" }));
    toast.success("Todos marcados como presentes");
  };

  const finalizar = async () => {
    if (!lessonId) return toast.error("Lance ao menos uma presença antes de finalizar");
    setFinalizado(true);
    toast.success("Aula finalizada — registros salvos");
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { presente: 0, atrasado: 0, falta: 0, justificada: 0 };
    map.forEach((v) => { if (v && c[v as string] != null) c[v as string]++; });
    return c;
  }, [map]);

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="ks-card flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-2">
          <Label className="text-[11px] font-semibold uppercase text-muted-foreground">Aula</Label>
          <select
            className="h-9 rounded-md border border-input bg-input px-2 text-sm"
            value={lessonId ?? ""}
            onChange={(e) => setLessonId(e.target.value || null)}
          >
            <option value="">— hoje (rascunho) —</option>
            {lessons.map((l: any) => (
              <option key={l.id} value={l.id}>{new Date(l.data).toLocaleDateString("pt-BR")} · {l.titulo}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> Nova data</Button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs">
          {STATUSES.map((s) => (
            <span key={s.v} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-1 px-2 py-1">
              <span className={`h-2 w-2 rounded-full ${s.dotCls}`} />{s.title} · <strong>{counts[s.v]}</strong>
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={markAllPresent}><CheckCheck className="h-4 w-4" /> Todos presentes</Button>
          <Button size="sm" onClick={finalizar} disabled={finalizado}>
            {finalizado ? <><Lock className="h-4 w-4" /> Finalizada</> : <><Save className="h-4 w-4" /> Finalizar aula</>}
          </Button>
        </div>
      </div>

      {/* Avaliação ativa */}
      <div className="ks-card flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-2">
          <Label className="text-[11px] font-semibold uppercase text-muted-foreground">Nota rápida</Label>
          <select
            className="h-9 rounded-md border border-input bg-input px-2 text-sm"
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
          >
            <option value="">— escolher avaliação —</option>
            {assessments.map((a) => <option key={a.id} value={a.id}>{a.titulo} (max {a.nota_maxima})</option>)}
          </select>
          <NewAssessmentButton classId={classId} onCreated={(id) => setAssessmentId(id)} />
        </div>
        {currentA && <div className="text-xs text-muted-foreground">Tipo: <strong>{currentA.tipo}</strong> · Peso {currentA.peso}</div>}
      </div>

      {/* Lista de alunos */}
      <div className="ks-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border bg-surface-1 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Aluno</span>
          <span className="text-center">Presença</span>
          <span className="text-right">Nota</span>
        </div>
        <ul className="divide-y divide-border">
          {enrollments.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Sem alunos matriculados nesta turma.</li>}
          {enrollments.map((e: any, idx: number) => {
            const cur = map.get(e.student_id);
            const note = gMap.get(e.student_id);
            return (
              <li key={e.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-xs font-bold text-primary">
                    {e.student?.nome?.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{e.student?.nome}</div>
                    {e.student?.matricula && <div className="text-[11px] text-muted-foreground">Mat. {e.student.matricula}</div>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s.v}
                      title={s.title}
                      disabled={finalizado}
                      onClick={() => setStatus(e.student_id, s.v)}
                      className={`grid h-9 w-9 place-items-center rounded-lg border text-xs font-bold transition disabled:opacity-50 ${cur === s.v ? s.btn : "border-border text-muted-foreground hover:bg-surface-3"}`}
                    >
                      {s.short}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Input
                    type="number" step="0.1" min={0} max={currentA?.nota_maxima ?? 10}
                    placeholder="—"
                    defaultValue={note ?? ""}
                    disabled={!assessmentId}
                    className="h-9 w-20 text-right"
                    onBlur={(ev) => {
                      if (!assessmentId) return;
                      const v = ev.target.value === "" ? null : Number(ev.target.value);
                      setGrade.mutate({ assessment_id: assessmentId, student_id: e.student_id, nota: v });
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">/{currentA?.nota_maxima ?? "—"}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Modal nova aula */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar nova aula</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Data</Label><Input type="date" value={creatingDate} onChange={(e) => setCreatingDate(e.target.value)} /></div>
            <div><Label>Título / conteúdo</Label><Input value={creatingTitle} onChange={(e) => setCreatingTitle(e.target.value)} placeholder="Ex.: Funções de 1º grau" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={async () => {
              const id = await upsertLesson.mutateAsync({
                class_id: classId, titulo: creatingTitle || `Aula ${new Date(creatingDate).toLocaleDateString("pt-BR")}`,
                data: creatingDate,
              });
              setLessonId(id); setShowNew(false); setCreatingTitle("");
            }}>Criar aula</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function NewAssessmentButton({ classId, onCreated }: { classId: string; onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo: "prova", peso: 1, nota_maxima: 10, data: new Date().toISOString().slice(0,10) });
  const upsertA = useUpsertAssessment();
  const qc = useQueryClient();
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nova</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova avaliação</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-input px-3 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="prova">Prova</option><option value="trabalho">Trabalho</option>
                <option value="atividade">Atividade</option><option value="participacao">Participação</option>
              </select>
            </div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
            <div><Label>Peso</Label><Input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })} /></div>
            <div><Label>Nota máxima</Label><Input type="number" value={form.nota_maxima} onChange={(e) => setForm({ ...form, nota_maxima: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!form.titulo) return toast.error("Título obrigatório");
              await upsertA.mutateAsync({ ...form, class_id: classId } as any);
              await qc.invalidateQueries({ queryKey: ["school-assessments", classId] });
              // best effort: pick the freshly created
              const { data } = await supabase.from("school_assessments").select("id").eq("class_id", classId).eq("titulo", form.titulo).order("created_at", { ascending: false }).limit(1).maybeSingle();
              if (data?.id) onCreated(data.id);
              setOpen(false);
              setForm({ ...form, titulo: "" });
            }}><Save className="h-4 w-4" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============ LINHA DO TEMPO DE AULAS ============ */
function Timeline({ classId, lessons, enrollments }: any) {
  // busca presenças por aula
  const { data: attMap = {} } = useQuery({
    queryKey: ["class-timeline-att", classId, lessons.map((l: any) => l.id).join(",")],
    enabled: lessons.length > 0,
    queryFn: async () => {
      const ids = lessons.map((l: any) => l.id);
      const { data } = await supabase.from("school_attendance").select("lesson_id,status").in("lesson_id", ids);
      const m: Record<string, Record<string, number>> = {};
      (data ?? []).forEach((r: any) => {
        m[r.lesson_id] ??= { presente: 0, atrasado: 0, falta: 0, justificada: 0 };
        m[r.lesson_id][r.status] = (m[r.lesson_id][r.status] ?? 0) + 1;
      });
      return m;
    },
  });
  const total = enrollments.length || 1;

  if (!lessons.length) {
    return <div className="ks-card p-8 text-center text-sm text-muted-foreground">Nenhuma aula registrada ainda.</div>;
  }
  return (
    <div className="ks-card divide-y divide-border">
      {lessons.map((l: any) => {
        const c = (attMap as any)[l.id] ?? {};
        const presentes = (c.presente ?? 0) + (c.atrasado ?? 0);
        const pct = Math.round((presentes / total) * 100);
        return (
          <div key={l.id} className="flex items-start gap-4 px-5 py-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-surface-1">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">{new Date(l.data).toLocaleDateString("pt-BR", { month: "short" })}</div>
              <div className="-mt-1 text-base font-bold text-primary">{new Date(l.data).getDate()}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-sm font-semibold">{l.titulo}</div>
                <div className="text-xs text-muted-foreground">{pct}% presença</div>
              </div>
              {l.conteudo && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{l.conteudo}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                {STATUSES.map((s) => (
                  <span key={s.v} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-1 px-2 py-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dotCls}`} />{s.title}: <strong>{c[s.v] ?? 0}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ MÓDULOS DO CURSO (sequenciais, persistência local) ============ */
type CMod = { id: string; titulo: string; status: "concluido" | "atual" | "futuro" };
function ModulesBoard({ classId, courseName }: { classId: string; courseName?: string | null }) {
  const key = `ks-escolar:modulos:${classId}`;
  const [mods, setMods] = useState<CMod[]>([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  useEffect(() => {
    try { setMods(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setMods([]); }
  }, [key]);
  const save = (next: CMod[]) => { setMods(next); localStorage.setItem(key, JSON.stringify(next)); };
  const add = () => {
    if (!novoTitulo.trim()) return;
    const next = [...mods, { id: crypto.randomUUID(), titulo: novoTitulo.trim(), status: mods.length === 0 ? "atual" as const : "futuro" as const }];
    save(next); setNovoTitulo("");
  };
  const setAtual = (id: string) => {
    const idx = mods.findIndex((m) => m.id === id);
    if (idx < 0) return;
    save(mods.map((m, i) => ({ ...m, status: i < idx ? "concluido" : i === idx ? "atual" : "futuro" })));
  };
  const avancar = () => {
    const idx = mods.findIndex((m) => m.status === "atual");
    if (idx < 0 || idx >= mods.length - 1) return toast.info("Não há próximo módulo");
    save(mods.map((m, i) => ({ ...m, status: i < idx + 1 ? "concluido" : i === idx + 1 ? "atual" : "futuro" })));
    toast.success("Avançou para o próximo módulo");
  };
  const remove = (id: string) => save(mods.filter((m) => m.id !== id));

  return (
    <div className="space-y-4">
      <div className="ks-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{courseName ?? "Curso"}</div>
          <div className="text-sm text-muted-foreground">Estruture o curso em módulos sequenciais e marque o atual.</div>
        </div>
        <Button size="sm" onClick={avancar}><ChevronRight className="h-4 w-4" /> Avançar módulo atual</Button>
      </div>

      <div className="ks-card p-3">
        <div className="flex gap-2">
          <Input placeholder="Adicionar módulo (ex.: 02 — PowerPoint)" value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button onClick={add}><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>
      </div>

      {mods.length === 0 ? (
        <div className="ks-card p-8 text-center text-sm text-muted-foreground">Nenhum módulo cadastrado ainda.</div>
      ) : (
        <ol className="space-y-2">
          {mods.map((m, i) => {
            const isAtual = m.status === "atual";
            const isConcl = m.status === "concluido";
            return (
              <li key={m.id} className={`ks-card flex items-center gap-3 p-4 ${isAtual ? "ring-2 ring-primary/60" : ""}`}>
                <div className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${isConcl ? "bg-success/20 text-success" : isAtual ? "bg-primary text-primary-foreground" : "bg-surface-3 text-muted-foreground"}`}>
                  {isConcl ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{m.titulo}</div>
                    {isAtual && <span className="ks-pill"><CircleDot className="h-3 w-3" /> Atual</span>}
                    {isConcl && <span className="ks-pill" style={{ background: "oklch(from var(--success) l c h / 0.15)", color: "var(--success)", borderColor: "oklch(from var(--success) l c h / 0.4)" }}>Concluído</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {!isAtual && <Button size="sm" variant="outline" onClick={() => setAtual(m.id)}>Marcar como atual</Button>}
                  <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>Remover</Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
