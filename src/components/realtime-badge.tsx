import { Radio } from "lucide-react";

/** Indicador visual de página com sincronização realtime ativa. */
export function RealtimeBadge({ label = "Ao vivo" }: { label?: string }) {
  return (
    <span
      title="Atualizações em tempo real ativadas"
      className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <Radio className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
