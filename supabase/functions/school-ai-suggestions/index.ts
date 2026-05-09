// School AI: sugestões pedagógicas para uma turma específica.
// Recebe um contexto da turma e devolve análise de risco + recomendações via Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: SERVICE_KEY },
    });
    if (!userRes.ok) return jsonResp({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { class_id, faltaPctLimite = 25, mediaMinima = 6 } = body as { class_id?: string; faltaPctLimite?: number; mediaMinima?: number };
    if (!class_id) return jsonResp({ error: "missing_class_id" }, 400);

    const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

    // Coleta contexto da turma
    const [klassR, enrollR, attR, gradesR] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/school_classes?id=eq.${class_id}&select=id,nome,horario,sala,course:school_courses(nome),teacher:school_teachers(nome)`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/school_enrollments?class_id=eq.${class_id}&select=student_id,student:school_students(id,nome)`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/school_attendance?select=student_id,status,lesson:school_lessons!inner(class_id)&lesson.class_id=eq.${class_id}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/school_grades?select=student_id,nota,assessment:school_assessments!inner(class_id,nota_maxima,titulo)&assessment.class_id=eq.${class_id}`, { headers }),
    ]);
    const klass = (await klassR.json())?.[0];
    const enrollments = await enrollR.json();
    const attendance = await attR.json();
    const grades = await gradesR.json();

    // Computa risco por aluno
    const byStudent = new Map<string, { nome: string; faltas: number; total: number; notas: number[] }>();
    for (const e of enrollments ?? []) {
      byStudent.set(e.student_id, { nome: e.student?.nome ?? "—", faltas: 0, total: 0, notas: [] });
    }
    for (const a of attendance ?? []) {
      const s = byStudent.get(a.student_id); if (!s) continue;
      s.total++; if (a.status === "falta") s.faltas++;
    }
    for (const g of grades ?? []) {
      const s = byStudent.get(g.student_id); if (!s || g.nota == null) continue;
      const max = Number(g.assessment?.nota_maxima ?? 10);
      s.notas.push((Number(g.nota) / max) * 10);
    }
    const limite = faltaPctLimite / 100;
    const resumoAlunos = [...byStudent.entries()].map(([id, v]) => ({
      id, nome: v.nome,
      faltas_pct: v.total ? Math.round((v.faltas / v.total) * 100) : 0,
      aulas_registradas: v.total,
      media: v.notas.length ? +(v.notas.reduce((a, b) => a + b, 0) / v.notas.length).toFixed(1) : null,
      risco: (v.total >= 3 && v.faltas / v.total >= limite) || (v.notas.length && (v.notas.reduce((a, b) => a + b, 0) / v.notas.length) < mediaMinima),
    })).sort((a, b) => Number(b.risco) - Number(a.risco) || b.faltas_pct - a.faltas_pct);

    const context = {
      turma: { nome: klass?.nome, curso: klass?.course?.nome, professor: klass?.teacher?.nome, horario: klass?.horario, sala: klass?.sala },
      total_alunos: enrollments?.length ?? 0,
      em_risco: resumoAlunos.filter((s) => s.risco).length,
      alunos: resumoAlunos.slice(0, 20),
      regras: { faltaPctLimite, mediaMinima },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é uma coordenadora pedagógica brasileira especialista em ensino. Analise o panorama da turma e devolva recomendações concretas. Use português do Brasil. JSON puro com a forma:
{
  "resumo": "diagnóstico curto (1-2 frases) sobre a saúde da turma",
  "alunos_risco": [{ "nome": string, "motivo": string, "acao": string }],
  "recomendacoes": [{ "titulo": string, "descricao": string, "prioridade": "urgente"|"alta"|"media"|"baixa" }]
}
Limite a 5 alunos em risco e 4 recomendações. Seja específica e prática.`,
          },
          { role: "user", content: `Panorama da turma:\n${JSON.stringify(context, null, 2)}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return jsonResp({ error: "rate_limited" }, 429);
    if (aiRes.status === 402) return jsonResp({ error: "credits_exhausted" }, 402);
    if (!aiRes.ok) return jsonResp({ error: "ai_failed", detail: await aiRes.text() }, 500);

    const aiData = await aiRes.json();
    let parsed;
    try { parsed = JSON.parse(aiData.choices[0].message.content); }
    catch { parsed = { resumo: aiData.choices[0].message.content, alunos_risco: [], recomendacoes: [] }; }

    return jsonResp({ ...parsed, context });
  } catch (err) {
    console.error("school-ai-suggestions error:", err);
    return jsonResp({ error: "internal_error" }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
