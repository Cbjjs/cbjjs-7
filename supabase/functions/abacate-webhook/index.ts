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
    
    // Resiliência de metadados: tenta obter da raiz e também do objeto "data"
    const metadata = payload.metadata || payload.data?.metadata || {};
    const planFromMetadata = metadata.plan_type;
    const dependentId = metadata.dependent_id;
    const certificateId = metadata.certificate_id;
    const userId = metadata.user_id;
    
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

        // Gera número de registro para a academia se ainda não possuir
        try {
          const { data: certData } = await supabaseAdmin
            .from('academy_certificates')
            .select('academy_id')
            .eq('id', certificateId)
            .single();

          if (certData && certData.academy_id) {
            const { data: acad } = await supabaseAdmin
              .from('academies')
              .select('federation_id')
              .eq('id', certData.academy_id)
              .single();

            if (acad && !acad.federation_id) {
              const { data: allAcademies } = await supabaseAdmin
                .from('academies')
                .select('federation_id')
                .not('federation_id', 'is', null)
                .like('federation_id', 'CBJJS-AC-%');

              let nextNum = 1;
              if (allAcademies && allAcademies.length > 0) {
                const numbers = allAcademies
                  .map((a: any) => {
                    const match = a.federation_id?.match(/CBJJS-AC-(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                  })
                  .filter((n: number) => n > 0);
                
                const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
                nextNum = maxNum + 1;
              }

              const newFedId = `CBJJS-AC-${String(nextNum).padStart(4, '0')}`;

              await supabaseAdmin
                .from('academies')
                .update({ federation_id: newFedId })
                .eq('id', certData.academy_id);
            }
          }
        } catch (fedErr) {
          console.error("Erro ao gerar federation_id para academia:", fedErr);
        }
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