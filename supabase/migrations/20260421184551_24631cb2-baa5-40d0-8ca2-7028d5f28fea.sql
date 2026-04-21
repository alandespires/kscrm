-- Permite usuários autenticados criarem seu próprio tenant no onboarding
CREATE POLICY "tenants_authenticated_insert"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);