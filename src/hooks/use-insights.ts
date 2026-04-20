import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Priority = "baixa" | "media" | "alta" | "urgente";

export type InsightRow = {
  id: string;
  lead_id: string | null;
  tipo: string;
  titulo: string;
  conteudo: string;
  prioridade: Priority | null;
  lido: boolean | null;
  created_at: string;
};

export function useInsights(prioridade?: Priority | "todas") {
  return useQuery({
    queryKey: ["ai_insights", prioridade ?? "todas"],
    queryFn: async (): Promise<InsightRow[]> => {
      let q = supabase.from("ai_insights").select("*").order("created_at", { ascending: false });
      if (prioridade && prioridade !== "todas") q = q.eq("prioridade", prioridade);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as InsightRow[];
    },
  });
}

export function useMarkInsightRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lido }: { id: string; lido: boolean }) => {
      const { error } = await supabase.from("ai_insights").update({ lido }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_insights"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar insight"),
  });
}
