import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { Users, Shield, Plug, Palette } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — KS CRM" }] }),
  component: ConfigPage,
});

const SECTIONS = [
  { icon: Users, title: "Equipe e usuários", desc: "Gerencie membros, papéis e acessos da equipe comercial" },
  { icon: Shield, title: "Permissões", desc: "Controle granular sobre módulos, leads e relatórios" },
  { icon: Plug, title: "Integrações", desc: "WhatsApp, e-mail, calendário e ferramentas externas" },
  { icon: Palette, title: "Personalização", desc: "Estágios do pipeline, campos customizados e tags" },
];

function ConfigPage() {
  return (
    <AppShell title="Configurações" subtitle="Personalize o CRM para o seu time">
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <button key={s.title} className="group flex items-start gap-4 rounded-2xl border border-border bg-surface-2 p-5 text-left shadow-card transition hover:border-primary/40 hover:shadow-elevated">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <StatusPill tone="neutral">Em breve</StatusPill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </AppShell>
  );
}