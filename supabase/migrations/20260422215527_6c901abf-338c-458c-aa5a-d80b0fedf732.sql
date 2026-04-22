-- Enable RLS on realtime.messages and restrict subscriptions to authenticated users
-- whose channel topic matches a tenant they belong to.
-- Convention: channel name must be either:
--   * "tenant:<tenant_id>:..." (preferred for new code)
--   * legacy "realtime-<table>-..." channels are blocked from non-tenant data.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_tenant_realtime_select" ON realtime.messages;
CREATE POLICY "authenticated_tenant_realtime_select"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow if topic encodes a tenant the user belongs to: tenant:<uuid>:*
  EXISTS (
    SELECT 1
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
      AND realtime.topic() LIKE 'tenant:' || tu.tenant_id::text || ':%'
  )
);

DROP POLICY IF EXISTS "authenticated_tenant_realtime_insert" ON realtime.messages;
CREATE POLICY "authenticated_tenant_realtime_insert"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
      AND realtime.topic() LIKE 'tenant:' || tu.tenant_id::text || ':%'
  )
);
