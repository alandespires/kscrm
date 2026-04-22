-- 1) Add valor_pago column to financial_entries for partial reconciliation
ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS valor_pago numeric NOT NULL DEFAULT 0;

-- 2) Create payments table for reconciliation history
CREATE TABLE IF NOT EXISTS public.financial_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  entry_id uuid NOT NULL REFERENCES public.financial_entries(id) ON DELETE CASCADE,
  valor numeric NOT NULL DEFAULT 0,
  pago_em date NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento public.financial_payment_method,
  observacoes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_payments_entry ON public.financial_payments(entry_id);
CREATE INDEX IF NOT EXISTS idx_financial_payments_tenant ON public.financial_payments(tenant_id);

ALTER TABLE public.financial_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_pay_select" ON public.financial_payments
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR is_tenant_member(tenant_id, auth.uid()));

CREATE POLICY "fin_pay_insert" ON public.financial_payments
  FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(tenant_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "fin_pay_update" ON public.financial_payments
  FOR UPDATE TO authenticated
  USING (is_tenant_member(tenant_id, auth.uid()))
  WITH CHECK (is_tenant_member(tenant_id, auth.uid()));

CREATE POLICY "fin_pay_delete" ON public.financial_payments
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()) OR is_tenant_admin(tenant_id, auth.uid()));

-- 3) Trigger: auto-sync entry status / recebido_em / valor_pago based on rules
CREATE OR REPLACE FUNCTION public.sync_entry_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If status set to pago and no recebido_em, set today
  IF NEW.status = 'pago' THEN
    IF NEW.recebido_em IS NULL THEN
      NEW.recebido_em := CURRENT_DATE;
    END IF;
    -- If valor_pago < valor, complete it (full payment when marking pago)
    IF COALESCE(NEW.valor_pago, 0) < NEW.valor THEN
      NEW.valor_pago := NEW.valor;
    END IF;
  END IF;

  -- If reverting from pago to pendente/atrasado/cancelado, clear recebido_em
  IF NEW.status <> 'pago' AND OLD.status = 'pago' THEN
    NEW.recebido_em := NULL;
  END IF;

  -- Auto-mark atrasado if pendente and past due
  IF NEW.status = 'pendente' AND NEW.vencimento IS NOT NULL AND NEW.vencimento < CURRENT_DATE THEN
    NEW.status := 'atrasado';
  END IF;

  -- If was atrasado and vencimento moved to future, revert to pendente
  IF NEW.status = 'atrasado' AND NEW.vencimento IS NOT NULL AND NEW.vencimento >= CURRENT_DATE THEN
    NEW.status := 'pendente';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_entry_status ON public.financial_entries;
CREATE TRIGGER trg_sync_entry_status
  BEFORE INSERT OR UPDATE ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_entry_status();

-- 4) Trigger on payments: recompute entry valor_pago + status
CREATE OR REPLACE FUNCTION public.recompute_entry_after_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id uuid;
  v_total numeric;
  v_valor numeric;
  v_last_pago date;
BEGIN
  v_entry_id := COALESCE(NEW.entry_id, OLD.entry_id);

  SELECT COALESCE(SUM(valor),0), MAX(pago_em)
    INTO v_total, v_last_pago
    FROM public.financial_payments
    WHERE entry_id = v_entry_id;

  SELECT valor INTO v_valor FROM public.financial_entries WHERE id = v_entry_id;

  UPDATE public.financial_entries
     SET valor_pago = v_total,
         status = CASE
           WHEN v_total >= v_valor AND v_valor > 0 THEN 'pago'::financial_status
           WHEN v_total > 0 THEN 'pendente'::financial_status
           ELSE status
         END,
         recebido_em = CASE
           WHEN v_total >= v_valor AND v_valor > 0 THEN COALESCE(v_last_pago, CURRENT_DATE)
           ELSE NULL
         END
   WHERE id = v_entry_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_entry_payment ON public.financial_payments;
CREATE TRIGGER trg_recompute_entry_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_entry_after_payment();