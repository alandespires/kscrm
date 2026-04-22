-- 1. Restrict profiles SELECT to same-tenant members (and self / super_admin)
DROP POLICY IF EXISTS "Profiles: todos autenticados podem ver" ON public.profiles;

CREATE POLICY "profiles_self_or_same_tenant_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.tenant_users tu_self
    JOIN public.tenant_users tu_other
      ON tu_other.tenant_id = tu_self.tenant_id
    WHERE tu_self.user_id = auth.uid()
      AND tu_other.user_id = profiles.id
  )
);

-- 2. KassIA conversations DELETE — also require tenant membership
DROP POLICY IF EXISTS kc_delete ON public.kassia_conversations;
CREATE POLICY kc_delete
ON public.kassia_conversations
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND public.is_tenant_member(tenant_id, auth.uid()));

-- 3. KassIA messages DELETE — also require tenant membership
DROP POLICY IF EXISTS km_delete ON public.kassia_messages;
CREATE POLICY km_delete
ON public.kassia_messages
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND public.is_tenant_member(tenant_id, auth.uid()));

-- 4. Prevent tenant_admins from creating super_admin roles
-- Restrict tenant_users role to non-super values (super_admin lives in user_roles, not tenant_users — but enforce explicitly)
ALTER TABLE public.tenant_users
  DROP CONSTRAINT IF EXISTS tenant_users_role_check;
ALTER TABLE public.tenant_users
  ADD CONSTRAINT tenant_users_role_check
  CHECK (role IN ('tenant_admin','tenant_user'));

-- And ensure user_roles cannot be inserted by anyone except super_admin (already the case via existing policies, but make it explicit)
-- No additional policy needed here; absence of permissive INSERT policy denies by default for non-super.
