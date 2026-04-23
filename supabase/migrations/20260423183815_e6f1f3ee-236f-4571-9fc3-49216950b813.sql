
-- Notifications system
CREATE TYPE public.notification_type AS ENUM (
  'lead_novo','lead_quente','lead_frio','status_mudou',
  'tarefa_criada','tarefa_atrasada','tarefa_concluida',
  'financeiro_vencendo','financeiro_atrasado','financeiro_recebido',
  'cliente_novo','automacao_executada','insight_ia','sistema'
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo public.notification_type NOT NULL,
  titulo text NOT NULL,
  descricao text,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  prioridade public.task_priority NOT NULL DEFAULT 'media',
  lida boolean NOT NULL DEFAULT false,
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user_unread ON public.notifications(user_id, lida, created_at DESC);
CREATE INDEX idx_notif_tenant ON public.notifications(tenant_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_select ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY notif_update ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notif_delete ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY notif_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Helper to fan out a notification to all members of a tenant
CREATE OR REPLACE FUNCTION public.notify_tenant(
  _tenant_id uuid, _tipo public.notification_type, _titulo text,
  _descricao text DEFAULT NULL, _link text DEFAULT NULL,
  _prioridade public.task_priority DEFAULT 'media',
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (tenant_id, user_id, tipo, titulo, descricao, link, prioridade, metadata)
  SELECT _tenant_id, tu.user_id, _tipo, _titulo, _descricao, _link, _prioridade, _metadata
  FROM public.tenant_users tu
  JOIN public.tenants t ON t.id = tu.tenant_id
  WHERE tu.tenant_id = _tenant_id AND t.status IN ('trial','ativo');
END; $$;

-- TRIGGERS

-- Lead criado
CREATE OR REPLACE FUNCTION public.tg_notify_lead_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_tenant(
    NEW.tenant_id, 'lead_novo'::notification_type,
    'Novo lead: ' || NEW.nome,
    COALESCE('Origem: ' || NEW.origem, 'Lead recém-criado'),
    '/leads', 'media',
    jsonb_build_object('lead_id', NEW.id)
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_lead_created AFTER INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_lead_created();

-- Status mudou + score alto
CREATE OR REPLACE FUNCTION public.tg_notify_lead_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_tenant(
      NEW.tenant_id, 'status_mudou'::notification_type,
      NEW.nome || ' moveu para ' || NEW.status::text,
      'Status alterado de ' || OLD.status::text || ' para ' || NEW.status::text,
      '/pipeline',
      CASE WHEN NEW.status IN ('fechado','perdido') THEN 'alta'::task_priority ELSE 'media'::task_priority END,
      jsonb_build_object('lead_id', NEW.id, 'from', OLD.status, 'to', NEW.status)
    );
  END IF;
  IF (OLD.ai_score IS NULL OR OLD.ai_score < 80) AND COALESCE(NEW.ai_score,0) >= 80 THEN
    PERFORM public.notify_tenant(
      NEW.tenant_id, 'lead_quente'::notification_type,
      '🔥 Lead quente: ' || NEW.nome,
      'Score IA atingiu ' || NEW.ai_score::text || '. Aja rápido.',
      '/leads', 'alta',
      jsonb_build_object('lead_id', NEW.id, 'score', NEW.ai_score)
    );
  END IF;
  IF OLD.ai_score IS NOT NULL AND NEW.ai_score IS NOT NULL AND (OLD.ai_score - NEW.ai_score) >= 20 THEN
    PERFORM public.notify_tenant(
      NEW.tenant_id, 'lead_frio'::notification_type,
      '❄️ Lead esfriou: ' || NEW.nome,
      'Score caiu de ' || OLD.ai_score::text || ' para ' || NEW.ai_score::text,
      '/leads', 'media',
      jsonb_build_object('lead_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_lead_changes AFTER UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_lead_changes();

-- Tarefa criada / concluída
CREATE OR REPLACE FUNCTION public.tg_notify_task()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (tenant_id, user_id, tipo, titulo, descricao, link, prioridade, metadata)
    VALUES (NEW.tenant_id, COALESCE(NEW.assignee_id, NEW.created_by), 'tarefa_criada'::notification_type,
      'Nova tarefa: ' || NEW.titulo, NEW.descricao, '/tarefas', NEW.prioridade,
      jsonb_build_object('task_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status <> 'concluida' AND NEW.status = 'concluida' THEN
    PERFORM public.notify_tenant(NEW.tenant_id, 'tarefa_concluida'::notification_type,
      '✅ Tarefa concluída: ' || NEW.titulo, NULL, '/tarefas', 'baixa',
      jsonb_build_object('task_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_task_ins AFTER INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_task();
CREATE TRIGGER trg_notify_task_upd AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_task();

-- Cliente novo
CREATE OR REPLACE FUNCTION public.tg_notify_client_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_tenant(
    NEW.tenant_id, 'cliente_novo'::notification_type,
    '🎉 Novo cliente: ' || NEW.nome,
    COALESCE('Contrato: R$ ' || NEW.contrato_valor::text, 'Cliente convertido'),
    '/clientes', 'alta',
    jsonb_build_object('client_id', NEW.id)
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_client_created AFTER INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_client_created();

-- Financeiro: entrada paga / atrasada
CREATE OR REPLACE FUNCTION public.tg_notify_financial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status <> 'pago' AND NEW.status = 'pago' THEN
    PERFORM public.notify_tenant(NEW.tenant_id, 'financeiro_recebido'::notification_type,
      '💰 Pagamento recebido: R$ ' || NEW.valor::text,
      NEW.descricao, '/financeiro', 'alta',
      jsonb_build_object('entry_id', NEW.id));
  END IF;
  IF NEW.status = 'atrasado' AND (TG_OP = 'INSERT' OR OLD.status <> 'atrasado') THEN
    PERFORM public.notify_tenant(NEW.tenant_id, 'financeiro_atrasado'::notification_type,
      '⚠️ Pagamento em atraso: R$ ' || NEW.valor::text,
      NEW.descricao, '/financeiro', 'urgente',
      jsonb_build_object('entry_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_fin_ins AFTER INSERT ON public.financial_entries
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_financial();
CREATE TRIGGER trg_notify_fin_upd AFTER UPDATE ON public.financial_entries
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_financial();

-- Insight IA
CREATE OR REPLACE FUNCTION public.tg_notify_insight()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_tenant(NEW.tenant_id, 'insight_ia'::notification_type,
    '✨ KassIA: ' || NEW.titulo, NEW.conteudo, '/insights',
    COALESCE(NEW.prioridade, 'media'::task_priority),
    jsonb_build_object('insight_id', NEW.id));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_insight AFTER INSERT ON public.ai_insights
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_insight();
