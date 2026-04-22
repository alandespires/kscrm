// Edge function: gera score (0-100), resumo e sugestão de próxima ação para um lead.
// Usa Lovable AI Gateway com tool-calling para saída estruturada.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é um analista sênior de vendas B2B.
Avalie o lead com base nos dados fornecidos e retorne SEMPRE via tool call.

Critérios para o score (0-100):
- Qualidade do contato (e-mail/whatsapp preenchidos)
- Empresa identificada e porte aparente
- Clareza do interesse declarado
- Estágio atual no funil
- Valor estimado de negociação
- Recência (criado/atualizado recentemente vale mais)

Regras de escrita:
- Resumo: 1-2 frases objetivas em português, sem floreio.
- Sugestão: UMA próxima ação concreta, executável hoje, começando com verbo no infinitivo.
  Ex.: "Enviar proposta com 2 cenários de preço via WhatsApp".`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: lead, error: lerr } = await admin
      .from("leads").select("*").eq("id", lead_id).single();
    if (lerr || !lead) {
      return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Lead a avaliar:
- Nome: ${lead.nome}
- Empresa: ${lead.empresa ?? "—"}
- E-mail: ${lead.email ?? "—"}
- WhatsApp: ${lead.whatsapp ?? "—"}
- Origem: ${lead.origem ?? "—"}
- Interesse: ${lead.interesse ?? "—"}
- Observações: ${lead.observacoes ?? "—"}
- Tags: ${(lead.tags ?? []).join(", ") || "—"}
- Status atual: ${lead.status}
- Valor estimado: ${lead.valor_estimado ? `R$ ${lead.valor_estimado}` : "—"}
- Criado em: ${lead.created_at}
- Último contato: ${lead.ultimo_contato_em ?? "nunca"}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "score_lead",
            description: "Retorna análise estruturada do lead.",
            parameters: {
              type: "object",
              properties: {
                score: { type: "integer", minimum: 0, maximum: 100 },
                resumo: { type: "string", maxLength: 280 },
                sugestao: { type: "string", maxLength: 200 },
              },
              required: ["score", "resumo", "sugestao"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "score_lead" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione saldo nas configurações do workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Falha no AI Gateway" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const call = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      console.error("Sem tool_call:", JSON.stringify(aiJson));
      throw new Error("Resposta da IA sem tool_call");
    }
    const parsed = JSON.parse(call.function.arguments) as {
      score: number; resumo: string; sugestao: string;
    };

    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));

    const { error: uerr } = await admin.from("leads").update({
      ai_score: score,
      ai_resumo: parsed.resumo,
      ai_sugestao: parsed.sugestao,
      updated_at: new Date().toISOString(),
    }).eq("id", lead_id);
    if (uerr) throw uerr;

    await admin.from("ai_insights").insert({
      lead_id,
      tipo: "score",
      titulo: `Score ${score} · ${lead.nome}`,
      conteudo: `${parsed.resumo}\n\nPróxima ação: ${parsed.sugestao}`,
      prioridade: score >= 80 ? "alta" : score >= 50 ? "media" : "baixa",
    });

    return new Response(JSON.stringify({
      ai_score: score, ai_resumo: parsed.resumo, ai_sugestao: parsed.sugestao,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("score-lead error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
