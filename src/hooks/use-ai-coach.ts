import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CoachAction = {
  titulo: string;
  descricao: string;
  prioridade: "urgente" | "alta" | "media" | "baixa";
  foco: "leads_quentes" | "tarefas" | "prospeccao" | "reativacao" | "performance";
};

export type CoachResult = {
  resumo: string;
  acoes: CoachAction[];
  context: {
    total_leads: number;
    tarefas_em_aberto: number;
    tarefas_atrasadas: number;
    leads_quentes: any[];
    leads_parados_7d: any[];
    atividades_recentes: number;
  };
};

export function useAiCoach() {
  return useMutation({
    mutationFn: async (): Promise<CoachResult> => {
      const { data, error } = await supabase.functions.invoke("ai-coach", { body: {} });
      if (error) throw error;
      if ((data as any)?.error === "rate_limited") throw new Error("Muitas requisições. Aguarde alguns segundos.");
      if ((data as any)?.error === "credits_exhausted") throw new Error("Créditos de IA esgotados. Adicione fundos em Configurações.");
      if ((data as any)?.error) throw new Error(String((data as any).error));
      return data as CoachResult;
    },
    onError: (e: any) => toast.error(e.message ?? "Erro no IA Coach"),
  });
}
