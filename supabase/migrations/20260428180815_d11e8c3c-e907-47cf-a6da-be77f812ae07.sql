-- Add tenant segment
DO $$ BEGIN
  CREATE TYPE public.tenant_segmento AS ENUM ('geral','clinica');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS segmento public.tenant_segmento NOT NULL DEFAULT 'geral';

-- Enums for clinical module
DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('agendado','confirmado','em_atendimento','realizado','faltou','cancelado','remarcado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.patient_status AS ENUM ('ativo','inativo','bloqueado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.clinical_record_type AS ENUM ('anamnese','evolucao','observacao','retorno','procedimento');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ PROFESSIONALS ============
CREATE TABLE IF NOT EXISTS public.dental_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  nome text NOT NULL,
  especialidade text,
  cro text,
  cor text DEFAULT '#3b82f6',
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dental_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY dp_select ON public.dental_professionals FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY dp_insert ON public.dental_professionals FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY dp_update ON public.dental_professionals FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY dp_delete ON public.dental_professionals FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_dp_tenant ON public.dental_professionals(tenant_id);

-- ============ PATIENTS ============
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid,
  client_id uuid,
  nome text NOT NULL,
  cpf text,
  rg text,
  data_nascimento date,
  genero text,
  email text,
  whatsapp text,
  telefone text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  convenio text,
  numero_convenio text,
  profissao text,
  estado_civil text,
  responsavel_nome text,
  responsavel_cpf text,
  alergias text,
  medicamentos_uso text,
  doencas_preexistentes text,
  observacoes text,
  status public.patient_status NOT NULL DEFAULT 'ativo',
  primeiro_atendimento_em date,
  ultimo_atendimento_em date,
  origem text,
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY pat_select ON public.patients FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY pat_insert ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY pat_update ON public.patients FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY pat_delete ON public.patients FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_patients_tenant ON public.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_nome ON public.patients(tenant_id, nome);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients(tenant_id, cpf);

-- ============ CLINICAL RECORDS ============
CREATE TABLE IF NOT EXISTS public.clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  professional_id uuid,
  tipo public.clinical_record_type NOT NULL DEFAULT 'evolucao',
  titulo text,
  queixa_principal text,
  conteudo text NOT NULL,
  dente text,
  procedimento text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_select ON public.clinical_records FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY cr_insert ON public.clinical_records FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY cr_update ON public.clinical_records FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()) AND (auth.uid() = created_by OR public.is_tenant_admin(tenant_id, auth.uid())))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY cr_delete ON public.clinical_records FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_cr_patient ON public.clinical_records(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cr_tenant ON public.clinical_records(tenant_id);

-- ============ CLINICAL ATTACHMENTS ============
CREATE TABLE IF NOT EXISTS public.clinical_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  record_id uuid,
  nome text NOT NULL,
  tipo text,
  url text NOT NULL,
  tamanho_bytes bigint,
  descricao text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY ca_select ON public.clinical_attachments FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY ca_insert ON public.clinical_attachments FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY ca_delete ON public.clinical_attachments FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()) OR auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_ca_patient ON public.clinical_attachments(patient_id);

-- ============ APPOINTMENTS ============
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  professional_id uuid,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  duracao_min integer GENERATED ALWAYS AS (GREATEST(0, EXTRACT(EPOCH FROM (fim - inicio))/60)::int) STORED,
  status public.appointment_status NOT NULL DEFAULT 'agendado',
  procedimento text,
  valor numeric(12,2) DEFAULT 0,
  convenio text,
  observacoes text,
  motivo_cancelamento text,
  confirmado_em timestamptz,
  realizado_em timestamptz,
  lembrete_enviado boolean NOT NULL DEFAULT false,
  cor text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appt_select ON public.appointments FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY appt_insert ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY appt_update ON public.appointments FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY appt_delete ON public.appointments FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()) OR auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_appt_tenant_inicio ON public.appointments(tenant_id, inicio);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_prof ON public.appointments(professional_id, inicio);

-- ============ TRIGGERS: updated_at ============
CREATE TRIGGER trg_dp_updated BEFORE UPDATE ON public.dental_professionals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_pat_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cr_updated BEFORE UPDATE ON public.clinical_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_appt_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TRIGGER: keep ultimo_atendimento_em on patient ============
CREATE OR REPLACE FUNCTION public.tg_appt_sync_patient()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'realizado' THEN
    UPDATE public.patients
       SET ultimo_atendimento_em = NEW.realizado_em::date,
           primeiro_atendimento_em = COALESCE(primeiro_atendimento_em, NEW.realizado_em::date)
     WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_appt_sync_patient AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_appt_sync_patient();
