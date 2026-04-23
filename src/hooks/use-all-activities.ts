import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getActiveTenantId } from "@/contexts/tenant-context";
import type { ActivityRow } from "@/hooks/use-activities";

export type ActivityFilters = {
  tipos?: string[];
  leadId?: string | null;
  clientId?: string | null;
  from?: string | null; // ISO date
  to?: string | null;
  search?: string;
};

export function useAllActivities(filters: ActivityFilters = {}) {
  const tenantId = getActiveTenantId();
  return useQuery({
    queryKey: ["activities", tenantId, "all", filters],
    enabled: !!tenantId,
    queryFn: async (): Promise<ActivityRow[]> => {
      let q = supabase
        .from("activities")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (filters.tipos?.length) q = q.in("tipo", filters.tipos as any);
      if (filters.leadId) q = q.eq("lead_id", filters.leadId);
      if (filters.clientId) q = q.eq("client_id", filters.clientId);
      if (filters.from) q = q.gte("created_at", filters.from);
      if (filters.to) q = q.lte("created_at", filters.to);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as ActivityRow[];
      if (filters.search?.trim()) {
        const s = filters.search.toLowerCase();
        rows = rows.filter((r) => r.descricao.toLowerCase().includes(s));
      }
      return rows;
    },
  });
}
