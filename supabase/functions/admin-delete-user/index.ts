import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Não autorizado")

    const { targetUserId } = await req.json()
    if (!targetUserId) throw new Error("ID do usuário não fornecido")

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verificar permissão de ADMIN
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requester }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !requester) throw new Error("Sessão inválida")

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single()

    if (profile?.role !== 'ADMIN') {
      throw new Error("Apenas administradores podem realizar esta ação")
    }

    // 2. LOGICA DE DESVINCULAÇÃO TOTAL (Para Professores)
    // Se ele for dono de alguma academia, precisamos tirar os alunos de lá antes
    const { data: myAcademies } = await supabaseAdmin
        .from('academies')
        .select('id')
        .eq('owner_id', targetUserId)

    if (myAcademies && myAcademies.length > 0) {
        const academyIds = myAcademies.map(a => a.id)
        
        // Desvincula atletas (Profiles)
        await supabaseAdmin.from('profiles')
            .update({ academy_id: null, academy_status: 'PENDING' })
            .in('academy_id', academyIds)

        // Desvincula dependentes
        await supabaseAdmin.from('dependents')
            .update({ academy_id: null, academy_status: 'PENDING' })
            .in('academy_id', academyIds)

        // Remove solicitações de alteração de academia
        await supabaseAdmin.from('academy_change_requests').delete().in('academy_id', academyIds)
        
        // Agora sim, remove as academias
        await supabaseAdmin.from('academies').delete().in('id', academyIds)
    }

    // 3. LIMPEZA DE DADOS PESSOAIS
    await supabaseAdmin.from('dependents').delete().eq('parent_id', targetUserId)
    await supabaseAdmin.from('profile_change_requests').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('payment_logs').delete().eq('user_id', targetUserId)

    // 4. EXCLUSÃO FINAL NO AUTH
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ 
        message: "Limpeza profunda concluída. Usuário e vínculos removidos.",
        target: targetUserId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[DELETE-FATAL-ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})