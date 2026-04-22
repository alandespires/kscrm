import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getActiveTenantId, requireTenantId } from "@/contexts/tenant-context";
import { toast } from "sonner";

export type FinStatus = "pendente" | "pago" | "atrasado" | "cancelado";
export type EntryCategory = "venda" | "assinatura" | "servico" | "consultoria" | "outros";
export type ExpenseCategory = "salario" | "ferramenta" | "marketing" | "operacao" | "imposto" | "fornecedor" | "comissao" | "outros";
export type PaymentMethod = "pix" | "boleto" | "cartao_credito" | "cartao_debito" | "transferencia" | "dinheiro" | "outros";
export type SubStatus = "trial" | "ativo" | "suspenso" | "cancelado" | "inadimplente";
export type CommissionStatus = "pendente" | "aprovada" | "paga" | "cancelada";

export type EntryRow = {
  id: string; tenant_id: string; client_id: string | null; lead_id: string | null; deal_id: string | null;
  descricao: string; valor: number; valor_pago: number; categoria: EntryCategory; origem: string | null;
  forma_pagamento: PaymentMethod | null; status: FinStatus;
  vencimento: string | null; recebido_em: string | null; observacoes: string | null;
  created_by: string; created_at: string; updated_at: string;
};
export type ExpenseRow = {
  id: string; tenant_id: string; descricao: string; valor: number; categoria: ExpenseCategory;
  fornecedor: string | null; forma_pagamento: PaymentMethod | null; status: FinStatus;
  vencimento: string | null; pago_em: string | null; recorrente: boolean; observacoes: string | null;
  created_by: string; created_at: string; updated_at: string;
};
export type SubRow = {
  id: string; tenant_id: string; client_id: string | null; plano: string; valor_mensal: number;
  status: SubStatus; inicio: string; proximo_vencimento: string | null;
  cancelado_em: string | null; motivo_cancelamento: string | null; observacoes: string | null;
  created_by: string; created_at: string; updated_at: string;
};
export type CommissionRow = {
  id: string; tenant_id: string; user_id: string; entry_id: string | null; deal_id: string | null;
  descricao: string; base_valor: number; percentual: number | null; valor: number;
  status: CommissionStatus; competencia: string | null; paga_em: string | null;
  observacoes: string | null; created_by: string; created_at: string; updated_at: string;
};

// =============== ENTRADAS ===============
export function useEntries() {
  const tenantId = getActiveTenantId();
  return useQuery({
    queryKey: ["fin-entries", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<EntryRow[]> => {
      const { data, error } = await supabase.from("financial_entries")
        .select("*").eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EntryRow[];
    },
  });
}
export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EntryRow> & { descricao: string; valor: number }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();
      const { data, error } = await supabase.from("financial_entries").insert({
        ...input, tenant_id, created_by: u.user.id,
      }).select().single();
      if (error) throw error;
      return data as EntryRow;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-entries"] }); toast.success("Entrada registrada"); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar entrada"),
  });
}
export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<EntryRow> & { id: string }) => {
      const { error } = await supabase.from("financial_entries").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-entries"] }); toast.success("Entrada atualizada"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}
export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-entries"] }); toast.success("Entrada removida"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}

// =============== SAÍDAS ===============
export function useExpenses() {
  const tenantId = getActiveTenantId();
  return useQuery({
    queryKey: ["fin-expenses", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<ExpenseRow[]> => {
      const { data, error } = await supabase.from("financial_expenses")
        .select("*").eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExpenseRow[];
    },
  });
}
export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ExpenseRow> & { descricao: string; valor: number }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();
      const { data, error } = await supabase.from("financial_expenses").insert({
        ...input, tenant_id, created_by: u.user.id,
      }).select().single();
      if (error) throw error;
      return data as ExpenseRow;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-expenses"] }); toast.success("Despesa registrada"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}
export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ExpenseRow> & { id: string }) => {
      const { error } = await supabase.from("financial_expenses").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-expenses"] }); toast.success("Despesa atualizada"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}
export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-expenses"] }); toast.success("Despesa removida"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}

// =============== ASSINATURAS ===============
export function useFinSubscriptions() {
  const tenantId = getActiveTenantId();
  return useQuery({
    queryKey: ["fin-subs", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<SubRow[]> => {
      const { data, error } = await supabase.from("financial_subscriptions")
        .select("*").eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SubRow[];
    },
  });
}
export function useCreateFinSub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<SubRow> & { plano: string; valor_mensal: number }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();
      const { data, error } = await supabase.from("financial_subscriptions").insert({
        ...input, tenant_id, created_by: u.user.id,
      }).select().single();
      if (error) throw error;
      return data as SubRow;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-subs"] }); toast.success("Assinatura criada"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}
export function useUpdateFinSub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<SubRow> & { id: string }) => {
      const { error } = await supabase.from("financial_subscriptions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-subs"] }); toast.success("Atualizado"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}
export function useDeleteFinSub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_subscriptions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-subs"] }); toast.success("Removida"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}

// =============== COMISSÕES ===============
export function useCommissions() {
  const tenantId = getActiveTenantId();
  return useQuery({
    queryKey: ["fin-comm", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<CommissionRow[]> => {
      const { data, error } = await supabase.from("financial_commissions")
        .select("*").eq("tenant_id", tenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CommissionRow[];
    },
  });
}
export function useCreateCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CommissionRow> & { descricao: string; valor: number; user_id: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();
      const { data, error } = await supabase.from("financial_commissions").insert({
        ...input, tenant_id, created_by: u.user.id,
      }).select().single();
      if (error) throw error;
      return data as CommissionRow;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-comm"] }); toast.success("Comissão registrada"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}
export function useUpdateCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CommissionRow> & { id: string }) => {
      const { error } = await supabase.from("financial_commissions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-comm"] }); toast.success("Atualizado"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}
export function useDeleteCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_commissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-comm"] }); toast.success("Removida"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}

// =============== UTIL ===============
export function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}
export function startOfMonth(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth(), 1); return x; }
export function endOfMonth(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59); return x; }
