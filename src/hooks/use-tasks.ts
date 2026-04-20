import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TaskPriority = "baixa" | "media" | "alta" | "urgente";
export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "cancelada";

export type TaskRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: TaskStatus;
  prioridade: TaskPriority;
  prazo: string | null;
  concluida_em: string | null;
  lead_id: string | null;
  client_id: string | null;
  assignee_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export function useTasks(opts?: { leadId?: string }) {
  return useQuery({
    queryKey: ["tasks", opts?.leadId ?? "all"],
    queryFn: async (): Promise<TaskRow[]> => {
      let q = supabase.from("tasks").select("*").order("prazo", { ascending: true, nullsFirst: false });
      if (opts?.leadId) q = q.eq("lead_id", opts.leadId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      titulo: string; descricao?: string; prioridade?: TaskPriority;
      prazo?: string | null; lead_id?: string | null; client_id?: string | null;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("tasks").insert({
        ...input,
        created_by: u.user.id,
        assignee_id: u.user.id,
        prioridade: input.prioridade ?? "media",
        status: "pendente" as const,
      }).select().single();
      if (error) throw error;
      return data as TaskRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar tarefa"),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("tasks").update({
        status: done ? "concluida" : "pendente",
        concluida_em: done ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueriesData<TaskRow[]>({ queryKey: ["tasks"] });
      prev.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<TaskRow[]>(key, data.map((t) => t.id === id
          ? { ...t, status: done ? "concluida" : "pendente", concluida_em: done ? new Date().toISOString() : null }
          : t));
      });
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(e.message ?? "Erro ao atualizar");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa removida");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });
}
