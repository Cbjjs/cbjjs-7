import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

declare const Deno: any;

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
    const { apiKey: clientApiKey, from, to, subject, html } = body

    // Prioriza a Secret do Supabase (RESEND_API_KEY), com fallback para a chave enviada pelo cliente (se houver)
    const apiKey = Deno.env.get('RESEND_API_KEY') || clientApiKey

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "Chave de API do Resend não configurada.", 
        details: "Por favor, configure a Secret 'RESEND_API_KEY' no painel do Supabase (Project Settings -> Edge Functions -> Manage Secrets) ou insira uma chave temporária na tela." 
      }), {
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
