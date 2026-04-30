import { useEffect, useState } from "react";

const KEY = "ks-dashboard-widgets-v1";

export type WidgetId = "kpis" | "receita" | "insights" | "pipeline" | "atividade";

const DEFAULT_VISIBLE: Record<WidgetId, boolean> = {
  kpis: true,
  receita: true,
  insights: true,
  pipeline: true,
  atividade: true,
};

export const WIDGET_LABELS: Record<WidgetId, string> = {
  kpis: "KPIs do topo",
  receita: "Gráfico de receita",
  insights: "IA Insights",
  pipeline: "Pipeline comercial",
  atividade: "Atividade recente",
};

export function useDashboardWidgets() {
  const [visible, setVisible] = useState<Record<WidgetId, boolean>>(() => {
    if (typeof window === "undefined") return DEFAULT_VISIBLE;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return DEFAULT_VISIBLE;
      return { ...DEFAULT_VISIBLE, ...JSON.parse(raw) };
    } catch { return DEFAULT_VISIBLE; }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(visible));
  }, [visible]);

  function toggle(id: WidgetId) {
    setVisible((p) => ({ ...p, [id]: !p[id] }));
  }
  function reset() { setVisible(DEFAULT_VISIBLE); }

  return { visible, toggle, reset };
}
