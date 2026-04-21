import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export type TenantRole = "tenant_admin" | "tenant_user";
export type TenantStatus = "trial" | "ativo" | "suspenso" | "cancelado";

export type TenantRow = {
  id: string;
  nome: string;
  slug: string;
  status: TenantStatus;
  plan_id: string | null;
  proximo_vencimento: string | null;
  trial_ate: string | null;
  responsavel: string | null;
  email_principal: string | null;
  whatsapp: string | null;
  logo_url: string | null;
};

export type Membership = {
  tenant: TenantRow;
  role: TenantRole;
};

type TenantCtx = {
  loading: boolean;
  isSuperAdmin: boolean;
  memberships: Membership[];
  current: Membership | null;
  setCurrentBySlug: (slug: string) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<TenantCtx | undefined>(undefined);

// Store global do tenant ativo — usado pelos hooks fora do React tree
let _activeTenantId: string | null = null;
export function getActiveTenantId(): string | null {
  return _activeTenantId;
}
export function requireTenantId(): string {
  if (!_activeTenantId) throw new Error("Nenhum tenant ativo. Acesse via /t/{slug}.");
  return _activeTenantId;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Roles globais
  const rolesQ = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as string);
    },
  });

  // Tenants em que o usuário é membro
  const membershipsQ = useQuery({
    queryKey: ["my-memberships", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Membership[]> => {
      const { data, error } = await supabase
        .from("tenant_users")
        .select("role, tenant:tenants(id, nome, slug, status, plan_id, proximo_vencimento, trial_ate, responsavel, email_principal, whatsapp, logo_url)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? [])
        .filter((r: any) => r.tenant)
        .map((r: any) => ({ role: r.role as TenantRole, tenant: r.tenant as TenantRow }));
    },
  });

  const isSuperAdmin = (rolesQ.data ?? []).includes("super_admin");
  const memberships = membershipsQ.data ?? [];

  // Determina tenant ativo
  const current = useMemo<Membership | null>(() => {
    if (!memberships.length) return null;
    if (activeSlug) {
      const found = memberships.find((m) => m.tenant.slug === activeSlug);
      if (found) return found;
    }
    // fallback: localStorage ou primeiro
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ks:tenant");
      if (stored) {
        const found = memberships.find((m) => m.tenant.slug === stored);
        if (found) return found;
      }
    }
    return memberships[0];
  }, [memberships, activeSlug]);

  // Sync store global + localStorage
  useEffect(() => {
    _activeTenantId = current?.tenant.id ?? null;
    if (current && typeof window !== "undefined") {
      localStorage.setItem("ks:tenant", current.tenant.slug);
    }
    // Invalida queries que dependem de tenant
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["deals"] });
    qc.invalidateQueries({ queryKey: ["activities"] });
    qc.invalidateQueries({ queryKey: ["automations"] });
    qc.invalidateQueries({ queryKey: ["ai_insights"] });
  }, [current?.tenant.id, qc]);

  function setCurrentBySlug(slug: string) {
    setActiveSlug(slug);
  }

  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["my-memberships"] }),
      qc.invalidateQueries({ queryKey: ["my-roles"] }),
    ]);
  }

  const loading = authLoading || rolesQ.isLoading || membershipsQ.isLoading;

  return (
    <Ctx.Provider value={{ loading, isSuperAdmin, memberships, current, setCurrentBySlug, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTenant() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTenant must be inside TenantProvider");
  return c;
}

export function useCurrentTenant(): TenantRow {
  const { current } = useTenant();
  if (!current) throw new Error("Sem tenant ativo");
  return current.tenant;
}
