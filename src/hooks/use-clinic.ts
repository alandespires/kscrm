import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getActiveTenantId, requireTenantId } from "@/contexts/tenant-context";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

// ===================== TYPES =====================
export type Patient = {
  id: string;
  tenant_id: string;
  nome: string;
  cpf: string | null;
  data_nascimento: string | null;
  genero: string | null;
  email: string | null;
  whatsapp: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  convenio: string | null;
  numero_convenio: string | null;
  profissao: string | null;
  estado_civil: string | null;
  responsavel_nome: string | null;
  alergias: string | null;
  medicamentos_uso: string | null;
  doencas_preexistentes: string | null;
  observacoes: string | null;
  status: "ativo" | "inativo" | "bloqueado";
  primeiro_atendimento_em: string | null;
  ultimo_atendimento_em: string | null;
  origem: string | null;
  tags: string[] | null;
  created_at: string;
};

export type ClinicalRecord = {
  id: string;
  tenant_id: string;
  patient_id: string;
  professional_id: string | null;
  tipo: "anamnese" | "evolucao" | "observacao" | "retorno" | "procedimento";
  titulo: string | null;
  queixa_principal: string | null;
  conteudo: string;
  dente: string | null;
  procedimento: string | null;
  created_by: string;
  created_at: string;
};

export type DentalProfessional = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  nome: string;
  especialidade: string | null;
  cro: string | null;
  cor: string;
  ativo: boolean;
};

export type Appointment = {
  id: string;
  tenant_id: string;
  patient_id: string;
  professional_id: string | null;
  inicio: string;
  fim: string;
  duracao_min: number;
  status: "agendado" | "confirmado" | "em_atendimento" | "realizado" | "faltou" | "cancelado" | "remarcado";
  procedimento: string | null;
  valor: number | null;
  convenio: string | null;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  confirmado_em: string | null;
  realizado_em: string | null;
  cor: string | null;
};

// ===================== PATIENTS =====================
export function usePatients(search?: string) {
  return useQuery({
    queryKey: ["patients", getActiveTenantId(), search ?? ""],
    enabled: !!getActiveTenantId(),
    queryFn: async () => {
      const tenantId = requireTenantId();
      let q = supabase.from("patients").select("*").eq("tenant_id", tenantId).order("nome");
      if (search && search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`nome.ilike.${s},cpf.ilike.${s},whatsapp.ilike.${s},email.ilike.${s}`);
      }
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as Patient[];
    },
  });
}

export function usePatient(id: string | null) {
  return useQuery({
    queryKey: ["patient", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Patient | null;
    },
  });
}

export function useUpsertPatient() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<Patient> & { id?: string; nome: string }) => {
      const tenantId = requireTenantId();
      if (input.id) {
        const { data, error } = await supabase
          .from("patients")
          .update({ ...input })
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { id: _omit, ...rest } = input;
      const { data, error } = await supabase
        .from("patients")
        .insert({ ...rest, tenant_id: tenantId, created_by: user!.id, nome: input.nome } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient"] });
      toast.success("Paciente salvo");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar paciente"),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente removido");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });
}

// ===================== CLINICAL RECORDS =====================
export function useClinicalRecords(patientId: string | null) {
  return useQuery({
    queryKey: ["clinical-records", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClinicalRecord[];
    },
  });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<Partial<ClinicalRecord>, "id" | "created_at"> & { patient_id: string; conteudo: string }) => {
      const tenantId = requireTenantId();
      const { data, error } = await supabase
        .from("clinical_records")
        .insert({
          ...input,
          tenant_id: tenantId,
          created_by: user!.id,
          tipo: input.tipo ?? "evolucao",
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["clinical-records", vars.patient_id] });
      toast.success("Registro adicionado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar registro"),
  });
}

// ===================== PROFESSIONALS =====================
export function useProfessionals() {
  return useQuery({
    queryKey: ["dental-professionals", getActiveTenantId()],
    enabled: !!getActiveTenantId(),
    queryFn: async () => {
      const tenantId = requireTenantId();
      const { data, error } = await supabase
        .from("dental_professionals")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as DentalProfessional[];
    },
  });
}

export function useUpsertProfessional() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<DentalProfessional> & { nome: string; id?: string }) => {
      const tenantId = requireTenantId();
      if (input.id) {
        const { data, error } = await supabase
          .from("dental_professionals")
          .update(input)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { id: _o, ...rest } = input;
      const { data, error } = await supabase
        .from("dental_professionals")
        .insert({ ...rest, tenant_id: tenantId, created_by: user!.id, nome: input.nome } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dental-professionals"] });
      toast.success("Profissional salvo");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });
}

// ===================== APPOINTMENTS =====================
export function useAppointments(rangeStart: Date, rangeEnd: Date, professionalId?: string | null) {
  return useQuery({
    queryKey: ["appointments", getActiveTenantId(), rangeStart.toISOString(), rangeEnd.toISOString(), professionalId ?? "all"],
    enabled: !!getActiveTenantId(),
    queryFn: async () => {
      const tenantId = requireTenantId();
      let q = supabase
        .from("appointments")
        .select("*, patient:patients(id,nome,whatsapp), professional:dental_professionals(id,nome,cor)")
        .eq("tenant_id", tenantId)
        .gte("inicio", rangeStart.toISOString())
        .lte("inicio", rangeEnd.toISOString())
        .order("inicio");
      if (professionalId) q = q.eq("professional_id", professionalId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useUpsertAppointment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<Appointment> & { id?: string; patient_id: string; inicio: string; fim: string }) => {
      const tenantId = requireTenantId();
      if (input.id) {
        const { id, ...rest } = input;
        const { data, error } = await supabase.from("appointments").update(rest).eq("id", id!).select().single();
        if (error) throw error;
        return data;
      }
      const { id: _o, ...rest } = input;
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...rest, tenant_id: tenantId, created_by: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["clinic-dashboard"] });
      toast.success("Agendamento salvo");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar agendamento"),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, motivo }: { id: string; status: Appointment["status"]; motivo?: string }) => {
      const patch: any = { status };
      if (status === "confirmado") patch.confirmado_em = new Date().toISOString();
      if (status === "realizado") patch.realizado_em = new Date().toISOString();
      if (status === "cancelado" && motivo) patch.motivo_cancelamento = motivo;
      const { error } = await supabase.from("appointments").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["clinic-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar status"),
  });
}

// ===================== DASHBOARD =====================
export function useClinicDashboard() {
  return useQuery({
    queryKey: ["clinic-dashboard", getActiveTenantId()],
    enabled: !!getActiveTenantId(),
    queryFn: async () => {
      const tenantId = requireTenantId();
      const today = new Date();
      const startDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      const startMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString();

      const [todayAppts, monthAppts, patientsCount, profsCount] = await Promise.all([
        supabase.from("appointments").select("id,status,valor,inicio,patient:patients(nome)", { count: "exact" })
          .eq("tenant_id", tenantId).gte("inicio", startDay).lt("inicio", endDay).order("inicio"),
        supabase.from("appointments").select("status,valor")
          .eq("tenant_id", tenantId).gte("inicio", startMonth).lt("inicio", endMonth),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "ativo"),
        supabase.from("dental_professionals").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("ativo", true),
      ]);

      const monthData = monthAppts.data ?? [];
      const realizados = monthData.filter((a) => a.status === "realizado");
      const faltas = monthData.filter((a) => a.status === "faltou").length;
      const total = monthData.length || 1;
      const faturamentoMes = realizados.reduce((s, a) => s + Number(a.valor ?? 0), 0);
      const ticketMedio = realizados.length ? faturamentoMes / realizados.length : 0;

      return {
        hojeAgendamentos: todayAppts.data ?? [],
        hojeCount: todayAppts.count ?? 0,
        mesFaturamento: faturamentoMes,
        mesRealizados: realizados.length,
        mesFaltas: faltas,
        taxaFaltas: (faltas / total) * 100,
        ticketMedio,
        pacientesAtivos: patientsCount.count ?? 0,
        profissionaisAtivos: profsCount.count ?? 0,
      };
    },
  });
}
