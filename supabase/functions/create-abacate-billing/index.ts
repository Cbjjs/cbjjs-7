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
type AnnualOwner = { profileId: string | null; dependentId: string | null }

const getAuthenticatedUser = async (req: Request): Promise<{ id: string }> => {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) throw new HttpError(401, 'Acesso não autorizado')

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

const authorizeResource = async (
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  dependentId?: unknown,
  certificateId?: unknown
) => {
  if (dependentId && certificateId) throw new HttpError(400, 'Informe apenas um recurso de pagamento')

  if (dependentId) {
    if (typeof dependentId !== 'string') throw new HttpError(400, 'Dependente inválido')
    const { data, error } = await supabaseAdmin
      .from('dependents')
      .select('parent_id')
      .eq('id', dependentId)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Não foi possível validar o dependente')
    if (!data || data.parent_id !== userId) throw new HttpError(403, 'Dependente não pertence ao usuário autenticado')
  }

  if (certificateId) {
    if (typeof certificateId !== 'string') throw new HttpError(400, 'Certificado inválido')
    const { data, error } = await supabaseAdmin
      .from('academy_certificates')
      .select('owner_id')
      .eq('id', certificateId)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Não foi possível validar o certificado')
    if (!data || data.owner_id !== userId) throw new HttpError(403, 'Certificado não pertence ao usuário autenticado')
  }
}

const getPlanAmount = async (supabaseAdmin: SupabaseAdmin, plan: unknown) => {
  if (plan !== 'DIGITAL' && plan !== 'PRINTED') throw new HttpError(400, 'Plano inválido')
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .in('key', [`plan_${String(plan).toLowerCase()}_active`, `plan_${String(plan).toLowerCase()}_price`])
  if (error) throw new HttpError(500, 'Não foi possível consultar o plano')

  const active = data?.find(item => item.key.endsWith('_active'))?.value
  if (active === 'false') throw new HttpError(409, 'Este plano não está disponível')
  const configuredPrice = data?.find(item => item.key.endsWith('_price'))?.value
  const amount = Number.parseFloat(configuredPrice || (plan === 'DIGITAL' ? '30.00' : '35.00'))
  if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(500, 'Preço do plano inválido')
  return { amount, amountCents: Math.round(amount * 100), plan: String(plan) }
}

const assertPendingTransactionMatchesPlan = (
  transaction: { plan: string; amount_cents: number },
  selectedPlan: { plan: string; amountCents: number }
) => {
  if (transaction.plan !== selectedPlan.plan || Number(transaction.amount_cents) !== selectedPlan.amountCents) {
    throw new HttpError(409, 'Já existe uma cobrança pendente para outro plano ou valor')
  }
}

const getAnnualOwner = async (
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  dependentId: string | null
): Promise<{ owner: AnnualOwner; customer: { name: string; email: string; taxId: string; phone: string } }> => {
  if (dependentId) {
    const { data: dependent, error } = await supabaseAdmin
      .from('dependents')
      .select('id, parent_id, full_name, cpf, phone')
      .eq('id', dependentId)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Não foi possível consultar o dependente')
    if (!dependent || dependent.parent_id !== userId) throw new HttpError(403, 'Dependente não pertence ao usuário autenticado')

    const { data: parent, error: parentError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, cpf, phone')
      .eq('id', userId)
      .maybeSingle()
    if (parentError || !parent) throw new HttpError(403, 'Perfil responsável não encontrado')
    return {
      owner: { profileId: null, dependentId },
      customer: {
        name: dependent.full_name,
        email: parent.email,
        taxId: dependent.cpf || parent.cpf || '',
        phone: dependent.phone || parent.phone || ''
      }
    }
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, cpf, phone')
    .eq('id', userId)
    .maybeSingle()
  if (error || !profile) throw new HttpError(403, 'Perfil não pertence ao usuário autenticado')
  return {
    owner: { profileId: userId, dependentId: null },
    customer: {
      name: profile.full_name || '',
      email: profile.email || '',
      taxId: profile.cpf || '',
      phone: profile.phone || ''
    }
  }
}

const currentPeriod = () => new Date().getUTCFullYear()

const getExistingProviderData = async (apiKey: string, externalId: string) => {
  const response = await fetch('https://api.abacatepay.com/v2/checkouts', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
  })
  if (!response.ok) return {}
  const result = await response.json()
  const checkouts = result?.data
  const checkout = Array.isArray(checkouts)
    ? checkouts.find((item: any) => item?.id === externalId)
    : checkouts?.id === externalId ? checkouts : null
  if (!checkout || typeof checkout !== 'object') return {}
  return {
    ...checkout,
    ...(checkout.brCode || checkout.br_code ? { brCode: checkout.brCode || checkout.br_code } : {}),
    ...(checkout.brCodeBase64 || checkout.br_code_base64 ? { brCodeBase64: checkout.brCodeBase64 || checkout.br_code_base64 } : {})
  }
}

const findOrCreateMembership = async (
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  requestedMembershipId: unknown,
  dependentId: string | null
) => {
  let owner: AnnualOwner
  let customer: { name: string; email: string; taxId: string; phone: string }
  let membership: any

  if (requestedMembershipId !== undefined && requestedMembershipId !== null) {
    if (typeof requestedMembershipId !== 'string' || !requestedMembershipId.trim()) {
      throw new HttpError(400, 'Filiação anual inválida')
    }
    const { data, error } = await supabaseAdmin
      .from('annual_memberships')
      .select('*')
      .eq('id', requestedMembershipId)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Não foi possível validar a filiação anual')
    if (!data) throw new HttpError(404, 'Filiação anual não encontrada')
    if (data.status !== 'PENDING' || data.payment_status !== 'PENDING') {
      if (data.payment_status === 'EXEMPT') throw new HttpError(409, 'Esta filiação é isenta e não deve gerar cobrança')
      throw new HttpError(409, 'A filiação anual não está pendente')
    }

    const belongsToProfile = data.profile_id === userId
    let belongsToDependent = false
    if (data.dependent_id) {
      const { data: dependent, error: dependentError } = await supabaseAdmin
        .from('dependents')
        .select('parent_id')
        .eq('id', data.dependent_id)
        .maybeSingle()
      if (dependentError) throw new HttpError(500, 'Não foi possível validar o titular da filiação')
      belongsToDependent = dependent?.parent_id === userId
    }
    if (!belongsToProfile && !belongsToDependent) throw new HttpError(403, 'Filiação anual não pertence ao usuário autenticado')
    if (dependentId && data.dependent_id !== dependentId) throw new HttpError(403, 'Filiação não corresponde ao dependente informado')

    owner = { profileId: data.profile_id, dependentId: data.dependent_id }
    const ownerData = await getAnnualOwner(supabaseAdmin, userId, data.dependent_id)
    customer = ownerData.customer
    membership = data
  } else {
    const ownerData = await getAnnualOwner(supabaseAdmin, userId, dependentId)
    owner = ownerData.owner
    customer = ownerData.customer
    const period = currentPeriod()
    const ownerColumn = owner.profileId ? 'profile_id' : 'dependent_id'
    const ownerId = owner.profileId || owner.dependentId
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('annual_memberships')
      .select('*')
      .eq(ownerColumn, ownerId)
      .eq('membership_period', period)
      .maybeSingle()
    if (existingError) throw new HttpError(500, 'Não foi possível consultar a filiação anual')
    if (existing) {
      if (existing.payment_status === 'EXEMPT') throw new HttpError(409, 'Esta filiação é isenta e não deve gerar cobrança')
      if (existing.status !== 'PENDING' || existing.payment_status !== 'PENDING') {
        throw new HttpError(409, 'A filiação anual deste período já está ativa')
      }
      membership = existing
    } else {
      const { data: history, error: historyError } = await supabaseAdmin
        .from('annual_memberships')
        .select('membership_period, status, payment_status')
        .eq(ownerColumn, ownerId)
        .lt('membership_period', period)
        .in('status', ['ACTIVE', 'EXPIRED'])
        .limit(1)
      if (historyError) throw new HttpError(500, 'Não foi possível consultar o histórico anual')
      const membershipType = history && history.length > 0 ? 'RENEWAL' : 'INITIAL'
      const { data: created, error: createError } = await supabaseAdmin
        .from('annual_memberships')
        .insert({
          membership_period: period,
          profile_id: owner.profileId,
          dependent_id: owner.dependentId,
          membership_type: membershipType,
          status: 'PENDING',
          payment_status: 'PENDING'
        })
        .select('*')
        .single()
      if (createError) {
        if (createError.code === '23505') {
          const { data: raced } = await supabaseAdmin
            .from('annual_memberships')
            .select('*')
            .eq(ownerColumn, ownerId)
            .eq('membership_period', period)
            .maybeSingle()
          if (!raced) throw new HttpError(409, 'Não foi possível reservar a filiação anual')
          membership = raced
        } else {
          throw new HttpError(500, 'Não foi possível criar a filiação anual')
        }
      } else {
        membership = created
      }
    }
  }

  return { owner, customer, membership }
}

const createLegacyCertificateBilling = async (
  apiKey: string,
  userId: string,
  name: string,
  email: string,
  taxId: string,
  phone: string,
  amount: unknown,
  certificateId: string
) => {
  const parsedAmount = typeof amount === 'number' ? amount : Number.parseFloat(String(amount).replace(',', '.'))
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) throw new HttpError(400, 'Valor inválido')
  const amountInCents = Math.round(parsedAmount * 100)
  const metadata: Record<string, string> = { certificate_id: certificateId, user_id: userId }
  const payload = {
    method: 'PIX',
    data: {
      amount: amountInCents,
      description: `Certificado Academia - ${name}`.substring(0, 37),
      customer: { name, email, taxId, cellphone: phone },
      metadata
    },
    metadata
  }
  const response = await fetch('https://api.abacatepay.com/v2/transparents/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.trim()}` },
    body: JSON.stringify(payload)
  })
  const result = await response.json()
  if (!response.ok) throw new HttpError(response.status, 'Erro no AbacatePay')
  return result
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const user = await getAuthenticatedUser(req)
    const body = await req.json()
    const { amount, plan, dependentId, certificateId, customerData, membershipId } = body

    if (certificateId) {
      if (!customerData || typeof customerData !== 'object') throw new HttpError(400, 'Dados do cliente não fornecidos')
      const { name, email, taxId, phone } = customerData
      if (![name, email, taxId, phone].every(value => typeof value === 'string' && value.trim())) {
        throw new HttpError(400, 'Dados do cliente incompletos')
      }
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const apiKey = Deno.env.get('ABACATEPAY_API_KEY')
      if (!supabaseUrl || !supabaseServiceKey || !apiKey) throw new HttpError(500, 'Configuração do servidor indisponível')
      await authorizeResource(createClient(supabaseUrl, supabaseServiceKey), user.id, dependentId, certificateId)
      const result = await createLegacyCertificateBilling(apiKey, user.id, name, email, taxId, phone, amount, certificateId)
      return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const apiKey = Deno.env.get('ABACATEPAY_API_KEY')
    if (!supabaseUrl || !supabaseServiceKey || !apiKey) throw new HttpError(500, 'Configuração do servidor indisponível')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const normalizedDependentId = dependentId === undefined || dependentId === null ? null : dependentId
    const { owner, customer, membership } = await findOrCreateMembership(
      supabaseAdmin,
      user.id,
      membershipId,
      normalizedDependentId
    )
    const selectedPlan = await getPlanAmount(supabaseAdmin, plan)
    if (![customer.name, customer.email, customer.taxId, customer.phone].every(value => typeof value === 'string' && value.trim())) {
      throw new HttpError(400, 'Dados do titular incompletos para cobrança')
    }

    const { data: pendingTransaction, error: pendingError } = await supabaseAdmin
      .from('annual_membership_transactions')
      .select('*')
      .eq('membership_id', membership.id)
      .eq('status', 'PENDING')
      .maybeSingle()
    if (pendingError) throw new HttpError(500, 'Não foi possível consultar a cobrança pendente')
    if (pendingTransaction) assertPendingTransactionMatchesPlan(pendingTransaction, selectedPlan)

    let transaction = pendingTransaction
    if (!transaction) {
      const metadata: Record<string, string> = {
        user_id: user.id,
        membership_id: membership.id,
        transaction_type: membership.membership_type
      }
      if (owner.dependentId) metadata.dependent_id = owner.dependentId
      const idempotencyKey = `annual:${membership.id}:${membership.membership_period}`
      const { data: createdTransaction, error: transactionError } = await supabaseAdmin
        .from('annual_membership_transactions')
        .insert({
          membership_id: membership.id,
          transaction_type: membership.membership_type,
          provider: 'ABACATEPAY',
          amount_cents: selectedPlan.amountCents,
          plan: selectedPlan.plan,
          idempotency_key: idempotencyKey,
          status: 'PENDING',
          metadata
        })
        .select('*')
        .single()
      if (transactionError) {
        if (transactionError.code === '23505') {
          const { data: raced } = await supabaseAdmin
            .from('annual_membership_transactions')
            .select('*')
            .eq('membership_id', membership.id)
            .eq('status', 'PENDING')
            .maybeSingle()
          if (!raced) throw new HttpError(409, 'Já existe uma cobrança para esta filiação')
          assertPendingTransactionMatchesPlan(raced, selectedPlan)
          transaction = raced
        } else {
          throw new HttpError(500, 'Não foi possível criar a transação anual')
        }
      } else {
        transaction = createdTransaction
      }
    }

    const transactionMetadata = {
      user_id: user.id,
      membership_id: membership.id,
      transaction_id: transaction.id,
      transaction_type: membership.membership_type,
      ...(owner.dependentId ? { dependent_id: owner.dependentId } : {})
    }
    if (JSON.stringify(transaction.metadata || {}) !== JSON.stringify(transactionMetadata)) {
      const { error: metadataError } = await supabaseAdmin
        .from('annual_membership_transactions')
        .update({ metadata: transactionMetadata })
        .eq('id', transaction.id)
      if (metadataError) throw new HttpError(500, 'Não foi possível registrar os metadados da transação')
    }

    if (transaction.external_id) {
      const providerData = await getExistingProviderData(apiKey, transaction.external_id)
      return new Response(JSON.stringify({
        membershipId: membership.id,
        transactionId: transaction.id,
        transactionType: membership.membership_type,
        status: transaction.status,
        data: {
          ...providerData,
          id: transaction.external_id,
          membershipId: membership.id,
          transactionId: transaction.id,
          transactionType: membership.membership_type
        }
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const metadata = transactionMetadata
    const payload = {
      method: 'PIX',
      data: {
        amount: transaction.amount_cents,
        description: `${membership.membership_type === 'RENEWAL' ? 'Renovação' : 'Filiação'} anual - ${customer.name}`.substring(0, 37),
        customer: { name: customer.name, email: customer.email, taxId: customer.taxId, cellphone: customer.phone },
        metadata
      },
      metadata
    }
    const abacateResponse = await fetch('https://api.abacatepay.com/v2/transparents/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.trim()}` },
      body: JSON.stringify(payload)
    })
    const result = await abacateResponse.json()
    if (!abacateResponse.ok) throw new HttpError(abacateResponse.status, 'Erro no AbacatePay')

    const providerData = result.data || result
    const responseData = {
      ...providerData,
      ...(providerData.brCode || providerData.br_code ? { brCode: providerData.brCode || providerData.br_code } : {}),
      ...(providerData.brCodeBase64 || providerData.br_code_base64 ? { brCodeBase64: providerData.brCodeBase64 || providerData.br_code_base64 } : {})
    }
    const externalId = providerData.id
    if (typeof externalId !== 'string' || !externalId) throw new HttpError(502, 'O provedor não retornou o ID da cobrança')
    const { data: updatedTransaction, error: externalIdError } = await supabaseAdmin
      .from('annual_membership_transactions')
      .update({ external_id: externalId })
      .eq('id', transaction.id)
      .eq('status', 'PENDING')
      .select('*')
      .single()
    if (externalIdError || !updatedTransaction) throw new HttpError(500, 'Não foi possível registrar o ID da cobrança')

    return new Response(JSON.stringify({
      ...result,
      membershipId: membership.id,
      transactionId: transaction.id,
      transactionType: membership.membership_type,
      data: {
        ...responseData,
        membershipId: membership.id,
        transactionId: transaction.id,
        transactionType: membership.membership_type
      }
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 400
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[FUNCTION ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// O webhook continua sem alteração nesta fase; a confirmação manual é a fonte de ativação anual.
