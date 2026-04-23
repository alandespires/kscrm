import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireTenantId } from "@/contexts/tenant-context";
import { toast } from "sonner";
import type { LeadRow } from "@/hooks/use-leads";
import type { EntryCategory, PaymentMethod } from "@/hooks/use-finance";

export type InstallmentPlan = {
  enabled: boolean;
  totalValor: number;            // valor total da venda
  entradaPct: number;            // 0..100 — % do total a ser cobrado como entrada (sinal)
  entradaPaga: boolean;          // marcar entrada como já paga (recebida hoje)
  parcelas: number;              // nº de parcelas do RESTANTE (>=1)
  primeiraVenc: string | null;   // YYYY-MM-DD — vencimento da 1ª parcela do restante
  intervaloDias: number;         // intervalo entre parcelas (default 30)
  formaPagamento?: PaymentMethod | null;
  categoria?: EntryCategory;
};

export type ConvertOptions = {
  generateFinancial?: boolean;
  finCategoria?: EntryCategory;
  finVencimento?: string | null;
  finValor?: number;
  installments?: InstallmentPlan;  // novo
};

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function useConvertLeadToClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lead, options }: { lead: LeadRow; options?: ConvertOptions }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const tenant_id = requireTenantId();

      const { data: existing } = await supabase
        .from("clients").select("id").eq("lead_id", lead.id).maybeSingle();
      if (existing) throw new Error("Lead já convertido em cliente");

      const inst = options?.installments;
      const valorTotal = inst?.enabled
        ? Number(inst.totalValor || 0)
        : Number(options?.finValor ?? lead.valor_estimado ?? 0);

      const { data: client, error } = await supabase
        .from("clients").insert({
          tenant_id,
          nome: lead.nome,
          empresa: lead.empresa,
          email: lead.email,
          whatsapp: lead.whatsapp,
          observacoes: lead.observacoes,
          contrato_valor: valorTotal || lead.valor_estimado,
          contrato_inicio: new Date().toISOString().slice(0, 10),
          lead_id: lead.id,
          owner_id: u.user.id,
        }).select().single();
      if (error) throw error;

      if (lead.status !== "fechado") {
        await supabase.from("leads").update({ status: "fechado" }).eq("id", lead.id);
      }

      let dealId: string | null = null;
      if (valorTotal > 0) {
        const { data: deal } = await supabase.from("deals").insert({
          tenant_id,
          titulo: lead.empresa || lead.nome,
          valor: valorTotal,
          stage: "fechado",
          fechado_em: new Date().toISOString(),
          lead_id: lead.id,
          owner_id: u.user.id,
          probabilidade: 100,
        }).select().single();
        dealId = deal?.id ?? null;
      }

      // ===== FINANCEIRO =====
      if (options?.generateFinancial && valorTotal > 0) {
        // Modo PARCELADO
        if (inst?.enabled && inst.parcelas >= 1) {
          const entradaValor = Math.round((valorTotal * (inst.entradaPct || 0)) / 100 * 100) / 100;
          const restante = Math.round((valorTotal - entradaValor) * 100) / 100;
          const intervalo = inst.intervaloDias || 30;
          const baseDate = inst.primeiraVenc || addDaysISO(new Date().toISOString().slice(0, 10), intervalo);

          // distribuir parcelas com ajuste do centavo na última
          const parcelaBase = Math.floor((restante / inst.parcelas) * 100) / 100;
          const sobra = Math.round((restante - parcelaBase * inst.parcelas) * 100) / 100;

          const rows: any[] = [];

          // Entrada (sinal)
          if (entradaValor > 0) {
            rows.push({
              tenant_id, client_id: client.id, lead_id: lead.id, deal_id: dealId,
              descricao: `Entrada (${inst.entradaPct}%) — ${lead.empresa || lead.nome}`,
              valor: entradaValor,
              valor_pago: inst.entradaPaga ? entradaValor : 0,
              categoria: inst.categoria ?? options.finCategoria ?? "venda",
              status: inst.entradaPaga ? "pago" : "pendente",
              vencimento: new Date().toISOString().slice(0, 10),
              recebido_em: inst.entradaPaga ? new Date().toISOString().slice(0, 10) : null,
              forma_pagamento: inst.formaPagamento ?? null,
              created_by: u.user.id,
            });
          }

          // Parcelas do restante
          for (let i = 1; i <= inst.parcelas; i++) {
            const valor = i === inst.parcelas ? Math.round((parcelaBase + sobra) * 100) / 100 : parcelaBase;
            const venc = addDaysISO(baseDate, (i - 1) * intervalo);
            rows.push({
              tenant_id, client_id: client.id, lead_id: lead.id, deal_id: dealId,
              descricao: `Parcela ${i}/${inst.parcelas} — ${lead.empresa || lead.nome}`,
              valor,
              valor_pago: 0,
              categoria: inst.categoria ?? options.finCategoria ?? "venda",
              status: "pendente",
              vencimento: venc,
              forma_pagamento: inst.formaPagamento ?? null,
              created_by: u.user.id,
            });
          }

          if (rows.length) {
            const { error: feErr } = await supabase.from("financial_entries").insert(rows);
            if (feErr) throw feErr;
          }
        } else {
          // Modo entrada única (legado)
          const { error: feErr } = await supabase.from("financial_entries").insert({
            tenant_id, client_id: client.id, lead_id: lead.id, deal_id: dealId,
            descricao: `Venda — ${lead.empresa || lead.nome}`,
            valor: valorTotal,
            categoria: options.finCategoria ?? "venda",
            origem: lead.origem ?? null,
            status: "pendente",
            vencimento: options.finVencimento || null,
            created_by: u.user.id,
          });
          if (feErr) throw feErr;
        }
      }

      await supabase.from("activities").insert({
        tenant_id, tipo: "movimentacao",
        descricao: `Lead convertido em cliente: ${lead.nome}` +
          (options?.generateFinancial
            ? inst?.enabled
              ? ` (parcelado em ${inst.parcelas + (inst.entradaPct > 0 ? 1 : 0)}x)`
              : " (entrada financeira gerada)"
            : ""),
        lead_id: lead.id, client_id: client.id,
        user_id: u.user.id,
        metadata: { action: "convert_to_client", financial: !!options?.generateFinancial, installments: inst?.enabled ?? false },
      });

      return client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["fin-entries"] });
      toast.success("Lead convertido em cliente");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro na conversão"),
  });
}
