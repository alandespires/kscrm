
-- Trigger: registra activity de 'movimentacao' quando status do lead muda
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER
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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_lead_status_change ON public.leads;
CREATE TRIGGER trg_log_lead_status_change
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.log_lead_status_change();
