import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LeadRow } from "./use-leads";

export function useScoreLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead_id: string) => {
      const { data, error } = await supabase.functions.invoke("score-lead", {
        body: { lead_id },
      });
      if (error) {
        // Tenta extrair mensagem amigável do response body
        const msg = (error as any)?.context?.error ?? error.message ?? "Erro ao analisar lead";
        throw new Error(msg);
      }
      return data as { ai_score: number; ai_resumo: string; ai_sugestao: string };
    },
    onSuccess: (res, lead_id) => {
      qc.setQueryData<LeadRow[]>(["leads"], (prev) =>
        prev?.map((l) => (l.id === lead_id ? { ...l, ...res } : l)) ?? prev
      );
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`IA: score ${res.ai_score}`, { description: res.ai_sugestao });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha na análise IA"),
  });
}
