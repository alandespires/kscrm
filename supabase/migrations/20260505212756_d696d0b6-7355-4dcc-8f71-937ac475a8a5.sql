
-- 1) Segmento escolar
ALTER TYPE public.tenant_segmento ADD VALUE IF NOT EXISTS 'escolar';

-- 2) Enums escolares
DO $$ BEGIN
  CREATE TYPE public.school_course_status AS ENUM ('ativo','inativo','arquivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.school_attendance_status AS ENUM ('presente','falta','justificada','atrasado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.school_assessment_type AS ENUM ('prova','trabalho','atividade','participacao','outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Cursos
CREATE TABLE public.school_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  carga_horaria integer DEFAULT 0,
  status public.school_course_status NOT NULL DEFAULT 'ativo',
  cor text DEFAULT '#3b82f6',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Professores
CREATE TABLE public.school_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  nome text NOT NULL,
  email text,
  telefone text,
  disciplinas text[] DEFAULT '{}',
  bio text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Turmas
CREATE TABLE public.school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  course_id uuid NOT NULL,
  teacher_id uuid,
  nome text NOT NULL,
  periodo text,
  ano integer,
  sala text,
  horario text,
  status public.school_course_status NOT NULL DEFAULT 'ativo',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Alunos
CREATE TABLE public.school_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  client_id uuid,
  matricula text,
  nome text NOT NULL,
  cpf text,
  data_nascimento date,
  email text,
  telefone text,
  responsavel_nome text,
  responsavel_email text,
  responsavel_telefone text,
  endereco text,
  observacoes text,
  status text NOT NULL DEFAULT 'ativo',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7) Matrículas (aluno em turma)
CREATE TABLE public.school_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  inicio date NOT NULL DEFAULT CURRENT_DATE,
  fim date,
  status text NOT NULL DEFAULT 'ativa',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

-- 8) Aulas (lições)
CREATE TABLE public.school_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid NOT NULL,
  teacher_id uuid,
  data date NOT NULL DEFAULT CURRENT_DATE,
  titulo text NOT NULL,
  conteudo text,
  observacoes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9) Frequência
CREATE TABLE public.school_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status public.school_attendance_status NOT NULL DEFAULT 'presente',
  observacao text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, student_id)
);

-- 10) Avaliações
CREATE TABLE public.school_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid NOT NULL,
  titulo text NOT NULL,
  tipo public.school_assessment_type NOT NULL DEFAULT 'prova',
  data date,
  peso numeric NOT NULL DEFAULT 1,
  nota_maxima numeric NOT NULL DEFAULT 10,
  descricao text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11) Notas
CREATE TABLE public.school_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  assessment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  nota numeric,
  comentario text,
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_id)
);

-- 12) Comunicados
CREATE TABLE public.school_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid,
  student_id uuid,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text DEFAULT 'aviso',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_school_classes_course ON public.school_classes(course_id);
CREATE INDEX idx_school_classes_teacher ON public.school_classes(teacher_id);
CREATE INDEX idx_school_enrollments_class ON public.school_enrollments(class_id);
CREATE INDEX idx_school_enrollments_student ON public.school_enrollments(student_id);
CREATE INDEX idx_school_lessons_class ON public.school_lessons(class_id);
CREATE INDEX idx_school_attendance_lesson ON public.school_attendance(lesson_id);
CREATE INDEX idx_school_attendance_student ON public.school_attendance(student_id);
CREATE INDEX idx_school_assessments_class ON public.school_assessments(class_id);
CREATE INDEX idx_school_grades_assessment ON public.school_grades(assessment_id);
CREATE INDEX idx_school_grades_student ON public.school_grades(student_id);
CREATE INDEX idx_school_students_user ON public.school_students(user_id);

-- RLS
ALTER TABLE public.school_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_announcements ENABLE ROW LEVEL SECURITY;

-- Helper: aluno acessa próprios dados
CREATE OR REPLACE FUNCTION public.is_school_student(_student_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_students WHERE id = _student_id AND user_id = _user_id)
$$;

-- Policies genéricas: tenant member full select; insert/update por membro; delete por admin
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'school_courses','school_teachers','school_classes','school_students',
    'school_enrollments','school_lessons','school_attendance',
    'school_assessments','school_grades','school_announcements'
  ]) LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (is_super_admin(auth.uid()) OR is_tenant_member(tenant_id, auth.uid()))', t||'_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id, auth.uid()))', t||'_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id, auth.uid())) WITH CHECK (is_tenant_member(tenant_id, auth.uid()))', t||'_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (is_super_admin(auth.uid()) OR is_tenant_admin(tenant_id, auth.uid()))', t||'_delete', t);
  END LOOP;
END $$;

-- Policies extra: aluno vê seus próprios dados
CREATE POLICY school_grades_self_select ON public.school_grades FOR SELECT TO authenticated
  USING (is_school_student(student_id, auth.uid()));
CREATE POLICY school_attendance_self_select ON public.school_attendance FOR SELECT TO authenticated
  USING (is_school_student(student_id, auth.uid()));
CREATE POLICY school_students_self_select ON public.school_students FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY school_announcements_self_select ON public.school_announcements FOR SELECT TO authenticated
  USING (student_id IS NOT NULL AND is_school_student(student_id, auth.uid()));

-- Triggers updated_at
CREATE TRIGGER trg_school_courses_updated BEFORE UPDATE ON public.school_courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_school_teachers_updated BEFORE UPDATE ON public.school_teachers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_school_classes_updated BEFORE UPDATE ON public.school_classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_school_students_updated BEFORE UPDATE ON public.school_students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_school_lessons_updated BEFORE UPDATE ON public.school_lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_school_assessments_updated BEFORE UPDATE ON public.school_assessments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_school_grades_updated BEFORE UPDATE ON public.school_grades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
