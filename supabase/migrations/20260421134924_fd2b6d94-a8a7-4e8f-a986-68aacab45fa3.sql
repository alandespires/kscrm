-- =============================================================
-- FASE 1: Transformação Multi-Tenant
-- =============================================================

-- 1) LIMPEZA: apaga dados operacionais (mantém auth.users, profiles)
TRUNCATE TABLE
  public.automation_runs,
  public.automations,
  public.ai_insights,
  public.activities,
  public.tasks,
  public.deals,
  public.clients,
  public.leads
RESTART IDENTITY CASCADE;

-- Remove roles antigas; vamos repopular com novo enum
DELETE FROM public.user_roles;

-- =============================================================
-- 2) NOVO ENUM DE ROLES (substitui admin/gerente/vendedor)
-- =============================================================
-- Drop policies que dependem do enum antigo (vamos recriar tudo)
DROP POLICY IF EXISTS "Automations: criador ou admin deleta" ON public.automations;
DROP POLICY IF EXISTS "Clients: admin/gerente deleta" ON public.clients;
DROP POLICY IF EXISTS "Deals: admin/gerente deleta" ON public.deals;
DROP POLICY IF EXISTS "Leads: admin/gerente deleta" ON public.leads;
DROP POLICY IF EXISTS "Tasks: criador ou admin deleta" ON public.tasks;
DROP POLICY IF EXISTS "Profiles: admin edita qualquer" ON public.profiles;
DROP POLICY IF EXISTS "Roles: só admin gerencia" ON public.user_roles;
DROP POLICY IF EXISTS "Roles: todos autenticados veem" ON public.user_roles;

-- Drop função has_role antiga (depende do enum)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Recria enum
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('super_admin', 'tenant_admin', 'tenant_user');

ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role USING 'tenant_user'::public.app_role;

DROP TYPE public.app_role_old;

-- Recria has_role com novo enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =============================================================
-- 3) TABELAS NOVAS: plans, tenants, subscriptions, tenant_users
-- =============================================================

CREATE TYPE public.tenant_status AS ENUM ('trial', 'ativo', 'suspenso', 'cancelado');
CREATE TYPE public.tenant_role AS ENUM ('tenant_admin', 'tenant_user');

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  preco_mensal numeric(10,2) NOT NULL DEFAULT 0,
  max_usuarios integer,
  max_leads integer,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  responsavel text,
  email_principal text,
  whatsapp text,
  logo_url text,
  status public.tenant_status NOT NULL DEFAULT 'trial',
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  proximo_vencimento date,
  trial_ate date,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status public.tenant_status NOT NULL DEFAULT 'trial',
  valor numeric(10,2) NOT NULL DEFAULT 0,
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  proximo_vencimento date,
  cancelada_em timestamptz,
  motivo_cancelamento text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_tenant ON public.subscriptions(tenant_id);

CREATE TABLE public.tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.tenant_role NOT NULL DEFAULT 'tenant_user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);

-- =============================================================
-- 4) FUNÇÕES DE SUPORTE (security definer, sem recursão)
-- =============================================================

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    JOIN public.tenants t ON t.id = tu.tenant_id
    WHERE tu.tenant_id = _tenant_id
      AND tu.user_id = _user_id
      AND t.status IN ('trial','ativo')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = _tenant_id AND user_id = _user_id AND role = 'tenant_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.user_tenant_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tu.tenant_id FROM public.tenant_users tu
  JOIN public.tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = _user_id AND t.status IN ('trial','ativo')
$$;

-- =============================================================
-- 5) ADICIONA tenant_id NAS TABELAS OPERACIONAIS
-- =============================================================

ALTER TABLE public.leads          ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.clients        ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.tasks          ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.deals          ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.activities     ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.ai_insights    ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.automations    ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.automation_runs ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX idx_leads_tenant       ON public.leads(tenant_id);
CREATE INDEX idx_clients_tenant     ON public.clients(tenant_id);
CREATE INDEX idx_tasks_tenant       ON public.tasks(tenant_id);
CREATE INDEX idx_deals_tenant       ON public.deals(tenant_id);
CREATE INDEX idx_activities_tenant  ON public.activities(tenant_id);
CREATE INDEX idx_ai_insights_tenant ON public.ai_insights(tenant_id);
CREATE INDEX idx_automations_tenant ON public.automations(tenant_id);
CREATE INDEX idx_automation_runs_tenant ON public.automation_runs(tenant_id);

-- =============================================================
-- 6) RLS — ENABLE em tabelas novas
-- =============================================================
ALTER TABLE public.plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users   ENABLE ROW LEVEL SECURITY;

-- PLANS: todos autenticados leem (catálogo), só super admin escreve
CREATE POLICY plans_select ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY plans_admin_all ON public.plans FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- TENANTS
CREATE POLICY tenants_super_select ON public.tenants FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));
CREATE POLICY tenants_member_select ON public.tenants FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_tenant_ids(auth.uid())));
CREATE POLICY tenants_super_write ON public.tenants FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY tenants_admin_update ON public.tenants FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(id, auth.uid()))
  WITH CHECK (public.is_tenant_admin(id, auth.uid()));

-- SUBSCRIPTIONS: super admin total; tenant admin lê a sua
CREATE POLICY subs_super_all ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY subs_tenant_read ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

-- TENANT_USERS: super admin total; tenant admin gerencia o próprio tenant; usuário lê os próprios vínculos
CREATE POLICY tu_super_all ON public.tenant_users FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY tu_admin_all ON public.tenant_users FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_admin(tenant_id, auth.uid()));
CREATE POLICY tu_self_select ON public.tenant_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================================
-- 7) RLS — REESCREVE para tabelas operacionais (isolamento por tenant)
-- =============================================================

-- LEADS
DROP POLICY IF EXISTS "Leads: autenticado vê tudo" ON public.leads;
DROP POLICY IF EXISTS "Leads: autenticado cria"   ON public.leads;
DROP POLICY IF EXISTS "Leads: autenticado edita"  ON public.leads;
CREATE POLICY leads_tenant_select ON public.leads FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY leads_tenant_insert ON public.leads FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY leads_tenant_update ON public.leads FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY leads_tenant_delete ON public.leads FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

-- CLIENTS
DROP POLICY IF EXISTS "Clients: autenticado vê"   ON public.clients;
DROP POLICY IF EXISTS "Clients: autenticado cria" ON public.clients;
DROP POLICY IF EXISTS "Clients: autenticado edita" ON public.clients;
CREATE POLICY clients_tenant_select ON public.clients FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY clients_tenant_insert ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY clients_tenant_update ON public.clients FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY clients_tenant_delete ON public.clients FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

-- TASKS
DROP POLICY IF EXISTS "Tasks: autenticado vê"   ON public.tasks;
DROP POLICY IF EXISTS "Tasks: autenticado cria" ON public.tasks;
DROP POLICY IF EXISTS "Tasks: autenticado edita" ON public.tasks;
CREATE POLICY tasks_tenant_select ON public.tasks FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY tasks_tenant_insert ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY tasks_tenant_update ON public.tasks FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY tasks_tenant_delete ON public.tasks FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()) OR auth.uid() = created_by);

-- DEALS
DROP POLICY IF EXISTS "Deals: autenticado vê"   ON public.deals;
DROP POLICY IF EXISTS "Deals: autenticado cria" ON public.deals;
DROP POLICY IF EXISTS "Deals: autenticado edita" ON public.deals;
CREATE POLICY deals_tenant_select ON public.deals FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY deals_tenant_insert ON public.deals FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY deals_tenant_update ON public.deals FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY deals_tenant_delete ON public.deals FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

-- ACTIVITIES
DROP POLICY IF EXISTS "Activities: autenticado vê"   ON public.activities;
DROP POLICY IF EXISTS "Activities: autenticado cria" ON public.activities;
CREATE POLICY activities_tenant_select ON public.activities FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY activities_tenant_insert ON public.activities FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = user_id);

-- AI_INSIGHTS
DROP POLICY IF EXISTS "Insights: autenticado vê"        ON public.ai_insights;
DROP POLICY IF EXISTS "Insights: sistema cria"          ON public.ai_insights;
DROP POLICY IF EXISTS "Insights: autenticado marca lido" ON public.ai_insights;
CREATE POLICY insights_tenant_select ON public.ai_insights FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY insights_tenant_insert ON public.ai_insights FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY insights_tenant_update ON public.ai_insights FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));

-- AUTOMATIONS
DROP POLICY IF EXISTS "Automations: autenticado vê"    ON public.automations;
DROP POLICY IF EXISTS "Automations: autenticado cria"  ON public.automations;
DROP POLICY IF EXISTS "Automations: autenticado edita" ON public.automations;
CREATE POLICY automations_tenant_select ON public.automations FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY automations_tenant_insert ON public.automations FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY automations_tenant_update ON public.automations FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY automations_tenant_delete ON public.automations FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()) OR auth.uid() = created_by);

-- AUTOMATION_RUNS
DROP POLICY IF EXISTS "Runs: autenticado vê"   ON public.automation_runs;
DROP POLICY IF EXISTS "Runs: sistema cria"     ON public.automation_runs;
CREATE POLICY runs_tenant_select ON public.automation_runs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY runs_tenant_insert ON public.automation_runs FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));

-- USER_ROLES (roles globais - apenas super_admin existe aqui)
CREATE POLICY user_roles_self_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY user_roles_super_all ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- PROFILES: super admin pode editar qualquer
CREATE POLICY profiles_super_update ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- =============================================================
-- 8) ATUALIZA TRIGGERS DE AUTOMAÇÃO PARA INCLUIR tenant_id
-- =============================================================

CREATE OR REPLACE FUNCTION public.execute_automations(_trigger automation_trigger, _lead leads)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rule public.automations%ROWTYPE;
  acao jsonb;
  v_user uuid;
  v_actions_done jsonb := '[]'::jsonb;
  v_match boolean;
BEGIN
  v_user := COALESCE(auth.uid(), _lead.owner_id, _lead.created_by);

  FOR rule IN
    SELECT * FROM public.automations
    WHERE ativo = true AND trigger_tipo = _trigger AND tenant_id = _lead.tenant_id
  LOOP
    v_match := true;
    IF rule.trigger_valor IS NOT NULL AND rule.trigger_valor <> '' THEN
      IF _trigger = 'status_mudou' AND _lead.status::text <> rule.trigger_valor THEN v_match := false; END IF;
      IF _trigger = 'lead_criado' AND COALESCE(_lead.origem,'') <> rule.trigger_valor THEN v_match := false; END IF;
      IF _trigger = 'score_alto' AND COALESCE(_lead.ai_score,0) < rule.trigger_valor::int THEN v_match := false; END IF;
    END IF;
    IF NOT v_match THEN CONTINUE; END IF;

    v_actions_done := '[]'::jsonb;
    FOR acao IN SELECT * FROM jsonb_array_elements(rule.acoes) LOOP
      IF acao->>'tipo' = 'criar_tarefa' THEN
        INSERT INTO public.tasks (tenant_id, titulo, descricao, prioridade, lead_id, created_by, assignee_id, prazo)
        VALUES (
          _lead.tenant_id,
          COALESCE(acao->>'titulo', 'Tarefa automática: ' || _lead.nome),
          acao->>'descricao',
          COALESCE((acao->>'prioridade')::task_priority, 'media'::task_priority),
          _lead.id, v_user, v_user,
          CASE WHEN acao ? 'prazo_dias' THEN now() + ((acao->>'prazo_dias')::int || ' days')::interval ELSE NULL END
        );
        v_actions_done := v_actions_done || jsonb_build_object('tipo','criar_tarefa','titulo', acao->>'titulo');
      ELSIF acao->>'tipo' = 'registrar_atividade' THEN
        INSERT INTO public.activities (tenant_id, tipo, descricao, lead_id, user_id, metadata)
        VALUES (
          _lead.tenant_id,
          COALESCE((acao->>'tipo_atividade')::activity_type, 'nota'::activity_type),
          COALESCE(acao->>'descricao', '[Automação] ' || rule.nome),
          _lead.id, v_user,
          jsonb_build_object('automation_id', rule.id)
        );
        v_actions_done := v_actions_done || jsonb_build_object('tipo','registrar_atividade');
      END IF;
    END LOOP;

    UPDATE public.automations SET execucoes = execucoes + 1 WHERE id = rule.id;
    INSERT INTO public.automation_runs (tenant_id, automation_id, lead_id, resultado)
    VALUES (_lead.tenant_id, rule.id, _lead.id, jsonb_build_object('acoes', v_actions_done));
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_user := COALESCE(auth.uid(), NEW.owner_id, NEW.created_by);
    INSERT INTO public.activities (tenant_id, user_id, lead_id, tipo, descricao, metadata)
    VALUES (
      NEW.tenant_id, v_user, NEW.id, 'movimentacao'::activity_type,
      'Status alterado: ' || OLD.status::text || ' → ' || NEW.status::text,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
    PERFORM public.execute_automations('status_mudou'::automation_trigger, NEW);
  END IF;

  IF (OLD.ai_score IS NULL OR OLD.ai_score < 80) AND COALESCE(NEW.ai_score,0) >= 80 THEN
    PERFORM public.execute_automations('score_alto'::automation_trigger, NEW);
  END IF;
  IF OLD.ai_score IS NOT NULL AND NEW.ai_score IS NOT NULL AND (OLD.ai_score - NEW.ai_score) >= 20 THEN
    PERFORM public.execute_automations('score_baixou'::automation_trigger, NEW);
  END IF;

  RETURN NEW;
END;
$$;

-- Recria triggers (caso não existam)
DROP TRIGGER IF EXISTS trg_log_lead_status_change ON public.leads;
CREATE TRIGGER trg_log_lead_status_change AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();

DROP TRIGGER IF EXISTS trg_tg_lead_created ON public.leads;
CREATE TRIGGER trg_tg_lead_created AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_lead_created();

-- updated_at triggers nas tabelas novas
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- 9) handle_new_user — não cria mais role automaticamente
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- =============================================================
-- 10) SEEDS: planos + super admin
-- =============================================================
INSERT INTO public.plans (nome, slug, preco_mensal, max_usuarios, max_leads, ordem, features) VALUES
  ('Starter',  'starter',   97.00,  3,  500,  1, '["Pipeline","Leads","Tarefas"]'::jsonb),
  ('Pro',      'pro',      297.00, 10, 5000,  2, '["Pipeline","Leads","Tarefas","Automações","IA"]'::jsonb),
  ('Business', 'business', 697.00, 50, 50000, 3, '["Pipeline","Leads","Tarefas","Automações","IA","Relatórios avançados","API"]'::jsonb);

-- Promove alandespires@gmail.com a Super Admin (se já existir)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role FROM auth.users WHERE email = 'alandespires@gmail.com'
ON CONFLICT DO NOTHING;