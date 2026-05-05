import { createFileRoute } from "@tanstack/react-router";
import { Cog } from "lucide-react";

export const Route = createFileRoute("/escolar/configuracoes")({ component: Page });

function Page() {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-8 shadow-card">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary"><Cog className="h-6 w-6" /></div>
        <h2 className="mt-4 text-lg font-semibold">Configurações Escolares</h2>
        <p className="mt-2 text-sm text-muted-foreground">Personalize períodos letivos, regras de aprovação, escala de notas e calendário acadêmico. Em breve.</p>
      </div>
    </div>
  );
}
