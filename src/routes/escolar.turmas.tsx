import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useClasses, useCourses, useTeachers, useUpsertClass, useDeleteClass, useEnrollments, useStudents, useEnrollStudent, useUnenrollStudent, type Klass } from "@/hooks/use-school";
import { Plus, Pencil, Trash2, Users, UserPlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/escolar/turmas")({ component: Page });

function Page() {
  const { data: classes = [] } = useClasses();
  const { data: courses = [] } = useCourses();
  const { data: teachers = [] } = useTeachers();
  const upsert = useUpsertClass();
  const del = useDeleteClass();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Klass> | null>(null);
  const [enrollClassId, setEnrollClassId] = useState<string | null>(null);

  function openNew() { setEditing({ nome: "", course_id: courses[0]?.id, status: "ativo" }); setOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{classes.length} turma{classes.length !== 1 ? "s" : ""}</p>
        <Button onClick={openNew} disabled={courses.length === 0}><Plus className="mr-1.5 h-4 w-4" />Nova turma</Button>
      </div>
      {courses.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Crie um <Link to="/escolar/cursos" className="font-semibold text-primary">curso</Link> antes de adicionar turmas.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((c) => (
          <div key={c.id} className="group rounded-2xl border border-border bg-surface-2 p-5 shadow-card">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{c.nome}</h3>
                <p className="text-xs text-muted-foreground">{c.course?.nome ?? "—"}</p>
              </div>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">{c.periodo ?? "—"}</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {c.teacher?.nome && <div>Professor: {c.teacher.nome}</div>}
              {c.sala && <div>Sala: {c.sala}</div>}
              {c.horario && <div>Horário: {c.horario}</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEnrollClassId(c.id)}><Users className="mr-1 h-3.5 w-3.5" />Alunos</Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => confirm("Excluir turma?") && del.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar turma" : "Nova turma"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.nome ?? ""} onChange={(e) => setEditing((p) => ({ ...p, nome: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Curso</Label>
                <select className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={editing?.course_id ?? ""} onChange={(e) => setEditing((p) => ({ ...p, course_id: e.target.value }))}>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div><Label>Professor</Label>
                <select className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={editing?.teacher_id ?? ""} onChange={(e) => setEditing((p) => ({ ...p, teacher_id: e.target.value || null }))}>
                  <option value="">— sem —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div><Label>Período</Label><Input value={editing?.periodo ?? ""} onChange={(e) => setEditing((p) => ({ ...p, periodo: e.target.value }))} placeholder="2026.1" /></div>
              <div><Label>Sala</Label><Input value={editing?.sala ?? ""} onChange={(e) => setEditing((p) => ({ ...p, sala: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Horário</Label><Input value={editing?.horario ?? ""} onChange={(e) => setEditing((p) => ({ ...p, horario: e.target.value }))} placeholder="Seg/Qua 19h-21h" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => editing?.nome && editing?.course_id && upsert.mutateAsync(editing as any).then(() => setOpen(false))}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EnrollDialog classId={enrollClassId} onClose={() => setEnrollClassId(null)} />
    </div>
  );
}

function EnrollDialog({ classId, onClose }: { classId: string | null; onClose: () => void }) {
  const { data: enrollments = [] } = useEnrollments(classId);
  const { data: students = [] } = useStudents();
  const enroll = useEnrollStudent();
  const unenroll = useUnenrollStudent();
  const [search, setSearch] = useState("");
  const enrolledIds = new Set(enrollments.map((e) => e.student_id));
  const filtered = students.filter((s) => !enrolledIds.has(s.id) && s.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={!!classId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Alunos da turma</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Matriculados ({enrollments.length})</h4>
            <ul className="space-y-1 max-h-80 overflow-y-auto">
              {enrollments.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>{e.student?.nome}</span>
                  <button onClick={() => unenroll.mutate(e.id)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </li>
              ))}
              {enrollments.length === 0 && <li className="text-xs text-muted-foreground">Nenhum aluno.</li>}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Adicionar</h4>
            <Input placeholder="Buscar aluno" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
            <ul className="space-y-1 max-h-72 overflow-y-auto">
              {filtered.slice(0, 30).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>{s.nome}</span>
                  <button onClick={() => enroll.mutate({ class_id: classId!, student_id: s.id })}><UserPlus className="h-3.5 w-3.5 text-primary" /></button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
