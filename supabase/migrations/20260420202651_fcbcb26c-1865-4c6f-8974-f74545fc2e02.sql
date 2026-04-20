-- =======================
-- AUTOMATIONS
-- =======================
CREATE TYPE public.automation_trigger AS ENUM (
  'lead_criado',
  'status_mudou',
  'score_alto',
  'score_baixou'
);

CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  trigger_tipo public.automation_trigger NOT NULL,
  trigger_valor text,
  acoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  execucoes integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Automations: autenticado vê" ON public.automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Automations: autenticado cria" ON public.automations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Automations: autenticado edita" ON public.automations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Automations: criador ou admin deleta" ON public.automations FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =======================
-- AUTOMATION RUNS
-- =======================
CREATE TABLE public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  resultado jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Runs: autenticado vê" ON public.automation_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Runs: sistema cria" ON public.automation_runs FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_automation_runs_automation ON public.automation_runs(automation_id, created_at DESC);

-- =======================
-- EXECUTOR
-- Cada ação é um objeto: { tipo: 'criar_tarefa'|'registrar_atividade', titulo?, descricao?, prioridade?, prazo_dias?, tipo_atividade? }
-- =======================
CREATE OR REPLACE FUNCTION public.execute_automations(_trigger public.automation_trigger, _lead leads)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule public.automations%ROWTYPE;
  acao jsonb;
  v_user uuid;
  v_actions_done jsonb := '[]'::jsonb;
  v_match boolean;
BEGIN
  v_user := COALESCE(auth.uid(), _lead.owner_id, _lead.created_by);

  FOR rule IN SELECT * FROM public.automations WHERE ativo = true AND trigger_tipo = _trigger
  LOOP
    -- Match condicional por trigger_valor
    v_match := true;
    IF rule.trigger_valor IS NOT NULL AND rule.trigger_valor <> '' THEN
      IF _trigger = 'status_mudou' AND _lead.status::text <> rule.trigger_valor THEN v_match := false; END IF;
      IF _trigger = 'lead_criado' AND COALESCE(_lead.origem,'') <> rule.trigger_valor THEN v_match := false; END IF;
      IF _trigger = 'score_alto' AND COALESCE(_lead.ai_score,0) < rule.trigger_valor::int THEN v_match := false; END IF;
    END IF;
    IF NOT v_match THEN CONTINUE; END IF;

    v_actions_done := '[]'::jsonb;
    FOR acao IN SELECT * FROM jsonb_array_elements(rule.acoes)
    LOOP
      IF acao->>'tipo' = 'criar_tarefa' THEN
        INSERT INTO public.tasks (titulo, descricao, prioridade, lead_id, created_by, assignee_id, prazo)
        VALUES (
          COALESCE(acao->>'titulo', 'Tarefa automática: ' || _lead.nome),
          acao->>'descricao',
          COALESCE((acao->>'prioridade')::task_priority, 'media'::task_priority),
          _lead.id,
          v_user,
          v_user,
          CASE WHEN acao ? 'prazo_dias' THEN now() + ((acao->>'prazo_dias')::int || ' days')::interval ELSE NULL END
        );
        v_actions_done := v_actions_done || jsonb_build_object('tipo','criar_tarefa','titulo', acao->>'titulo');
      ELSIF acao->>'tipo' = 'registrar_atividade' THEN
        INSERT INTO public.activities (tipo, descricao, lead_id, user_id, metadata)
        VALUES (
          COALESCE((acao->>'tipo_atividade')::activity_type, 'nota'::activity_type),
          COALESCE(acao->>'descricao', '[Automação] ' || rule.nome),
          _lead.id,
          v_user,
          jsonb_build_object('automation_id', rule.id)
        );
        v_actions_done := v_actions_done || jsonb_build_object('tipo','registrar_atividade');
      END IF;
    END LOOP;

    -- Atualiza contador
    UPDATE public.automations SET execucoes = execucoes + 1 WHERE id = rule.id;

    -- Loga execução
    INSERT INTO public.automation_runs (automation_id, lead_id, resultado)
    VALUES (rule.id, _lead.id, jsonb_build_object('acoes', v_actions_done));
  END LOOP;
END;
$$;

-- =======================
-- TRIGGERS
-- =======================
CREATE OR REPLACE FUNCTION public.tg_lead_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.execute_automations('lead_criado'::automation_trigger, NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tg_lead_created ON public.leads;
CREATE TRIGGER trg_tg_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_lead_created();

-- Estende o trigger de status: chama execute_automations
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_user := COALESCE(auth.uid(), NEW.owner_id, NEW.created_by);
    INSERT INTO public.activities (user_id, lead_id, tipo, descricao, metadata)
    VALUES (
      v_user,
      NEW.id,
      'movimentacao'::activity_type,
      'Status alterado: ' || OLD.status::text || ' → ' || NEW.status::text,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
    PERFORM public.execute_automations('status_mudou'::automation_trigger, NEW);
  END IF;

  -- Score subiu para 80+
  IF (OLD.ai_score IS NULL OR OLD.ai_score < 80) AND COALESCE(NEW.ai_score,0) >= 80 THEN
    PERFORM public.execute_automations('score_alto'::automation_trigger, NEW);
  END IF;

  -- Score caiu mais de 20 pontos
  IF OLD.ai_score IS NOT NULL AND NEW.ai_score IS NOT NULL AND (OLD.ai_score - NEW.ai_score) >= 20 THEN
    PERFORM public.execute_automations('score_baixou'::automation_trigger, NEW);
  END IF;

  RETURN NEW;
END;
$$;

-- Realtime
ALTER TABLE public.automations REPLICA IDENTITY FULL;
ALTER TABLE public.automation_runs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_runs;