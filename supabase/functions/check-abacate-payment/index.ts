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
    if (!authHeader) throw new Error("Não autorizado");

    const { pixId, dependentId, certificateId } = await req.json();
    if (!pixId) throw new Error("ID do PIX não fornecido");

    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Identifica o usuário logado via JWT
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error("Sessão inválida na verificação");

    // 1. Otimização: Verificar primeiro no banco de dados local se o Webhook já aprovou
    let isPaidLocal = false;
    if (certificateId) {
      const { data } = await supabaseAdmin
        .from('academy_certificates')
        .select('status_payment')
        .eq('id', certificateId)
        .single();
      isPaidLocal = data?.status_payment === 'PAID';
    } else if (dependentId) {
      const { data } = await supabaseAdmin
        .from('dependents')
        .select('payment_status')
        .eq('id', dependentId)
        .single();
      isPaidLocal = data?.payment_status === 'PAID';
    } else {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('payment_status')
        .eq('id', user.id)
        .single();
      isPaidLocal = data?.payment_status === 'PAID';
    }

    if (isPaidLocal) {
      return new Response(JSON.stringify({ status: 'PAID' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Se não estiver PAID localmente, consultar status no AbacatePay usando a API V2
    const abacateResponse = await fetch(`https://api.abacatepay.com/v2/checkouts`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
    });

    if (!abacateResponse.ok) {
      const errRes = await abacateResponse.text();
      console.error("[ABACATE V2] Erro ao buscar checkouts:", errRes);
      throw new Error("Erro ao consultar o AbacatePay");
    }

    const result = await abacateResponse.json();
    
    // Procura o checkout com o ID correspondente na API V2
    const checkouts = result.data || [];
    const checkout = Array.isArray(checkouts) 
      ? checkouts.find((c: any) => c.id === pixId) 
      : (checkouts.id === pixId ? checkouts : null);

    const status = checkout?.status;
    const checkoutAmount = checkout?.amount;

    if (status === 'PAID') {
        const finalPlan = checkoutAmount === 3000 ? 'DIGITAL' : 'PRINTED';
        const now = new Date().toISOString();

        if (certificateId) {
            await supabaseAdmin.from('academy_certificates').update({
                status_payment: 'PAID',
                paid_at: now,
                billing_id: pixId
            }).eq('id', certificateId);
        } else if (dependentId) {
            await supabaseAdmin.from('dependents').update({
                payment_status: 'PAID',
                payment_confirmed_at: now,
                payment_plan: finalPlan
            }).eq('id', dependentId);
        } else {
            await supabaseAdmin.from('profiles').update({
                payment_status: 'PAID',
                payment_confirmed_at: now,
                payment_plan: finalPlan
            }).eq('id', user.id);
        }
        
        await new Promise(r => setTimeout(r, 1000));
    }

    return new Response(JSON.stringify({ status: status || 'PENDING' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("[CHECK ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});