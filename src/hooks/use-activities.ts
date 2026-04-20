import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ActivityType = "ligacao" | "email" | "whatsapp" | "reuniao" | "nota" | "movimentacao" | "tarefa";

export type ActivityRow = {
  id: string;
  tipo: ActivityType;
  descricao: string;
  lead_id: string | null;
  client_id: string | null;
  user_id: string;
  metadata: any;
  created_at: string;
};

export function useLeadActivities(leadId: string | null) {
  return useQuery({
    queryKey: ["activities", "lead", leadId],
    enabled: !!leadId,
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tipo: ActivityType; descricao: string; lead_id?: string; client_id?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("activities").insert({
        ...input,
        user_id: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade registrada");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar"),
  });
}
