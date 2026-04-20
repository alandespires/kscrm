import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DealRow = {
  id: string;
  titulo: string;
  valor: number;
  stage: string;
  fechado_em: string | null;
  created_at: string;
  lead_id: string | null;
};

export type ActivityRow = {
  id: string;
  tipo: string;
  descricao: string;
  created_at: string;
  user_id: string;
  lead_id: string | null;
  metadata: any;
};

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async (): Promise<DealRow[]> => {
      const { data, error } = await supabase
        .from("deals")
        .select("id,titulo,valor,stage,fechado_em,created_at,lead_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DealRow[];
    },
  });
}

export function useActivities(limit = 8) {
  return useQuery({
    queryKey: ["activities", limit],
    queryFn: async (): Promise<(ActivityRow & { profile?: { full_name: string | null } | null })[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
}

export function useRevenueSeries() {
  return useQuery({
    queryKey: ["revenue_series"],
    queryFn: async () => {
      // Build last 7 months from leads (previsto = valor_estimado) and deals (fechado em fechado_em)
      const months: { key: string; label: string; year: number; month: number }[] = [];
      const now = new Date();
      const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: `${d.getFullYear()}-${d.getMonth()}`,
          label: labels[d.getMonth()],
          year: d.getFullYear(),
          month: d.getMonth(),
        });
      }

      const since = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();

      const [{ data: leads }, { data: deals }] = await Promise.all([
        supabase.from("leads").select("valor_estimado, created_at").gte("created_at", since),
        supabase.from("deals").select("valor, fechado_em, stage").gte("created_at", since),
      ]);

      return months.map((m) => {
        const previsto = (leads ?? [])
          .filter((l: any) => {
            const d = new Date(l.created_at);
            return d.getFullYear() === m.year && d.getMonth() === m.month;
          })
          .reduce((s: number, l: any) => s + Number(l.valor_estimado ?? 0), 0);

        const fechado = (deals ?? [])
          .filter((d: any) => {
            if (d.stage !== "fechado" || !d.fechado_em) return false;
            const dt = new Date(d.fechado_em);
            return dt.getFullYear() === m.year && dt.getMonth() === m.month;
          })
          .reduce((s: number, d: any) => s + Number(d.valor ?? 0), 0);

        return { month: m.label, previsto: Math.round(previsto / 1000), fechado: Math.round(fechado / 1000) };
      });
    },
  });
}
