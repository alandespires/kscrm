-- Histórico de conversas da KassIA (por tenant + usuário)
CREATE TABLE public.kassia_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  titulo text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kassia_conv_user ON public.kassia_conversations(tenant_id, user_id, updated_at DESC);

ALTER TABLE public.kassia_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY kc_select ON public.kassia_conversations FOR SELECT TO authenticated
  USING (is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY kc_insert ON public.kassia_conversations FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY kc_update ON public.kassia_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY kc_delete ON public.kassia_conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_kc_updated BEFORE UPDATE ON public.kassia_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mensagens da conversa
CREATE TABLE public.kassia_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.kassia_conversations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kassia_msg_conv ON public.kassia_messages(conversation_id, created_at);

ALTER TABLE public.kassia_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY km_select ON public.kassia_messages FOR SELECT TO authenticated
  USING (is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY km_insert ON public.kassia_messages FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY km_delete ON public.kassia_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());