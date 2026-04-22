import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getActiveTenantId, requireTenantId } from "@/contexts/tenant-context";
import { toast } from "sonner";

export type ConvRow = {
  id: string;
  titulo: string;
  created_at: string;
  updated_at: string;
};

export type MsgRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: any;
  created_at: string;
};

export function useConversations() {
  const tenantId = getActiveTenantId();
  return useQuery({
    queryKey: ["kassia-conv", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<ConvRow[]> => {
      const { data, error } = await supabase
        .from("kassia_conversations")
        .select("id,titulo,created_at,updated_at")
        .eq("tenant_id", tenantId!)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as ConvRow[];
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["kassia-msg", conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<MsgRow[]> => {
      const { data, error } = await supabase
        .from("kassia_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MsgRow[];
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (titulo = "Nova conversa") => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();
      const { data, error } = await supabase
        .from("kassia_conversations")
        .insert({ tenant_id, user_id: u.user.id, titulo })
        .select()
        .single();
      if (error) throw error;
      return data as ConvRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kassia-conv"] }),
  });
}

export function useAppendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversation_id: string; role: "user" | "assistant"; content: string; metadata?: any }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();
      const { data, error } = await supabase.from("kassia_messages").insert({
        conversation_id: input.conversation_id,
        tenant_id,
        user_id: u.user.id,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? {},
      }).select().single();
      if (error) throw error;
      // bump conversation updated_at
      await supabase.from("kassia_conversations").update({ updated_at: new Date().toISOString() }).eq("id", input.conversation_id);
      return data as MsgRow;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["kassia-msg", vars.conversation_id] });
      qc.invalidateQueries({ queryKey: ["kassia-conv"] });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kassia_conversations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kassia-conv"] });
      toast.success("Conversa removida");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });
}

export function useRenameConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, titulo }: { id: string; titulo: string }) => {
      const { error } = await supabase.from("kassia_conversations").update({ titulo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kassia-conv"] }),
  });
}
