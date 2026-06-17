import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json();
    const status = payload.data?.status;
    const customerEmail = payload.data?.customer?.email;
    const planFromMetadata = payload.data?.metadata?.plan_type;
    const dependentId = payload.data?.metadata?.dependent_id;
    const certificateId = payload.data?.metadata?.certificate_id;
    const userId = payload.data?.metadata?.user_id;
    const amount = payload.data?.amount;

    if (status === 'PAID') {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const finalPlan = planFromMetadata || (amount === 3000 ? 'DIGITAL' : 'PRINTED');
      const now = new Date().toISOString();

      if (certificateId) {
        // Atualiza certificado da academia
        await supabaseAdmin.from('academy_certificates').update({
          status_payment: 'PAID',
          paid_at: now,
          billing_id: payload.data?.id
        }).eq('id', certificateId);
      } else if (dependentId) {
        // Atualiza dependente
        await supabaseAdmin.from('dependents').update({
          payment_status: 'PAID',
          payment_confirmed_at: now,
          payment_plan: finalPlan
        }).eq('id', dependentId);
      } else if (userId || customerEmail) {
        // Atualiza perfil por ID (preferencial) ou Email
        const query = userId ? 
          supabaseAdmin.from('profiles').update({ payment_status: 'PAID', payment_confirmed_at: now, payment_plan: finalPlan }).eq('id', userId) :
          supabaseAdmin.from('profiles').update({ payment_status: 'PAID', payment_confirmed_at: now, payment_plan: finalPlan }).eq('email', customerEmail);
        
        await query;
      }

      return new Response(JSON.stringify({ message: "OK" }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ message: "Ignored" }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});