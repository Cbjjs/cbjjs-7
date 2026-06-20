import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Acesso não autorizado");

    const body = await req.json();
    const { amount, plan, dependentId, certificateId, customerData } = body; 

    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!apiKey) throw new Error("API Key não configurada nos Secrets do Supabase");

    const { name, email, taxId, phone } = customerData;

    // 1. Valor em centavos
    const amountInCents = Math.round(parseFloat(amount.toString().replace(',', '.')) * 100);

    // 2. Descrição (Limite rigoroso de 37 caracteres conforme documentação)
    const fullDescription = certificateId 
      ? `Certificado Academia - ${name}`
      : `Anuidade 2026 - ${name}`;
    const truncatedDescription = fullDescription.substring(0, 37);

    // 3. Montagem do Metadata (Sem valores nulos)
    const metadata: Record<string, string> = {};
    if (plan) {
      metadata.plan_type = plan;
    }
    if (dependentId) {
      metadata.dependent_id = dependentId;
    }
    if (certificateId) {
      metadata.certificate_id = certificateId;
    }

    // Estrutura exigida pela nova API V2 (Dentro do objeto "data" e também na raiz para maior compatibilidade de webhook)
    const payload = {
      method: "PIX",
      data: {
        amount: amountInCents,
        description: truncatedDescription,
        customer: {
          name: name,
          email: email,
          taxId: taxId,
          cellphone: phone
        },
        metadata: metadata
      },
      metadata: metadata
    };

    console.log("[ABACATE V2] Enviando payload:", JSON.stringify(payload));

    // Chamada para o novo endpoint V2 do AbacatePay
    const abacateResponse = await fetch('https://api.abacatepay.com/v2/transparents/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(payload)
    });

    const result = await abacateResponse.json();

    if (!abacateResponse.ok) {
      console.error("[ABACATE V2] Erro na API:", result);
      return new Response(JSON.stringify({ 
        error: "Erro no AbacatePay", 
        details: result.error || result 
      }), {
        status: abacateResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("[FUNCTION ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});