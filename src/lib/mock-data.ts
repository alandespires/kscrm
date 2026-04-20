export type DealStage =
  | "novo"
  | "contato"
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "fechado"
  | "perdido";

export const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: "novo", label: "Novo Lead", color: "oklch(0.65 0.02 250)" },
  { id: "contato", label: "Contato Inicial", color: "oklch(0.7 0.12 220)" },
  { id: "qualificacao", label: "Qualificação", color: "oklch(0.72 0.14 180)" },
  { id: "proposta", label: "Proposta", color: "oklch(0.78 0.16 80)" },
  { id: "negociacao", label: "Negociação", color: "oklch(0.685 0.175 45)" },
  { id: "fechado", label: "Fechado", color: "oklch(0.72 0.21 142)" },
  { id: "perdido", label: "Perdido", color: "oklch(0.55 0.18 25)" },
];

export type Deal = {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  stage: DealStage;
  owner: string;
  ownerInitials: string;
  daysInStage: number;
  aiScore: number; // 0-100
  tags: string[];
};

export const DEALS: Deal[] = [
  { id: "d1", title: "Implementação CRM Enterprise", company: "Acme Corp", contact: "Marina Souza", value: 84000, stage: "negociacao", owner: "Anna D.", ownerInitials: "AD", daysInStage: 2, aiScore: 87, tags: ["Hot", "Enterprise"] },
  { id: "d2", title: "Plano Anual Pro", company: "Northwind Ltda", contact: "Carlos Pereira", value: 24000, stage: "proposta", owner: "Bruno R.", ownerInitials: "BR", daysInStage: 4, aiScore: 71, tags: ["Pro"] },
  { id: "d3", title: "Trial → Conversão", company: "Lumière Studio", contact: "Sofia Lemos", value: 9800, stage: "qualificacao", owner: "Anna D.", ownerInitials: "AD", daysInStage: 1, aiScore: 64, tags: ["SMB"] },
  { id: "d4", title: "Migração de planilhas", company: "Vanguard Co.", contact: "Ricardo Alves", value: 15600, stage: "contato", owner: "Carla T.", ownerInitials: "CT", daysInStage: 6, aiScore: 42, tags: ["Cold"] },
  { id: "d5", title: "Demo solicitada via site", company: "BrightWave", contact: "Helena Cruz", value: 0, stage: "novo", owner: "Bruno R.", ownerInitials: "BR", daysInStage: 0, aiScore: 55, tags: ["Inbound"] },
  { id: "d6", title: "Upsell módulo IA", company: "Polaris Tech", contact: "Diego Martins", value: 32000, stage: "negociacao", owner: "Anna D.", ownerInitials: "AD", daysInStage: 3, aiScore: 92, tags: ["Hot", "Upsell"] },
  { id: "d7", title: "Renovação anual", company: "Helix Health", contact: "Júlia Mendes", value: 48000, stage: "fechado", owner: "Carla T.", ownerInitials: "CT", daysInStage: 0, aiScore: 100, tags: ["Won"] },
  { id: "d8", title: "Plano Starter 5 seats", company: "Kite Studio", contact: "Pedro Lima", value: 4800, stage: "novo", owner: "Bruno R.", ownerInitials: "BR", daysInStage: 0, aiScore: 38, tags: ["Inbound"] },
  { id: "d9", title: "Pacote treinamento", company: "OmniLogic", contact: "Andrea Reis", value: 12000, stage: "proposta", owner: "Anna D.", ownerInitials: "AD", daysInStage: 7, aiScore: 58, tags: ["Cooling"] },
  { id: "d10", title: "Integração ERP", company: "Stratos Group", contact: "Luís Carvalho", value: 67000, stage: "qualificacao", owner: "Carla T.", ownerInitials: "CT", daysInStage: 2, aiScore: 74, tags: ["Enterprise"] },
  { id: "d11", title: "Plano team", company: "Pixel Forge", contact: "Bianca Nunes", value: 8400, stage: "contato", owner: "Bruno R.", ownerInitials: "BR", daysInStage: 1, aiScore: 60, tags: ["SMB"] },
  { id: "d12", title: "POC 30 dias", company: "Quanta Labs", contact: "Felipe Rocha", value: 0, stage: "perdido", owner: "Anna D.", ownerInitials: "AD", daysInStage: 0, aiScore: 12, tags: ["Lost"] },
];

export const REVENUE_SERIES = [
  { month: "Mai", previsto: 120, fechado: 92 },
  { month: "Jun", previsto: 145, fechado: 118 },
  { month: "Jul", previsto: 168, fechado: 132 },
  { month: "Ago", previsto: 182, fechado: 154 },
  { month: "Set", previsto: 210, fechado: 178 },
  { month: "Out", previsto: 248, fechado: 214 },
  { month: "Nov", previsto: 285, fechado: 232 },
];

export const ACTIVITIES = [
  { id: "a1", who: "Anna D.", initials: "AD", action: "fechou negócio com", target: "Helix Health", value: "R$ 48.000", time: "há 12 min", type: "won" as const },
  { id: "a2", who: "Bruno R.", initials: "BR", action: "moveu", target: "Northwind Ltda", value: "→ Proposta", time: "há 38 min", type: "move" as const },
  { id: "a3", who: "IA", initials: "AI", action: "marcou como esfriando", target: "OmniLogic", value: "follow-up atrasado", time: "há 1h", type: "ai" as const },
  { id: "a4", who: "Carla T.", initials: "CT", action: "criou tarefa para", target: "Stratos Group", value: "Enviar proposta", time: "há 2h", type: "task" as const },
  { id: "a5", who: "Anna D.", initials: "AD", action: "registrou ligação com", target: "Acme Corp", value: "12 min", time: "há 3h", type: "call" as const },
];

export const AI_INSIGHTS = [
  { id: "i1", severity: "high" as const, title: "Polaris Tech tem 92% de chance de fechar", body: "Score subiu 18pts nas últimas 48h. Sugestão: enviar proposta hoje.", action: "Ver lead" },
  { id: "i2", severity: "warn" as const, title: "OmniLogic está esfriando", body: "Sem interação há 7 dias. Última resposta foi positiva.", action: "Follow-up" },
  { id: "i3", severity: "info" as const, title: "Segunda-feira é seu melhor dia", body: "Você fecha 38% mais negócios às segundas. Concentre ligações.", action: "Ver relatório" },
];

export type Lead = {
  id: string;
  name: string;
  initials: string;
  company: string;
  email: string;
  whatsapp: string;
  source: string;
  status: "Novo" | "Em contato" | "Qualificado" | "Convertido";
  owner: string;
  createdAt: string;
};

export const LEADS: Lead[] = [
  { id: "l1", name: "Marina Souza", initials: "MS", company: "Acme Corp", email: "marina@acme.com", whatsapp: "+55 11 98765-4321", source: "Site", status: "Qualificado", owner: "Anna D.", createdAt: "18/05" },
  { id: "l2", name: "Carlos Pereira", initials: "CP", company: "Northwind", email: "carlos@nw.com", whatsapp: "+55 21 99812-3344", source: "Indicação", status: "Em contato", owner: "Bruno R.", createdAt: "16/05" },
  { id: "l3", name: "Sofia Lemos", initials: "SL", company: "Lumière", email: "sofia@lumiere.io", whatsapp: "+55 11 98123-9090", source: "LinkedIn", status: "Novo", owner: "Anna D.", createdAt: "16/05" },
  { id: "l4", name: "Ricardo Alves", initials: "RA", company: "Vanguard", email: "ricardo@vg.com", whatsapp: "+55 31 99001-2233", source: "Anúncio", status: "Em contato", owner: "Carla T.", createdAt: "12/05" },
  { id: "l5", name: "Helena Cruz", initials: "HC", company: "BrightWave", email: "helena@bw.io", whatsapp: "+55 11 99887-1212", source: "Site", status: "Novo", owner: "Bruno R.", createdAt: "11/05" },
  { id: "l6", name: "Diego Martins", initials: "DM", company: "Polaris Tech", email: "diego@polaris.tech", whatsapp: "+55 11 98000-1100", source: "Evento", status: "Qualificado", owner: "Anna D.", createdAt: "08/05" },
  { id: "l7", name: "Júlia Mendes", initials: "JM", company: "Helix Health", email: "julia@helix.com", whatsapp: "+55 11 98711-2200", source: "Indicação", status: "Convertido", owner: "Carla T.", createdAt: "02/05" },
];

export const TASKS = [
  { id: "t1", title: "Ligar para Acme Corp", due: "Hoje · 14:00", priority: "Alta" as const, owner: "AD", done: false },
  { id: "t2", title: "Enviar proposta — Northwind", due: "Hoje · 17:30", priority: "Alta" as const, owner: "BR", done: false },
  { id: "t3", title: "Follow-up Lumière Studio", due: "Amanhã · 10:00", priority: "Média" as const, owner: "AD", done: false },
  { id: "t4", title: "Reunião kickoff Helix", due: "Sex · 09:00", priority: "Média" as const, owner: "CT", done: false },
  { id: "t5", title: "Revisar contrato Polaris", due: "Hoje · 18:00", priority: "Alta" as const, owner: "AD", done: true },
];

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });