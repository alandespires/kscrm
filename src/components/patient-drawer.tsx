import { useEffect, useState } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { useDeletePatient, type Patient } from "@/hooks/use-clinic";

type FormData = Partial<Patient> & { nome: string };

export function PatientDrawer({ patient, onClose, onSave }: {
  patient: Patient | null;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
}) {
  const del = useDeletePatient();
  const [data, setData] = useState<FormData>(patient ?? { nome: "", status: "ativo" } as any);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setData(patient ?? { nome: "", status: "ativo" } as any); }, [patient]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((p) => ({ ...p, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(data); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-surface-1 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{patient ? "Editar paciente" : "Novo paciente"}</h2>
            <p className="text-xs text-muted-foreground">Dados pessoais, contato e histórico clínico básico</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Section title="Identificação">
            <Grid>
              <Field label="Nome completo" full><input required value={data.nome ?? ""} onChange={(e) => update("nome", e.target.value)} className="input" /></Field>
              <Field label="CPF"><input value={data.cpf ?? ""} onChange={(e) => update("cpf", e.target.value)} className="input" /></Field>
              <Field label="Data de nascimento"><input type="date" value={data.data_nascimento ?? ""} onChange={(e) => update("data_nascimento", e.target.value || null)} className="input" /></Field>
              <Field label="Gênero">
                <select value={data.genero ?? ""} onChange={(e) => update("genero", e.target.value || null)} className="input">
                  <option value="">—</option><option>Feminino</option><option>Masculino</option><option>Outro</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={data.status ?? "ativo"} onChange={(e) => update("status", e.target.value as any)} className="input">
                  <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option>
                </select>
              </Field>
            </Grid>
          </Section>

          <Section title="Contato">
            <Grid>
              <Field label="WhatsApp"><input value={data.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value)} className="input" /></Field>
              <Field label="Telefone"><input value={data.telefone ?? ""} onChange={(e) => update("telefone", e.target.value)} className="input" /></Field>
              <Field label="E-mail" full><input type="email" value={data.email ?? ""} onChange={(e) => update("email", e.target.value)} className="input" /></Field>
              <Field label="Endereço" full><input value={data.endereco ?? ""} onChange={(e) => update("endereco", e.target.value)} className="input" /></Field>
              <Field label="Cidade"><input value={data.cidade ?? ""} onChange={(e) => update("cidade", e.target.value)} className="input" /></Field>
              <Field label="UF"><input value={data.estado ?? ""} maxLength={2} onChange={(e) => update("estado", e.target.value.toUpperCase())} className="input" /></Field>
            </Grid>
          </Section>

          <Section title="Convênio">
            <Grid>
              <Field label="Convênio"><input value={data.convenio ?? ""} onChange={(e) => update("convenio", e.target.value)} placeholder="Particular / nome do convênio" className="input" /></Field>
              <Field label="Nº carteirinha"><input value={data.numero_convenio ?? ""} onChange={(e) => update("numero_convenio", e.target.value)} className="input" /></Field>
            </Grid>
          </Section>

          <Section title="Histórico clínico">
            <Grid>
              <Field label="Alergias" full><textarea rows={2} value={data.alergias ?? ""} onChange={(e) => update("alergias", e.target.value)} className="input resize-none" /></Field>
              <Field label="Medicamentos em uso" full><textarea rows={2} value={data.medicamentos_uso ?? ""} onChange={(e) => update("medicamentos_uso", e.target.value)} className="input resize-none" /></Field>
              <Field label="Doenças pré-existentes" full><textarea rows={2} value={data.doencas_preexistentes ?? ""} onChange={(e) => update("doencas_preexistentes", e.target.value)} className="input resize-none" /></Field>
              <Field label="Observações gerais" full><textarea rows={3} value={data.observacoes ?? ""} onChange={(e) => update("observacoes", e.target.value)} className="input resize-none" /></Field>
            </Grid>
          </Section>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-2/50 px-6 py-4">
          {patient ? (
            <button type="button" onClick={async () => { if (confirm(`Remover ${patient.nome}?`)) { await del.mutateAsync(patient.id); onClose(); } }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-sm font-medium text-destructive hover:bg-destructive/15">
              <Trash2 className="h-4 w-4" /> Remover
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border bg-surface-2 px-4 text-sm font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-50">
              <Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
        <style>{`.input{height:36px;width:100%;border-radius:8px;border:1px solid hsl(var(--border));background:hsl(var(--surface-2));padding:0 10px;font-size:13px;color:hsl(var(--foreground));}.input:focus{outline:none;border-color:hsl(var(--primary));}textarea.input{height:auto;padding:8px 10px;}`}</style>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
