import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

type SupabaseAdmin = ReturnType<typeof createClient>

const getAuthenticatedUser = async (req: Request): Promise<{ id: string }> => {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) throw new HttpError(401, 'Não autorizado')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) throw new HttpError(500, 'Configuração de autenticação indisponível')

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) throw new HttpError(401, 'Sessão inválida')
  return user
}

const addOneYear = (date: Date) => {
  const next = new Date(date.getTime())
  const month = next.getUTCMonth()
  const day = next.getUTCDate()
  next.setUTCDate(1)
  next.setUTCFullYear(next.getUTCFullYear() + 1)
  next.setUTCMonth(month)
  next.setUTCDate(month === 1 && day === 29 ? 28 : day)
  return next
}

const dateOnly = (date: Date) => date.toISOString().slice(0, 10)

const findCheckout = (result: any, pixId: string) => {
  const checkouts = result?.data || []
  return Array.isArray(checkouts)
    ? checkouts.find((item: any) => item.id === pixId)
    : (checkouts?.id === pixId ? checkouts : null)
}

const ensureAnnualSnapshot = async (supabaseAdmin: SupabaseAdmin, membershipId: string) => {
  const { data: existing, error } = await supabaseAdmin
    .from('annual_membership_snapshots')
    .select('id')
    .eq('membership_id', membershipId)
    .limit(1)
  if (error) throw new HttpError(500, 'Não foi possível verificar a carteirinha')
  if (!existing || existing.length === 0) {
    const { error: snapshotError } = await supabaseAdmin.rpc('generate_annual_membership_snapshot', {
      p_membership_id: membershipId
    })
    if (snapshotError) throw new HttpError(500, 'Não foi possível gerar a carteirinha')
  }
}

const confirmAnnualMembership = async (
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  pixId: string,
  membershipId: string | undefined,
  transactionId: string | undefined,
  dependentId: string | undefined,
  apiKey: string
) => {
  let transaction: any
  if (transactionId) {
    const { data, error } = await supabaseAdmin
      .from('annual_membership_transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Não foi possível consultar a transação anual')
    if (!data) throw new HttpError(404, 'Transação anual não encontrada')
    transaction = data
  } else {
    const { data, error } = await supabaseAdmin
      .from('annual_membership_transactions')
      .select('*')
      .eq('external_id', pixId)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Não foi possível consultar a transação anual')
    if (!data) throw new HttpError(404, 'Transação anual não encontrada')
    transaction = data
  }

  if (membershipId && transaction.membership_id !== membershipId) throw new HttpError(403, 'Transação não corresponde à filiação')
  if (transaction.external_id !== pixId) throw new HttpError(403, 'O PIX não corresponde à transação')

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('annual_memberships')
    .select('*')
    .eq('id', transaction.membership_id)
    .maybeSingle()
  if (membershipError) throw new HttpError(500, 'Não foi possível consultar a filiação anual')
  if (!membership) throw new HttpError(404, 'Filiação anual não encontrada')
  if (membershipId && membership.id !== membershipId) throw new HttpError(403, 'Filiação anual inválida')

  let isOwner = membership.profile_id === userId
  if (membership.dependent_id) {
    const { data: dependent, error: dependentError } = await supabaseAdmin
      .from('dependents')
      .select('parent_id')
      .eq('id', membership.dependent_id)
      .maybeSingle()
    if (dependentError) throw new HttpError(500, 'Não foi possível validar o responsável')
    isOwner = dependent?.parent_id === userId
    if (dependentId && dependentId !== membership.dependent_id) throw new HttpError(403, 'Cobrança não corresponde ao dependente')
  } else if (dependentId) {
    throw new HttpError(403, 'Cobrança não corresponde ao dependente')
  }
  if (!isOwner) throw new HttpError(403, 'Cobrança não pertence ao usuário autenticado')
  if (membership.payment_status === 'EXEMPT') throw new HttpError(409, 'Esta filiação é isenta e não possui pagamento')
  if (transaction.status !== 'PENDING' && transaction.status !== 'PAID') throw new HttpError(409, 'A transação não está disponível para confirmação')

  let shouldEnsureSnapshot = transaction.status === 'PAID'
  if (transaction.status !== 'PAID') {
    const abacateResponse = await fetch('https://api.abacatepay.com/v2/checkouts', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
    })
    if (!abacateResponse.ok) throw new HttpError(502, 'Erro ao consultar o AbacatePay')
    const result = await abacateResponse.json()
    const checkout = findCheckout(result, pixId)
    if (!checkout) throw new HttpError(404, 'Cobrança não encontrada')

    const checkoutMetadata = checkout.metadata || checkout.data?.metadata || {}
    if (
      checkoutMetadata.user_id !== userId ||
      checkoutMetadata.membership_id !== membership.id ||
      checkoutMetadata.transaction_id !== transaction.id ||
      checkoutMetadata.transaction_type !== transaction.transaction_type ||
      (membership.dependent_id && checkoutMetadata.dependent_id !== membership.dependent_id)
    ) {
      throw new HttpError(403, 'Cobrança não pertence ao usuário autenticado')
    }
    if (Number(checkout.amount) !== Number(transaction.amount_cents)) throw new HttpError(409, 'Valor da cobrança não confere')
    if (checkout.status !== 'PAID') return { status: checkout.status || 'PENDING', membershipId: membership.id, transactionId: transaction.id }

    const paidAt = new Date().toISOString()
    const { data: paidTransaction, error: paidTransactionError } = await supabaseAdmin
      .from('annual_membership_transactions')
      .update({ status: 'PAID', paid_at: paidAt })
      .eq('id', transaction.id)
      .eq('status', 'PENDING')
      .select('*')
      .maybeSingle()
    if (paidTransactionError) throw new HttpError(500, 'Não foi possível confirmar a transação')
    shouldEnsureSnapshot = Boolean(paidTransaction)
    transaction = paidTransaction || { ...transaction, status: 'PAID', paid_at: paidAt }
  }

  const confirmedAt = transaction.paid_at || new Date().toISOString()
  const validFrom = dateOnly(new Date(confirmedAt))
  const validUntil = dateOnly(addOneYear(new Date(confirmedAt)))
  const { data: activatedMembership, error: activationError } = await supabaseAdmin
    .from('annual_memberships')
    .update({
      status: 'ACTIVE',
      payment_status: 'PAID',
      valid_from: validFrom,
      valid_until: validUntil,
      activated_at: confirmedAt
    })
    .eq('id', membership.id)
    .in('status', ['PENDING', 'ACTIVE'])
    .neq('payment_status', 'EXEMPT')
    .select('*')
    .maybeSingle()
  if (activationError || !activatedMembership) throw new HttpError(500, 'Não foi possível ativar a filiação anual')

  const legacyPlan = transaction.plan === 'PRINTED' ? 'PRINTED' : 'DIGITAL'
  if (membership.profile_id) {
    const { error } = await supabaseAdmin.from('profiles').update({
      payment_status: 'PAID',
      payment_confirmed_at: confirmedAt,
      payment_plan: legacyPlan,
      current_billing_id: pixId
    }).eq('id', membership.profile_id)
    if (error) throw new HttpError(500, 'Não foi possível atualizar o perfil')
  } else if (membership.dependent_id) {
    const { error } = await supabaseAdmin.from('dependents').update({
      payment_status: 'PAID',
      payment_confirmed_at: confirmedAt,
      payment_plan: legacyPlan
    }).eq('id', membership.dependent_id)
    if (error) throw new HttpError(500, 'Não foi possível atualizar o dependente')
  }

  if (shouldEnsureSnapshot) await ensureAnnualSnapshot(supabaseAdmin, membership.id)
  return {
    status: 'PAID',
    membershipId: membership.id,
    transactionId: transaction.id,
    transactionType: transaction.transaction_type,
    validFrom,
    validUntil
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const user = await getAuthenticatedUser(req)
    const body = await req.json()
    const { pixId, dependentId, certificateId, membershipId, transactionId } = body

    if (typeof pixId !== 'string' || !pixId.trim()) throw new HttpError(400, 'ID do PIX não fornecido')
    if (membershipId || transactionId) {
      if (membershipId && typeof membershipId !== 'string') throw new HttpError(400, 'Filiação anual inválida')
      if (transactionId && typeof transactionId !== 'string') throw new HttpError(400, 'Transação anual inválida')
      const apiKey = Deno.env.get('ABACATEPAY_API_KEY')
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (!apiKey || !supabaseUrl || !supabaseServiceKey) throw new HttpError(500, 'Configuração do servidor indisponível')
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
      const result = await confirmAnnualMembership(supabaseAdmin, user.id, pixId, membershipId, transactionId, dependentId, apiKey)
      return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (dependentId && certificateId) throw new HttpError(400, 'Informe apenas um recurso de pagamento')
    const apiKey = Deno.env.get('ABACATEPAY_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!apiKey || !supabaseUrl || !supabaseServiceKey) throw new HttpError(500, 'Configuração do servidor indisponível')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    let isPaidLocal = false
    if (certificateId) {
      if (typeof certificateId !== 'string') throw new HttpError(400, 'Certificado inválido')
      const { data, error } = await supabaseAdmin
        .from('academy_certificates')
        .select('owner_id, status_payment')
        .eq('id', certificateId)
        .maybeSingle()
      if (error) throw new HttpError(500, 'Não foi possível validar o certificado')
      if (!data || data.owner_id !== user.id) throw new HttpError(403, 'Certificado não pertence ao usuário autenticado')
      isPaidLocal = data.status_payment === 'PAID'
    } else if (dependentId) {
      if (typeof dependentId !== 'string') throw new HttpError(400, 'Dependente inválido')
      const { data, error } = await supabaseAdmin
        .from('dependents')
        .select('parent_id, payment_status')
        .eq('id', dependentId)
        .maybeSingle()
      if (error) throw new HttpError(500, 'Não foi possível validar o dependente')
      if (!data || data.parent_id !== user.id) throw new HttpError(403, 'Dependente não pertence ao usuário autenticado')
      isPaidLocal = data.payment_status === 'PAID'
    } else {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('payment_status')
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw new HttpError(500, 'Não foi possível validar o perfil')
      if (!data) throw new HttpError(403, 'Perfil não pertence ao usuário autenticado')
      isPaidLocal = data.payment_status === 'PAID'
    }

    if (isPaidLocal) return new Response(JSON.stringify({ status: 'PAID' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const abacateResponse = await fetch('https://api.abacatepay.com/v2/checkouts', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
    })
    if (!abacateResponse.ok) throw new HttpError(502, 'Erro ao consultar o AbacatePay')
    const result = await abacateResponse.json()
    const checkout = findCheckout(result, pixId)
    if (!checkout) throw new HttpError(404, 'Cobrança não encontrada')

    const checkoutMetadata = checkout.metadata || checkout.data?.metadata || {}
    const expectedResourceId = certificateId || dependentId
    if (checkoutMetadata.user_id !== user.id || (expectedResourceId && checkoutMetadata[certificateId ? 'certificate_id' : 'dependent_id'] !== expectedResourceId)) {
      throw new HttpError(403, 'Cobrança não pertence ao usuário autenticado')
    }

    const status = checkout.status
    const checkoutAmount = checkout.amount
    if (status === 'PAID') {
      const finalPlan = checkoutAmount === 3000 ? 'DIGITAL' : 'PRINTED'
      const now = new Date().toISOString()
      if (certificateId) {
        await supabaseAdmin.from('academy_certificates').update({ status_payment: 'PAID', paid_at: now, billing_id: pixId }).eq('id', certificateId)
      } else if (dependentId) {
        await supabaseAdmin.from('dependents').update({ payment_status: 'PAID', payment_confirmed_at: now, payment_plan: finalPlan }).eq('id', dependentId)
      } else {
        await supabaseAdmin.from('profiles').update({ payment_status: 'PAID', payment_confirmed_at: now, payment_plan: finalPlan }).eq('id', user.id)
      }
    }

    return new Response(JSON.stringify({ status: status || 'PENDING' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 400
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[CHECK ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// O webhook continua sem alteração nesta fase; a confirmação manual é a fonte de ativação anual.
