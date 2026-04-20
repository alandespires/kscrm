
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'vendedor');

-- Enum para status de lead
CREATE TYPE public.lead_status AS ENUM ('novo', 'contato_inicial', 'qualificacao', 'proposta', 'negociacao', 'fechado', 'perdido');

-- Enum para prioridade de tarefa
CREATE TYPE public.task_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Enum para status de tarefa
CREATE TYPE public.task_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- Enum para tipo de atividade
CREATE TYPE public.activity_type AS ENUM ('ligacao', 'email', 'whatsapp', 'reuniao', 'nota', 'movimentacao', 'tarefa');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  cargo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger: criar profile automaticamente ao signup + role default 'vendedor'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'vendedor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger updated_at genérico
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa TEXT,
  email TEXT,
  whatsapp TEXT,
  origem TEXT,
  interesse TEXT,
  observacoes TEXT,
  tags TEXT[] DEFAULT '{}',
  status public.lead_status NOT NULL DEFAULT 'novo',
  valor_estimado NUMERIC(12,2) DEFAULT 0,
  ai_score INTEGER DEFAULT 0,
  ai_resumo TEXT,
  ai_sugestao TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_contato_em TIMESTAMPTZ
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_owner ON public.leads(owner_id);

-- CLIENTS (lead fechado vira cliente)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  empresa TEXT,
  email TEXT,
  whatsapp TEXT,
  observacoes TEXT,
  contrato_valor NUMERIC(12,2),
  contrato_inicio DATE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DEALS (negócios/oportunidades vinculados a leads)
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  stage public.lead_status NOT NULL DEFAULT 'novo',
  probabilidade INTEGER DEFAULT 0,
  motivo_perda TEXT,
  fechado_em TIMESTAMPTZ,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade public.task_priority NOT NULL DEFAULT 'media',
  status public.task_status NOT NULL DEFAULT 'pendente',
  prazo TIMESTAMPTZ,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluida_em TIMESTAMPTZ
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ACTIVITIES (timeline)
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.activity_type NOT NULL,
  descricao TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activities_lead ON public.activities(lead_id);

-- AI INSIGHTS
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  prioridade public.task_priority DEFAULT 'media',
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- ============= RLS POLICIES =============
-- Modelo: todos autenticados veem tudo, qualquer um cria, edição livre (time colaborativo).
-- Admins têm controle total. Profiles e roles têm regras especiais.

-- PROFILES
CREATE POLICY "Profiles: todos autenticados podem ver" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles: usuário edita o próprio" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: admin edita qualquer" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES
CREATE POLICY "Roles: todos autenticados veem" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Roles: só admin gerencia" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- LEADS
CREATE POLICY "Leads: autenticado vê tudo" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leads: autenticado cria" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Leads: autenticado edita" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Leads: admin/gerente deleta" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- CLIENTS
CREATE POLICY "Clients: autenticado vê" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clients: autenticado cria" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Clients: autenticado edita" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Clients: admin/gerente deleta" ON public.clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- DEALS
CREATE POLICY "Deals: autenticado vê" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Deals: autenticado cria" ON public.deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Deals: autenticado edita" ON public.deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Deals: admin/gerente deleta" ON public.deals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- TASKS
CREATE POLICY "Tasks: autenticado vê" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tasks: autenticado cria" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Tasks: autenticado edita" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Tasks: criador ou admin deleta" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- ACTIVITIES
CREATE POLICY "Activities: autenticado vê" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activities: autenticado cria" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- AI_INSIGHTS
CREATE POLICY "Insights: autenticado vê" ON public.ai_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insights: sistema cria" ON public.ai_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Insights: autenticado marca lido" ON public.ai_insights FOR UPDATE TO authenticated USING (true);
