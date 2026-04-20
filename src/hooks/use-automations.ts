import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AutomationTrigger = "lead_criado" | "status_mudou" | "score_alto" | "score_baixou";

export type AutomationAction =
  | { tipo: "criar_tarefa"; titulo: string; descricao?: string; prioridade?: "baixa" | "media" | "alta" | "urgente"; prazo_dias?: number }
  | { tipo: "registrar_atividade"; descricao: string; tipo_atividade?: "ligacao" | "email" | "whatsapp" | "reuniao" | "nota" };

export type AutomationRow = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  trigger_tipo: AutomationTrigger;
  trigger_valor: string | null;
  acoes: AutomationAction[];
  execucoes: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: async (): Promise<AutomationRow[]> => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<AutomationRow, "id" | "execucoes" | "created_by" | "created_at" | "updated_at">) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("automations").insert({
        ...input,
        acoes: input.acoes as any,
        created_by: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Automação criada"); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar"),
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("automations").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Removida"); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}

export function useAutomationRuns(automationId: string | null) {
  return useQuery({
    queryKey: ["automation_runs", automationId],
    enabled: !!automationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_runs")
        .select("*")
        .eq("automation_id", automationId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}
