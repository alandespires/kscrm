import { useState, type FormEvent } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { useCreateLead, type LeadStatus } from "@/hooks/use-leads";

const STATUS_OPTIONS: { v: LeadStatus; l: string }[] = [
  { v: "novo", l: "Novo Lead" },
  { v: "contato_inicial", l: "Contato Inicial" },
  { v: "qualificacao", l: "Qualificação" },
  { v: "proposta", l: "Proposta" },
  { v: "negociacao", l: "Negociação" },
];

export function LeadFormDialog({ defaultStatus = "novo", trigger }: { defaultStatus?: LeadStatus; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [origem, setOrigem] = useState("Site");
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState<LeadStatus>(defaultStatus);
  const [obs, setObs] = useState("");
  const create = useCreateLead();

  function reset() {
    setNome(""); setEmpresa(""); setEmail(""); setWhatsapp("");
    setOrigem("Site"); setValor(""); setStatus(defaultStatus); setObs("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      nome, empresa: empresa || undefined, email: email || undefined,
      whatsapp: whatsapp || undefined, origem: origem || undefined,
      observacoes: obs || undefined, status,
      valor_estimado: valor ? Number(valor) : undefined,
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
            <Plus className="h-4 w-4" /> Novo lead
          </button>
        )}
      </span>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-border bg-surface-2 shadow-elevated">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h3 className="text-lg font-semibold">Novo lead</h3>
                <p className="text-xs text-muted-foreground">Adicione ao funil em segundos.</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-3 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 p-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome *"><input required value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} /></Field>
                <Field label="Empresa"><input value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={inputCls} /></Field>
                <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
                <Field label="WhatsApp"><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} placeholder="+55 11 9..." /></Field>
                <Field label="Origem">
                  <select value={origem} onChange={(e) => setOrigem(e.target.value)} className={inputCls}>
                    <option>Site</option><option>LinkedIn</option><option>Indicação</option>
                    <option>Anúncio</option><option>Evento</option><option>Outro</option>
                  </select>
                </Field>
                <Field label="Valor estimado (R$)">
                  <input type="number" min="0" step="100" value={valor} onChange={(e) => setValor(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Etapa" full>
                  <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </Field>
                <Field label="Observações" full>
                  <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} className={inputCls + " resize-none"} />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border border-border bg-surface-1 px-4 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                <button type="submit" disabled={create.isPending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60">
                  {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls = "h-10 w-full rounded-lg border border-border bg-surface-1 px-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={["block", full ? "col-span-2" : ""].join(" ")}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}