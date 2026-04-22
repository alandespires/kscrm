// IA Coach: analisa o estado do usuário e devolve sugestões priorizadas.
// Usa Lovable AI Gateway (sem API key do usuário).
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

    // Identifica o usuário pelo JWT
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: SERVICE_KEY },
    });
    if (!userRes.ok) return jsonResp({ error: "unauthorized" }, 401);
    const user = await userRes.json();
    const userId = user.id;

    // Coleta contexto: leads + tarefas em aberto + atividades recentes
    const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

    const [leadsR, tasksR, activitiesR] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/leads?or=(owner_id.eq.${userId},created_by.eq.${userId})&order=ai_score.desc.nullslast&limit=30`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/tasks?status=neq.concluida&assignee_id=eq.${userId}&order=prazo.asc.nullslast&limit=20`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/activities?user_id=eq.${userId}&order=created_at.desc&limit=10`, { headers }),
    ]);
    const leads = await leadsR.json();
    const tasks = await tasksR.json();
    const activities = await activitiesR.json();

    const now = new Date();
    const overdueTasks = (tasks ?? []).filter((t: any) => t.prazo && new Date(t.prazo) < now);
    const hotLeads = (leads ?? []).filter((l: any) => (l.ai_score ?? 0) >= 70 && !["fechado", "perdido"].includes(l.status));
    const stale = (leads ?? []).filter((l: any) => {
      const updated = new Date(l.updated_at).getTime();
      return !["fechado", "perdido"].includes(l.status) && Date.now() - updated > 7 * 864e5;
    });

    const context = {
      total_leads: leads?.length ?? 0,
      tarefas_em_aberto: tasks?.length ?? 0,
      tarefas_atrasadas: overdueTasks.length,
      leads_quentes: hotLeads.slice(0, 5).map((l: any) => ({
        nome: l.nome, empresa: l.empresa, score: l.ai_score, sugestao: l.ai_sugestao, status: l.status,
      })),
      leads_parados_7d: stale.slice(0, 5).map((l: any) => ({ nome: l.nome, empresa: l.empresa, dias: Math.floor((Date.now() - new Date(l.updated_at).getTime()) / 864e5) })),
      atividades_recentes: activities.length,
    };

    // Chama Lovable AI Gateway
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é o IA Coach, um treinador comercial brasileiro. Analise o panorama do vendedor e devolva 3 a 5 ações de alto impacto em JSON. Seja direto, motivacional e prático. Use português do Brasil. Cada ação deve ter: titulo (curto, ação no infinitivo), descricao (1-2 frases explicando), prioridade ("urgente"|"alta"|"media"|"baixa"), foco ("leads_quentes"|"tarefas"|"prospeccao"|"reativacao"|"performance").`,
          },
          { role: "user", content: `Panorama do vendedor:\n${JSON.stringify(context, null, 2)}\n\nDevolva apenas JSON válido com a forma { "resumo": "uma frase de abertura motivacional", "acoes": [...] }.` },
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
    catch { parsed = { resumo: aiData.choices[0].message.content, acoes: [] }; }

    return jsonResp({ ...parsed, context });
  } catch (err) {
    console.error("ai-coach error:", err);
    return jsonResp({ error: "internal_error" }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
