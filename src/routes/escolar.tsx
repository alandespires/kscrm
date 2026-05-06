import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/escolar")({
  component: EscolarLayout,
});

function EscolarLayout() {
  return (
    <AppShell
      title="KS Escolar"
      subtitle="Sistema pedagógico completo — turmas, notas, frequência e portal do aluno."
      action={
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <GraduationCap className="h-3.5 w-3.5" />
          Módulo Educacional
        </div>
      }
    >
      <div className="relative">
        {/* Decoração de fundo do módulo — ambient gradient */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-primary/[0.07] blur-3xl" />
          <div className="absolute top-1/3 left-[-15%] h-[380px] w-[380px] rounded-full bg-[oklch(0.62_0.18_280)]/[0.06] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Container do módulo com borda/acento sutil */}
        <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-transparent to-[oklch(0.62_0.18_280)]/[0.04] p-1 shadow-card">
          <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="rounded-[1.4rem] bg-background/40 p-4 backdrop-blur-sm md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
