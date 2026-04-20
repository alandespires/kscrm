import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, useDraggable, useDroppable,
} from "@dnd-kit/core";
import { AppShell, PrimaryButton } from "@/components/app-shell";
import { DEALS, STAGES, formatBRL, type Deal, type DealStage } from "@/lib/mock-data";
import { Plus, Filter, Sparkles, Clock, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline — Nexus CRM" }] }),
  component: PipelinePage,
});

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 80 ? "text-success bg-success/15" : score >= 50 ? "text-warning bg-warning/15" : "text-muted-foreground bg-surface-3";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${tone}`}>
      <Sparkles className="h-2.5 w-2.5" /> {score}
    </span>
  );
}

function DealCard({ deal, dragging }: { deal: Deal; dragging?: boolean }) {
  return (
    <div className={[
      "group cursor-grab rounded-xl border border-border bg-surface-2 p-3.5 shadow-card transition active:cursor-grabbing",
      dragging ? "opacity-40" : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated",
    ].join(" ")}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug">{deal.title}</h4>
        <ScoreBadge score={deal.aiScore} />
      </div>
      <p className="text-xs text-muted-foreground">{deal.company} · {deal.contact}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {deal.value > 0 ? formatBRL(deal.value) : "—"}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />{deal.daysInStage}d
          </span>
          <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-primary/80 to-[oklch(0.55_0.16_35)] text-[10px] font-bold text-primary-foreground">
            {deal.ownerInitials}
          </div>
        </div>
      </div>
      {deal.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {deal.tags.map((t) => (
            <span key={t} className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableDeal({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <DealCard deal={deal} dragging={isDragging} />
    </div>
  );
}

function Column({ stage, deals }: { stage: typeof STAGES[number]; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((a, d) => a + d.value, 0);
  return (
    <div
      ref={setNodeRef}
      className={[
        "flex w-72 shrink-0 flex-col rounded-2xl border bg-surface-1/60 transition",
        isOver ? "border-primary/50 bg-primary/5" : "border-border",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: stage.color, boxShadow: `0 0 8px ${stage.color}` }} />
          <span className="text-sm font-semibold">{stage.label}</span>
          <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums">{deals.length}</span>
        </div>
        <button className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-surface-3 hover:text-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="border-b border-border px-3 py-2 text-[11px] text-muted-foreground tabular-nums">{formatBRL(total)}</div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2.5" style={{ minHeight: 200 }}>
        {deals.map((d) => <DraggableDeal key={d.id} deal={d} />)}
      </div>
    </div>
  );
}

function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(DEALS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id as DealStage | undefined;
    if (!overId) return;
    setDeals((prev) => prev.map((d) => d.id === e.active.id ? { ...d, stage: overId, daysInStage: 0 } : d));
  }

  const activeDeal = deals.find((d) => d.id === activeId);

  return (
    <AppShell
      title="Pipeline"
      subtitle="Arraste negócios entre etapas. A IA recalcula scores automaticamente."
      action={
        <div className="flex gap-2">
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 text-sm text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <PrimaryButton icon={Plus}>Novo negócio</PrimaryButton>
        </div>
      }
    >
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="-mx-5 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8">
          <div className="flex gap-4">
            {STAGES.map((s) => (
              <Column key={s.id} stage={s} deals={deals.filter((d) => d.stage === s.id)} />
            ))}
          </div>
        </div>
        <DragOverlay>{activeDeal ? <div className="w-72"><DealCard deal={activeDeal} /></div> : null}</DragOverlay>
      </DndContext>
    </AppShell>
  );
}