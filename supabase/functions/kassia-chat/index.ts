// KassIA Chat: assistente conversacional com contexto do CRM.
// Usa Lovable AI Gateway (sem API key do usuário) e suporta streaming.
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
    const user = await userRes.json();
    const userId = user.id;

    const { messages = [] } = await req.json().catch(() => ({ messages: [] }));
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResp({ error: "messages required" }, 400);
    }

    const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

    // Coleta contexto amplo do CRM para a KassIA responder dúvidas e gerar relatórios
    const [leadsR, tasksR, clientsR, entriesR, expensesR, subsR, commR] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/leads?or=(owner_id.eq.${userId},created_by.eq.${userId})&order=updated_at.desc&limit=50`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/tasks?status=neq.concluida&assignee_id=eq.${userId}&order=prazo.asc.nullslast&limit=30`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/clients?order=updated_at.desc&limit=30`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/financial_entries?order=created_at.desc&limit=80`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/financial_expenses?order=created_at.desc&limit=50`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/financial_subscriptions?order=created_at.desc&limit=50`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/financial_commissions?order=created_at.desc&limit=50`, { headers }),
    ]);
    const [leads, tasks, clients, entries, expenses, subs, commissions] = await Promise.all([
      leadsR.json(), tasksR.json(), clientsR.json(), entriesR.json(), expensesR.json(), subsR.json(), commR.json(),
    ]);

    const now = new Date();
    const sum = (arr: any[], key: string) => arr.reduce((a, b) => a + Number(b[key] ?? 0), 0);
    const monthEntries = (entries ?? []).filter((e: any) => {
      const d = new Date(e.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthExpenses = (expenses ?? []).filter((e: any) => {
      const d = new Date(e.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const overdueEntries = (entries ?? []).filter((e: any) => e.status === "atrasado" || (e.vencimento && new Date(e.vencimento) < now && e.status === "pendente"));
    const activeSubs = (subs ?? []).filter((s: any) => s.status === "ativo");
    const mrr = sum(activeSubs, "valor_mensal");

    const ctx = {
      data_atual: now.toISOString().slice(0, 10),
      leads: {
        total: leads?.length ?? 0,
        quentes: (leads ?? []).filter((l: any) => (l.ai_score ?? 0) >= 70 && !["fechado", "perdido"].includes(l.status)).length,
        por_status: agrupar(leads ?? [], "status"),
        amostra: (leads ?? []).slice(0, 10).map((l: any) => ({ nome: l.nome, empresa: l.empresa, status: l.status, score: l.ai_score, valor: l.valor_estimado })),
      },
      tarefas: {
        em_aberto: tasks?.length ?? 0,
        atrasadas: (tasks ?? []).filter((t: any) => t.prazo && new Date(t.prazo) < now).length,
      },
      clientes: { total: clients?.length ?? 0 },
      financeiro: {
        receita_mes: sum(monthEntries.filter((e: any) => e.status === "pago"), "valor_pago"),
        previsto_mes: sum(monthEntries, "valor"),
        despesas_mes: sum(monthExpenses, "valor"),
        inadimplencia: sum(overdueEntries, "valor"),
        mrr,
        assinaturas_ativas: activeSubs.length,
        comissoes_pendentes: sum((commissions ?? []).filter((c: any) => c.status === "pendente"), "valor"),
      },
    };

    const systemPrompt = `Você é a KassIA, assistente de IA do KS CRM. Fala português do Brasil de forma direta, profissional e calorosa.

Suas capacidades:
- Responder dúvidas sobre o CRM (leads, pipeline, clientes, tarefas, automação, financeiro).
- Gerar relatórios sob demanda usando os dados reais abaixo (faturamento, inadimplência, leads quentes, comissões, etc).
- Dar recomendações estratégicas baseadas no contexto.
- Explicar conceitos de vendas, gestão e finanças quando perguntado.

Regras:
- Use markdown (negrito, listas, tabelas) para clareza.
- Quando gerar números financeiros, formate em R$ com separador de milhar.
- Seja concisa: use listas e seções curtas. Não invente dados — se não souber, diga.
- Quando pedirem relatório, estruture com título, KPIs principais e insights.

Contexto atual do usuário (dados reais do CRM):
${JSON.stringify(ctx, null, 2)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (aiRes.status === 429) return jsonResp({ error: "rate_limited" }, 429);
    if (aiRes.status === 402) return jsonResp({ error: "credits_exhausted" }, 402);
    if (!aiRes.ok || !aiRes.body) return jsonResp({ error: "ai_failed", detail: await aiRes.text() }, 500);

    return new Response(aiRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return jsonResp({ error: String(err) }, 500);
  }
});

function agrupar(arr: any[], key: string) {
  return arr.reduce((acc: Record<string, number>, item: any) => {
    const k = String(item[key] ?? "—");
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
