import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getActiveTenantId, requireTenantId } from "@/contexts/tenant-context";
import { toast } from "sonner";
import type { PaymentMethod } from "@/hooks/use-finance";

export type PaymentRow = {
  id: string;
  tenant_id: string;
  entry_id: string;
  valor: number;
  pago_em: string;
  forma_pagamento: PaymentMethod | null;
  observacoes: string | null;
  created_by: string;
  created_at: string;
};

export function useEntryPayments(entryId: string | null | undefined) {
  return useQuery({
    queryKey: ["fin-payments", entryId],
    enabled: !!entryId,
    queryFn: async (): Promise<PaymentRow[]> => {
      const { data, error } = await (supabase as any)
        .from("financial_payments")
        .select("*")
        .eq("entry_id", entryId!)
        .order("pago_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentRow[];
    },
  });
}

export function useAllPayments() {
  const tenantId = getActiveTenantId();
  return useQuery({
    queryKey: ["fin-payments-all", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<PaymentRow[]> => {
      const { data, error } = await (supabase as any)
        .from("financial_payments")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("pago_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentRow[];
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      entry_id: string;
      valor: number;
      pago_em: string;
      forma_pagamento?: PaymentMethod | null;
      observacoes?: string | null;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();
      const { data, error } = await (supabase as any)
        .from("financial_payments")
        .insert({ ...input, tenant_id, created_by: u.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as PaymentRow;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["fin-payments", vars.entry_id] });
      qc.invalidateQueries({ queryKey: ["fin-payments-all"] });
      qc.invalidateQueries({ queryKey: ["fin-entries"] });
      toast.success("Pagamento registrado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar pagamento"),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; entry_id: string }) => {
      const { error } = await (supabase as any).from("financial_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["fin-payments", vars.entry_id] });
      qc.invalidateQueries({ queryKey: ["fin-payments-all"] });
      qc.invalidateQueries({ queryKey: ["fin-entries"] });
      toast.success("Pagamento removido");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}
