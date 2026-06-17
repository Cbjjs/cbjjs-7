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

    const { targetUserId, newPassword } = await req.json()
    if (!targetUserId || !newPassword) throw new Error("Dados incompletos")

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verificar se quem está pedindo é um ADMIN
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

    // 2. Alterar a senha do usuário alvo usando o Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (updateError) throw updateError

    return new Response(JSON.stringify({ message: "Senha alterada com sucesso!" }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})