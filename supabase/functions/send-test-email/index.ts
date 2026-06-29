import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { apiKey, from, to, subject, html } = body

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "A chave de API do Resend é obrigatória para o teste." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log("[send-test-email] Iniciando disparo de e-mail via Resend para:", to)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        from: from || 'onboarding@resend.dev',
        to: to || 'cbjjs@saltonaweb.sh27.com.br',
        subject: subject || 'Hello World',
        html: html || '<p>Congrats on sending your <strong>first email</strong>!</p>'
      })
    })

    const result = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error("[send-test-email] Erro retornado pela API do Resend:", result)
      return new Response(JSON.stringify({ 
        error: "Erro na API do Resend", 
        details: result 
      }), {
        status: resendResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log("[send-test-email] E-mail enviado com sucesso:", result)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[send-test-email] Erro crítico na execução:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})