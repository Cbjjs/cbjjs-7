import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

type SupabaseAdmin = ReturnType<typeof createClient>
type JsonObject = Record<string, unknown>

type AnnualTransaction = {
  id: string
  membership_id: string
  provider: string
  external_id: string | null
  status: string
  amount_cents: number
  plan: string | null
  metadata: unknown
  paid_at: string | null
}

type AnnualMembership = {
  id: string
  profile_id: string | null
  dependent_id: string | null
  status: string
  payment_status: string
  valid_from: string | null
  valid_until: string | null
  activated_at: string | null
}

const jsonResponse = (body: JsonObject, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})

const isObject = (value: unknown): value is JsonObject => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const base64FromBytes = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const constantTimeStringEqual = (expected: string, received: string) => {
  const length = Math.max(expected.length, received.length)
  let difference = expected.length ^ received.length
  for (let index = 0; index < length; index += 1) {
    difference |= (expected.charCodeAt(index) || 0) ^ (received.charCodeAt(index) || 0)
  }
  return difference === 0
}

const isValidSignature = async (body: string, receivedSignature: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return constantTimeStringEqual(base64FromBytes(new Uint8Array(digest)), receivedSignature)
}

const addOneYear = (date: Date) => {
  const year = date.getUTCFullYear() + 1
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  const next = new Date(Date.UTC(year, month, day))
  if (next.getUTCMonth() !== month) return new Date(Date.UTC(year, month + 1, 0))
  return next
}

const dateOnly = (date: Date) => date.toISOString().slice(0, 10)

const getMetadata = (payload: JsonObject): JsonObject => {
  const rootMetadata = isObject(payload.metadata) ? payload.metadata : null
  const nestedMetadata = isObject((payload.data as JsonObject | undefined)?.metadata)
    ? (payload.data as JsonObject).metadata as JsonObject
    : null
  if (rootMetadata && Object.keys(rootMetadata).length > 0) return rootMetadata
  if (nestedMetadata) return nestedMetadata
  return rootMetadata || {}
}

const getProviderId = (payload: JsonObject) => {
  const data = isObject(payload.data) ? payload.data : null
  const providerId = data?.id ?? payload.id
  if (typeof providerId !== 'string' || !providerId.trim()) throw new HttpError(400, 'ID da cobrança não fornecido')
  return providerId
}

const getStatus = (payload: JsonObject) => {
  const data = isObject(payload.data) ? payload.data : null
  return data?.status ?? payload.status
}

const getAmount = (payload: JsonObject) => {
  const data = isObject(payload.data) ? payload.data : null
  if (data && Object.prototype.hasOwnProperty.call(data, 'amount')) return data.amount
  if (Object.prototype.hasOwnProperty.call(payload, 'amount')) return payload.amount
  return undefined
}

const assertAmountMatches = (payload: JsonObject, amountCents: number) => {
  const receivedAmount = getAmount(payload)
  if (receivedAmount === undefined || receivedAmount === null) return
  const parsedAmount = typeof receivedAmount === 'number'
    ? receivedAmount
    : typeof receivedAmount === 'string' && receivedAmount.trim() ? Number(receivedAmount) : Number.NaN
  if (!Number.isInteger(parsedAmount) || parsedAmount !== Number(amountCents)) {
    throw new HttpError(409, 'Valor da cobrança não confere')
  }
}

const getAdminClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) throw new HttpError(500, 'Configuração do servidor indisponível')
  return createClient(supabaseUrl, serviceRoleKey)
}

const loadAnnualTransaction = async (supabaseAdmin: SupabaseAdmin, transactionId: string) => {
  const { data, error } = await supabaseAdmin
    .from('annual_membership_transactions')
    .select('id, membership_id, provider, external_id, status, amount_cents, plan, metadata, paid_at')
    .eq('id', transactionId)
    .maybeSingle()
  if (error) throw new HttpError(500, 'Não foi possível consultar a transação anual')
  if (!data) throw new HttpError(404, 'Transação anual não encontrada')
  return data as AnnualTransaction
}

const loadAnnualMembership = async (supabaseAdmin: SupabaseAdmin, membershipId: string) => {
  const { data, error } = await supabaseAdmin
    .from('annual_memberships')
    .select('id, profile_id, dependent_id, status, payment_status, valid_from, valid_until, activated_at')
    .eq('id', membershipId)
    .maybeSingle()
  if (error) throw new HttpError(500, 'Não foi possível consultar a filiação anual')
  if (!data) throw new HttpError(404, 'Filiação anual não encontrada')
  return data as AnnualMembership
}

const ensureTransactionProviderId = async (
  supabaseAdmin: SupabaseAdmin,
  transaction: AnnualTransaction,
  providerId: string
) => {
  if (transaction.external_id && transaction.external_id !== providerId) {
    throw new HttpError(409, 'A cobrança não corresponde à transação')
  }
  if (transaction.external_id) return transaction

  const { error } = await supabaseAdmin
    .from('annual_membership_transactions')
    .update({ external_id: providerId })
    .eq('id', transaction.id)
    .is('external_id', null)
  if (error) throw new HttpError(500, 'Não foi possível registrar a cobrança')

  const refreshed = await loadAnnualTransaction(supabaseAdmin, transaction.id)
  if (refreshed.external_id !== providerId) throw new HttpError(409, 'A cobrança não corresponde à transação')
  return refreshed
}

const markAnnualTransactionPaid = async (supabaseAdmin: SupabaseAdmin, transaction: AnnualTransaction) => {
  if (transaction.status === 'PAID') {
    if (transaction.paid_at) return transaction
    const paidAt = new Date().toISOString()
    const { error } = await supabaseAdmin
      .from('annual_membership_transactions')
      .update({ paid_at: paidAt })
      .eq('id', transaction.id)
      .eq('status', 'PAID')
      .is('paid_at', null)
    if (error) throw new HttpError(500, 'Não foi possível completar a confirmação da transação')
    return loadAnnualTransaction(supabaseAdmin, transaction.id)
  }

  if (transaction.status !== 'PENDING') throw new HttpError(409, 'A transação não está disponível para confirmação')
  const paidAt = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('annual_membership_transactions')
    .update({ status: 'PAID', paid_at: paidAt })
    .eq('id', transaction.id)
    .eq('status', 'PENDING')
    .select('id, membership_id, provider, external_id, status, amount_cents, plan, metadata, paid_at')
    .maybeSingle()
  if (error) throw new HttpError(500, 'Não foi possível confirmar a transação anual')
  if (data) return data as AnnualTransaction

  const refreshed = await loadAnnualTransaction(supabaseAdmin, transaction.id)
  if (refreshed.status !== 'PAID') throw new HttpError(409, 'A transação não está disponível para confirmação')
  return refreshed
}

const activateAnnualMembership = async (
  supabaseAdmin: SupabaseAdmin,
  membership: AnnualMembership,
  paidAt: string
) => {
  if (membership.payment_status === 'EXEMPT') throw new HttpError(409, 'A filiação isenta não pode ser marcada como paga')
  if (membership.status === 'CANCELLED' || membership.payment_status === 'CANCELLED') {
    throw new HttpError(409, 'A filiação cancelada não pode ser reativada')
  }

  const alreadyActivated = membership.status === 'ACTIVE' && membership.payment_status === 'PAID'
    && membership.valid_from && membership.valid_until
  const confirmationDate = new Date(paidAt)
  if (Number.isNaN(confirmationDate.getTime())) throw new HttpError(500, 'Data de confirmação inválida')
  const validFrom = alreadyActivated ? membership.valid_from as string : dateOnly(confirmationDate)
  const validUntil = alreadyActivated ? membership.valid_until as string : dateOnly(addOneYear(confirmationDate))
  const activatedAt = alreadyActivated ? membership.activated_at || paidAt : paidAt

  const { data, error } = await supabaseAdmin
    .from('annual_memberships')
    .update({
      status: 'ACTIVE',
      payment_status: 'PAID',
      valid_from: validFrom,
      valid_until: validUntil,
      activated_at: activatedAt
    })
    .eq('id', membership.id)
    .in('status', ['PENDING', 'ACTIVE', 'EXPIRED'])
    .neq('payment_status', 'EXEMPT')
    .select('id, profile_id, dependent_id, status, payment_status, valid_from, valid_until, activated_at')
    .maybeSingle()
  if (error) throw new HttpError(500, 'Não foi possível ativar a filiação anual')
  if (data) return data as AnnualMembership

  const refreshed = await loadAnnualMembership(supabaseAdmin, membership.id)
  if (refreshed.payment_status === 'EXEMPT' || refreshed.status === 'CANCELLED' || refreshed.payment_status === 'CANCELLED') {
    throw new HttpError(409, 'A filiação não pode ser reativada')
  }
  if (refreshed.status !== 'ACTIVE' || refreshed.payment_status !== 'PAID') {
    throw new HttpError(500, 'Não foi possível ativar a filiação anual')
  }
  return refreshed
}

const updateAnnualLegacyOwner = async (
  supabaseAdmin: SupabaseAdmin,
  membership: AnnualMembership,
  transaction: AnnualTransaction,
  providerId: string,
  paidAt: string,
  metadata: JsonObject
) => {
  const legacyPlan = transaction.plan === 'DIGITAL' || transaction.plan === 'PRINTED'
    ? transaction.plan
    : metadata.plan_type === 'DIGITAL' || metadata.plan_type === 'PRINTED'
      ? metadata.plan_type
      : Number(transaction.amount_cents) === 3000 ? 'DIGITAL' : 'PRINTED'

  if (membership.profile_id) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        payment_status: 'PAID',
        payment_confirmed_at: paidAt,
        payment_plan: legacyPlan,
        current_billing_id: providerId
      })
      .eq('id', membership.profile_id)
      .select('id')
      .maybeSingle()
    if (error) throw new HttpError(500, 'Não foi possível atualizar o perfil')
    if (!data) throw new HttpError(404, 'Perfil da filiação não encontrado')
    return
  }

  if (membership.dependent_id) {
    const { data, error } = await supabaseAdmin
      .from('dependents')
      .update({
        payment_status: 'PAID',
        payment_confirmed_at: paidAt,
        payment_plan: legacyPlan
      })
      .eq('id', membership.dependent_id)
      .select('id')
      .maybeSingle()
    if (error) throw new HttpError(500, 'Não foi possível atualizar o dependente')
    if (!data) throw new HttpError(404, 'Dependente da filiação não encontrado')
    return
  }

  throw new HttpError(500, 'A filiação anual não possui titular válido')
}

const ensureAnnualSnapshot = async (supabaseAdmin: SupabaseAdmin, membershipId: string) => {
  const { data, error } = await supabaseAdmin
    .from('annual_membership_snapshots')
    .select('id')
    .eq('membership_id', membershipId)
    .limit(1)
  if (error) throw new HttpError(500, 'Não foi possível verificar o snapshot anual')
  if (data && data.length > 0) return

  const { error: snapshotError } = await supabaseAdmin.rpc('generate_annual_membership_snapshot', {
    p_membership_id: membershipId
  })
  if (snapshotError) throw new HttpError(500, 'Não foi possível gerar o snapshot anual')
}

const processAnnualPayment = async (
  supabaseAdmin: SupabaseAdmin,
  payload: JsonObject,
  metadata: JsonObject,
  providerId: string
) => {
  const membershipId = metadata.membership_id
  const transactionId = metadata.transaction_id
  if (!isUuid(membershipId) || !isUuid(transactionId)) {
    throw new HttpError(422, 'Metadados da filiação anual incompletos')
  }

  let transaction = await loadAnnualTransaction(supabaseAdmin, transactionId)
  if (transaction.provider !== 'ABACATEPAY') throw new HttpError(409, 'Provedor da transação não confere')
  if (transaction.membership_id !== membershipId) throw new HttpError(409, 'A filiação não corresponde à transação')
  const storedMetadata = isObject(transaction.metadata) ? transaction.metadata : {}
  if (storedMetadata.membership_id !== undefined && storedMetadata.membership_id !== membershipId) {
    throw new HttpError(409, 'Os metadados da transação não conferem')
  }
  if (storedMetadata.transaction_id !== undefined && storedMetadata.transaction_id !== transactionId) {
    throw new HttpError(409, 'Os metadados da transação não conferem')
  }
  assertAmountMatches(payload, transaction.amount_cents)

  let membership = await loadAnnualMembership(supabaseAdmin, membershipId)
  if (membership.payment_status === 'EXEMPT') throw new HttpError(409, 'A filiação isenta não pode ser marcada como paga')
  if (membership.status === 'CANCELLED' || membership.payment_status === 'CANCELLED') {
    throw new HttpError(409, 'A filiação cancelada não pode ser reativada')
  }
  if (transaction.status === 'REFUNDED' || transaction.status === 'CANCELLED') {
    throw new HttpError(409, 'A transação não pode ser confirmada')
  }

  transaction = await ensureTransactionProviderId(supabaseAdmin, transaction, providerId)
  transaction = await markAnnualTransactionPaid(supabaseAdmin, transaction)
  const paidAt = transaction.paid_at || new Date().toISOString()
  membership = await activateAnnualMembership(supabaseAdmin, membership, paidAt)
  await updateAnnualLegacyOwner(supabaseAdmin, membership, transaction, providerId, paidAt, metadata)
  await ensureAnnualSnapshot(supabaseAdmin, membership.id)

  return {
    message: 'OK',
    status: 'PAID',
    membershipId: membership.id,
    transactionId: transaction.id,
    validFrom: membership.valid_from,
    validUntil: membership.valid_until
  }
}

const generateAcademyFederationIdIfMissing = async (supabaseAdmin: SupabaseAdmin, academyId: string) => {
  const { data: academy, error: academyError } = await supabaseAdmin
    .from('academies')
    .select('id, federation_id')
    .eq('id', academyId)
    .maybeSingle()
  if (academyError) throw new HttpError(500, 'Não foi possível consultar a academia')
  if (!academy || academy.federation_id) return

  const { data: academies, error: academiesError } = await supabaseAdmin
    .from('academies')
    .select('federation_id')
    .not('federation_id', 'is', null)
  if (academiesError) throw new HttpError(500, 'Não foi possível consultar os registros das academias')

  const numbers = (academies || [])
    .map((item: { federation_id: string | null }) => {
      if (!item.federation_id) return 0
      if (/^\d+$/.test(item.federation_id)) return Number.parseInt(item.federation_id, 10)
      const match = item.federation_id.match(/CBJJS-AC-(\d+)/)
      return match ? Number.parseInt(match[1], 10) : 0
    })
    .filter((number: number) => number > 0)
  const nextNumber = numbers.length > 0 ? Math.max(1000, Math.max(...numbers) + 1) : 1000
  const { error: updateError } = await supabaseAdmin
    .from('academies')
    .update({ federation_id: String(nextNumber).padStart(4, '0') })
    .eq('id', academyId)
    .is('federation_id', null)
  if (updateError) throw new HttpError(500, 'Não foi possível registrar a academia')
}

const processCertificatePayment = async (
  supabaseAdmin: SupabaseAdmin,
  metadata: JsonObject,
  providerId: string
) => {
  const certificateId = metadata.certificate_id
  if (!isUuid(certificateId)) throw new HttpError(422, 'Metadados do certificado incompletos')

  const { data: certificate, error: certificateError } = await supabaseAdmin
    .from('academy_certificates')
    .select('id, academy_id, billing_id')
    .eq('id', certificateId)
    .maybeSingle()
  if (certificateError) throw new HttpError(500, 'Não foi possível validar o certificado')
  if (!certificate) throw new HttpError(404, 'Certificado não encontrado')
  if (certificate.billing_id && certificate.billing_id !== providerId) {
    throw new HttpError(409, 'A cobrança não corresponde ao certificado')
  }

  const { error: updateError } = await supabaseAdmin
    .from('academy_certificates')
    .update({ status_payment: 'PAID', paid_at: new Date().toISOString(), billing_id: providerId })
    .eq('id', certificateId)
  if (updateError) throw new HttpError(500, 'Não foi possível atualizar o certificado')
  await generateAcademyFederationIdIfMissing(supabaseAdmin, certificate.academy_id)
  return { message: 'OK', status: 'PAID' }
}

const processLegacyPayment = async (
  supabaseAdmin: SupabaseAdmin,
  payload: JsonObject,
  metadata: JsonObject,
  providerId: string
) => {
  const userId = metadata.user_id
  if (!isUuid(userId)) throw new HttpError(422, 'Metadados legados incompletos')
  const dependentId = metadata.dependent_id
  const plan = metadata.plan_type === 'DIGITAL' || metadata.plan_type === 'PRINTED'
    ? metadata.plan_type
    : getAmount(payload) === 3000 ? 'DIGITAL' : 'PRINTED'
  const paidAt = new Date().toISOString()

  if (dependentId !== undefined) {
    if (!isUuid(dependentId)) throw new HttpError(422, 'Dependente legado inválido')
    const { data: dependent, error: dependentError } = await supabaseAdmin
      .from('dependents')
      .select('id, parent_id')
      .eq('id', dependentId)
      .maybeSingle()
    if (dependentError) throw new HttpError(500, 'Não foi possível validar o dependente')
    if (!dependent || dependent.parent_id !== userId) throw new HttpError(422, 'Dependente legado não pertence ao usuário')
    const { error } = await supabaseAdmin
      .from('dependents')
      .update({ payment_status: 'PAID', payment_confirmed_at: paidAt, payment_plan: plan })
      .eq('id', dependentId)
    if (error) throw new HttpError(500, 'Não foi possível atualizar o dependente')
    return { message: 'OK', status: 'PAID' }
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      payment_status: 'PAID',
      payment_confirmed_at: paidAt,
      payment_plan: plan,
      current_billing_id: providerId
    })
    .eq('id', userId)
    .select('id')
    .maybeSingle()
  if (error) throw new HttpError(500, 'Não foi possível atualizar o perfil')
  if (!data) throw new HttpError(404, 'Perfil legado não encontrado')
  return { message: 'OK', status: 'PAID' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const rawBody = await req.text()
  const secret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')
  if (!secret) return jsonResponse({ error: 'Configuração do webhook indisponível' }, 500)

  const signature = req.headers.get('X-Webhook-Signature')
  if (!signature) return jsonResponse({ error: 'Assinatura ausente' }, 401)
  let signatureValid = false
  try {
    signatureValid = await isValidSignature(rawBody, signature, secret)
  } catch {
    signatureValid = false
  }
  if (!signatureValid) return jsonResponse({ error: 'Assinatura inválida' }, 401)

  try {
    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      throw new HttpError(400, 'Corpo JSON inválido')
    }
    if (!isObject(payload)) throw new HttpError(400, 'Corpo inválido')

    const status = getStatus(payload)
    if (status !== 'PAID') return jsonResponse({ message: 'Ignored' }, 200)

    const metadata = getMetadata(payload)
    const providerId = getProviderId(payload)
    const hasAnnualMetadata = metadata.membership_id !== undefined || metadata.transaction_id !== undefined
    const hasCertificateMetadata = metadata.certificate_id !== undefined
    const supabaseAdmin = getAdminClient()

    if (hasAnnualMetadata) {
      if (hasCertificateMetadata) throw new HttpError(422, 'Metadados de certificado e filiação não podem ser misturados')
      return jsonResponse(await processAnnualPayment(supabaseAdmin, payload, metadata, providerId), 200)
    }
    if (hasCertificateMetadata) return jsonResponse(await processCertificatePayment(supabaseAdmin, metadata, providerId), 200)
    return jsonResponse(await processLegacyPayment(supabaseAdmin, payload, metadata, providerId), 200)
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const message = error instanceof HttpError ? error.message : 'Erro interno no webhook'
    console.error('[abacate-webhook] Falha no processamento')
    return jsonResponse({ error: message }, status)
  }
})
