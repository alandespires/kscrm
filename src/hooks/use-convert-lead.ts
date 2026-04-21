import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireTenantId } from "@/contexts/tenant-context";
import { toast } from "sonner";
import type { LeadRow } from "@/hooks/use-leads";

export function useConvertLeadToClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: LeadRow) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();

      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("lead_id", lead.id)
        .maybeSingle();
      if (existing) throw new Error("Lead já convertido em cliente");

      const { data: client, error } = await supabase
        .from("clients")
        .insert({
          tenant_id,
          nome: lead.nome,
          empresa: lead.empresa,
          email: lead.email,
          whatsapp: lead.whatsapp,
          observacoes: lead.observacoes,
          contrato_valor: lead.valor_estimado,
          contrato_inicio: new Date().toISOString().slice(0, 10),
          lead_id: lead.id,
          owner_id: u.user.id,
        })
        .select()
        .single();
      if (error) throw error;

      if (lead.status !== "fechado") {
        const { error: upErr } = await supabase
          .from("leads")
          .update({ status: "fechado" })
          .eq("id", lead.id);
        if (upErr) throw upErr;
      }

      if (lead.valor_estimado && Number(lead.valor_estimado) > 0) {
        await supabase.from("deals").insert({
          tenant_id,
          titulo: lead.empresa || lead.nome,
          valor: lead.valor_estimado,
          stage: "fechado",
          fechado_em: new Date().toISOString(),
          lead_id: lead.id,
          owner_id: u.user.id,
          probabilidade: 100,
        });
      }

      await supabase.from("activities").insert({
        tenant_id,
        tipo: "movimentacao",
        descricao: `Lead convertido em cliente: ${lead.nome}`,
        lead_id: lead.id,
        client_id: client.id,
        user_id: u.user.id,
        metadata: { action: "convert_to_client" },
      });

      return client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Lead convertido em cliente");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro na conversão"),
  });
}
