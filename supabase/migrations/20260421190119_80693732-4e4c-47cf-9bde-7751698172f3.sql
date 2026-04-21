-- Função SECURITY DEFINER para criar tenant + membership em uma transação atômica
-- Isso evita problemas de RLS e garante consistência (tenant + tenant_users sempre criados juntos)
CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
  _nome text,
  _slug text,
  _responsavel text DEFAULT NULL,
  _email_principal text DEFAULT NULL
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _final_slug text;
  _suffix int := 0;
  _new_tenant public.tenants;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF _nome IS NULL OR length(trim(_nome)) = 0 THEN
    RAISE EXCEPTION 'Nome é obrigatório';
  END IF;

  -- Garante slug único
  _final_slug := _slug;
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = _final_slug) LOOP
    _suffix := _suffix + 1;
    _final_slug := _slug || '-' || _suffix::text;
    IF _suffix > 100 THEN
      RAISE EXCEPTION 'Não foi possível gerar slug único';
    END IF;
  END LOOP;

  -- Cria o tenant
  INSERT INTO public.tenants (nome, slug, responsavel, email_principal, status, trial_ate, created_by)
  VALUES (
    trim(_nome),
    _final_slug,
    _responsavel,
    _email_principal,
    'trial'::tenant_status,
    (now() + interval '14 days')::date,
    _user_id
  )
  RETURNING * INTO _new_tenant;

  -- Associa o usuário como tenant_admin
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  VALUES (_new_tenant.id, _user_id, 'tenant_admin'::tenant_role);

  RETURN _new_tenant;
END;
$$;

-- Permite usuários autenticados executarem
GRANT EXECUTE ON FUNCTION public.create_tenant_with_owner(text, text, text, text) TO authenticated;