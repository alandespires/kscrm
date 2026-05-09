import { useEffect, useState } from "react";

export type SchoolSettings = {
  /** % máximo de faltas tolerado antes de virar alerta (ex.: 25 = 25%) */
  faltaPctLimite: number;
  /** mínimo de aulas registradas para o aluno aparecer como risco */
  minAulasParaRisco: number;
  /** dias após a data da avaliação para considerar "nota pendente" */
  diasParaNotaPendente: number;
  /** média mínima esperada (0-10) — abaixo disto entra em alerta */
  mediaMinima: number;
  /** abrir tarefa automaticamente quando alerta for gerado */
  gerarTarefasAuto: boolean;
};

const DEFAULTS: SchoolSettings = {
  faltaPctLimite: 25,
  minAulasParaRisco: 3,
  diasParaNotaPendente: 0,
  mediaMinima: 6,
  gerarTarefasAuto: false,
};

const KEY = "ks-escolar-settings";

export function loadSchoolSettings(): SchoolSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSchoolSettings(s: SchoolSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("ks-school-settings-changed"));
}

export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings>(() => loadSchoolSettings());

  useEffect(() => {
    const reload = () => setSettings(loadSchoolSettings());
    window.addEventListener("ks-school-settings-changed", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("ks-school-settings-changed", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  return {
    settings,
    update: (next: Partial<SchoolSettings>) => {
      const merged = { ...settings, ...next };
      setSettings(merged);
      saveSchoolSettings(merged);
    },
    reset: () => {
      setSettings(DEFAULTS);
      saveSchoolSettings(DEFAULTS);
    },
  };
}
