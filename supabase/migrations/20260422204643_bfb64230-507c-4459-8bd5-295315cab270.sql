-- ============================================================
-- MÓDULO FINANCEIRO — KS CRM
-- Tabelas: financial_entries, financial_expenses, financial_subscriptions, financial_commissions
-- ============================================================

-- ENUMS
CREATE TYPE public.financial_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
CREATE TYPE public.financial_entry_category AS ENUM ('venda', 'assinatura', 'servico', 'consultoria', 'outros');
CREATE TYPE public.financial_expense_category AS ENUM ('salario', 'ferramenta', 'marketing', 'operacao', 'imposto', 'fornecedor', 'comissao', 'outros');
CREATE TYPE public.financial_payment_method AS ENUM ('pix', 'boleto', 'cartao_credito', 'cartao_debito', 'transferencia', 'dinheiro', 'outros');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'ativo', 'suspenso', 'cancelado', 'inadimplente');
CREATE TYPE public.commission_status AS ENUM ('pendente', 'aprovada', 'paga', 'cancelada');

-- ============================================================
-- ENTRADAS FINANCEIRAS
-- ============================================================
CREATE TABLE public.financial_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID,
  lead_id UUID,
  deal_id UUID,
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  categoria public.financial_entry_category NOT NULL DEFAULT 'venda',
  origem TEXT,
  forma_pagamento public.financial_payment_method,
  status public.financial_status NOT NULL DEFAULT 'pendente',
  vencimento DATE,
  recebido_em DATE,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fin_entries_tenant ON public.financial_entries(tenant_id);
CREATE INDEX idx_fin_entries_status ON public.financial_entries(tenant_id, status);
CREATE INDEX idx_fin_entries_vencimento ON public.financial_entries(tenant_id, vencimento);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_entries_select" ON public.financial_entries FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "fin_entries_insert" ON public.financial_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "fin_entries_update" ON public.financial_entries FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid())) WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "fin_entries_delete" ON public.financial_entries FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

CREATE TRIGGER trg_fin_entries_updated BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SAÍDAS / DESPESAS
-- ============================================================
CREATE TABLE public.financial_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  categoria public.financial_expense_category NOT NULL DEFAULT 'outros',
  fornecedor TEXT,
  forma_pagamento public.financial_payment_method,
  status public.financial_status NOT NULL DEFAULT 'pendente',
  vencimento DATE,
  pago_em DATE,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fin_expenses_tenant ON public.financial_expenses(tenant_id);
CREATE INDEX idx_fin_expenses_status ON public.financial_expenses(tenant_id, status);

ALTER TABLE public.financial_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_expenses_select" ON public.financial_expenses FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "fin_expenses_insert" ON public.financial_expenses FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "fin_expenses_update" ON public.financial_expenses FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid())) WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "fin_expenses_delete" ON public.financial_expenses FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

CREATE TRIGGER trg_fin_expenses_updated BEFORE UPDATE ON public.financial_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ASSINATURAS / RECORRÊNCIA (CRM-level, não confundir com tenant subscriptions)
-- ============================================================
CREATE TABLE public.financial_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID,
  plano TEXT NOT NULL,
  valor_mensal NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.subscription_status NOT NULL DEFAULT 'ativo',
  inicio DATE NOT NULL DEFAULT (now())::date,
  proximo_vencimento DATE,
  cancelado_em DATE,
  motivo_cancelamento TEXT,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fin_subs_tenant ON public.financial_subscriptions(tenant_id);
CREATE INDEX idx_fin_subs_status ON public.financial_subscriptions(tenant_id, status);

ALTER TABLE public.financial_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_subs_select" ON public.financial_subscriptions FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "fin_subs_insert" ON public.financial_subscriptions FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "fin_subs_update" ON public.financial_subscriptions FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid())) WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "fin_subs_delete" ON public.financial_subscriptions FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

CREATE TRIGGER trg_fin_subs_updated BEFORE UPDATE ON public.financial_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- COMISSÕES
-- ============================================================
CREATE TABLE public.financial_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  entry_id UUID,
  deal_id UUID,
  descricao TEXT NOT NULL,
  base_valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  percentual NUMERIC(6,2),
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.commission_status NOT NULL DEFAULT 'pendente',
  competencia DATE,
  paga_em DATE,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fin_comm_tenant ON public.financial_commissions(tenant_id);
CREATE INDEX idx_fin_comm_user ON public.financial_commissions(tenant_id, user_id);
CREATE INDEX idx_fin_comm_status ON public.financial_commissions(tenant_id, status);

ALTER TABLE public.financial_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_comm_select" ON public.financial_commissions FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "fin_comm_insert" ON public.financial_commissions FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "fin_comm_update" ON public.financial_commissions FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid())) WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "fin_comm_delete" ON public.financial_commissions FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(tenant_id, auth.uid()));

CREATE TRIGGER trg_fin_comm_updated BEFORE UPDATE ON public.financial_commissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TRIGGER: marca atrasados automaticamente quando consultado
-- (função utilitária para uso futuro em cron)
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_overdue_financial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.financial_entries
    SET status = 'atrasado'
    WHERE status = 'pendente' AND vencimento IS NOT NULL AND vencimento < CURRENT_DATE;
  UPDATE public.financial_expenses
    SET status = 'atrasado'
    WHERE status = 'pendente' AND vencimento IS NOT NULL AND vencimento < CURRENT_DATE;
END;
$$;