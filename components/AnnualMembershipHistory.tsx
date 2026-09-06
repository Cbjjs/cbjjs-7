import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Eye,
  History,
  Loader2,
  UserRound,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import {
  AnnualMembership,
  AnnualMembershipPaymentStatus,
  AnnualMembershipSnapshot,
  AnnualMembershipStatus,
  AnnualMembershipTransaction,
  AnnualMembershipTransactionStatus,
  AnnualMembershipType
} from '../types';
import { createSignedStorageUrl } from '../utils/storage';
import { IDCardView } from './id-card/IDCardView';

interface AnnualMembershipHistoryProps {
  className?: string;
}

type HistoryItem = {
  membership: AnnualMembership;
  personName: string;
  holderName: string;
  snapshot: AnnualMembershipSnapshot | null;
  snapshotPhotoUrl?: string;
  transaction: AnnualMembershipTransaction | null;
  transactionPlan: string | null;
};

const MEMBERSHIP_SELECT = 'id, membership_period, profile_id, dependent_id, membership_type, status, payment_status, valid_from, valid_until, activated_at, created_at, updated_at, exemption_reason, exemption_granted_by, exemption_granted_at';

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'Não informada';
  const dateValue = value.includes('T') ? value : `${value.slice(0, 10)}T00:00:00`;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Não informada';
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const formatMembershipType = (value: AnnualMembershipType): string => {
  if (value === AnnualMembershipType.RENEWAL) return 'Renovação';
  return 'Filiação inicial';
};

const formatMembershipStatus = (value: AnnualMembershipStatus): string => {
  const labels: Record<AnnualMembershipStatus, string> = {
    [AnnualMembershipStatus.ACTIVE]: 'Ativa',
    [AnnualMembershipStatus.EXPIRED]: 'Expirada',
    [AnnualMembershipStatus.PENDING]: 'Pendente',
    [AnnualMembershipStatus.CANCELLED]: 'Cancelada'
  };
  return labels[value] || 'Não informado';
};

const formatPaymentStatus = (value: AnnualMembershipPaymentStatus): string => {
  const labels: Record<AnnualMembershipPaymentStatus, string> = {
    [AnnualMembershipPaymentStatus.PAID]: 'Pago',
    [AnnualMembershipPaymentStatus.EXEMPT]: 'Isento',
    [AnnualMembershipPaymentStatus.PENDING]: 'Pendente',
    [AnnualMembershipPaymentStatus.OVERDUE]: 'Em atraso',
    [AnnualMembershipPaymentStatus.CANCELLED]: 'Cancelado'
  };
  return labels[value] || 'Não informado';
};

const formatTransactionStatus = (value: AnnualMembershipTransactionStatus): string => {
  const labels: Record<AnnualMembershipTransactionStatus, string> = {
    [AnnualMembershipTransactionStatus.PAID]: 'Pago',
    [AnnualMembershipTransactionStatus.PENDING]: 'Pendente',
    [AnnualMembershipTransactionStatus.CANCELLED]: 'Cancelado',
    [AnnualMembershipTransactionStatus.REFUNDED]: 'Estornado',
    [AnnualMembershipTransactionStatus.FAILED]: 'Falhou',
    [AnnualMembershipTransactionStatus.EXPIRED]: 'Expirado'
  };
  return labels[value] || 'Não informado';
};

const formatPlan = (plan: string | null): string => {
  if (!plan) return 'Não informado';
  if (plan === 'DIGITAL') return 'Digital';
  if (plan === 'PRINTED') return 'Impressa';
  return plan;
};

const statusClasses = (status: AnnualMembershipStatus): string => {
  if (status === AnnualMembershipStatus.ACTIVE) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  if (status === AnnualMembershipStatus.EXPIRED) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
  if (status === AnnualMembershipStatus.PENDING) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200';
};

const paymentClasses = (status: AnnualMembershipPaymentStatus): string => {
  if (status === AnnualMembershipPaymentStatus.PAID) return 'text-emerald-700 dark:text-emerald-300';
  if (status === AnnualMembershipPaymentStatus.EXEMPT) return 'text-indigo-700 dark:text-indigo-300';
  if (status === AnnualMembershipPaymentStatus.OVERDUE) return 'text-rose-700 dark:text-rose-300';
  return 'text-amber-700 dark:text-amber-300';
};

const mapMembership = (row: any): AnnualMembership => ({
  id: row.id,
  membershipPeriod: row.membership_period,
  profileId: row.profile_id,
  dependentId: row.dependent_id,
  membershipType: row.membership_type as AnnualMembershipType,
  status: row.status as AnnualMembershipStatus,
  paymentStatus: row.payment_status as AnnualMembershipPaymentStatus,
  validFrom: row.valid_from,
  validUntil: row.valid_until,
  activatedAt: row.activated_at,
  exemptionReason: row.exemption_reason,
  exemptionGrantedBy: row.exemption_granted_by,
  exemptionGrantedAt: row.exemption_granted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapSnapshot = (row: any): AnnualMembershipSnapshot => ({
  id: row.id,
  membershipId: row.membership_id,
  revision: row.revision,
  fullName: row.full_name,
  photoPath: row.photo_path,
  federationId: row.federation_id,
  dateOfBirth: row.date_of_birth,
  belt: row.belt,
  academyName: row.academy_name,
  responsibleName: row.responsible_name,
  validFrom: row.valid_from,
  validUntil: row.valid_until,
  issuedAt: row.issued_at,
  snapshotData: row.snapshot_data || {}
});

const mapTransaction = (row: any): AnnualMembershipTransaction => ({
  id: row.id,
  membershipId: row.membership_id,
  transactionType: row.transaction_type,
  provider: row.provider,
  externalId: null,
  idempotencyKey: null,
  status: row.status as AnnualMembershipTransactionStatus,
  amountCents: row.amount_cents,
  plan: row.plan,
  metadata: {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  paidAt: row.paid_at
});

const chooseTransaction = (transactions: AnnualMembershipTransaction[]): AnnualMembershipTransaction | null => {
  return [...transactions].sort((a, b) => {
    const paidDifference = Number(b.status === AnnualMembershipTransactionStatus.PAID) - Number(a.status === AnnualMembershipTransactionStatus.PAID);
    if (paidDifference !== 0) return paidDifference;
    return b.createdAt.localeCompare(a.createdAt);
  })[0] || null;
};

const getSnapshot = (snapshots: AnnualMembershipSnapshot[], membershipId: string): AnnualMembershipSnapshot | null => {
  return snapshots
    .filter(snapshot => snapshot.membershipId === membershipId)
    .sort((a, b) => b.revision - a.revision)[0] || null;
};

export const AnnualMembershipHistory: React.FC<AnnualMembershipHistoryProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const { data: queryData, isLoading, isError, refetch } = useSupabaseQuery<HistoryItem[]>(
    ['annual-membership-history', user?.id],
    async signal => {
      const dependentResult = await supabase
        .from('dependents')
        .select('id, full_name')
        .eq('parent_id', user!.id)
        .abortSignal(signal);

      if (dependentResult.error) return { data: null, error: dependentResult.error };

      const dependents = (dependentResult.data || []) as Array<{ id: string; full_name: string }>;
      const profileResult = await supabase
        .from('annual_memberships')
        .select(MEMBERSHIP_SELECT)
        .eq('profile_id', user!.id)
        .abortSignal(signal);

      if (profileResult.error) return { data: null, error: profileResult.error };

      let dependentMemberships: any[] = [];
      if (dependents.length > 0) {
        const dependentResult = await supabase
          .from('annual_memberships')
          .select(MEMBERSHIP_SELECT)
          .in('dependent_id', dependents.map(dependent => dependent.id))
          .abortSignal(signal);
        if (dependentResult.error) return { data: null, error: dependentResult.error };
        dependentMemberships = dependentResult.data || [];
      }

      const membershipRows = [...(profileResult.data || []), ...dependentMemberships];
      if (membershipRows.length === 0) return { data: [], error: null };

      const memberships = membershipRows.map(mapMembership);
      const membershipIds = memberships.map(membership => membership.id);
      const [snapshotResult, transactionResult] = await Promise.all([
        supabase
          .from('annual_membership_snapshots')
          .select('id, membership_id, revision, full_name, photo_path, federation_id, date_of_birth, belt, academy_name, responsible_name, valid_from, valid_until, issued_at, snapshot_data')
          .in('membership_id', membershipIds)
          .abortSignal(signal),
        supabase
          .from('annual_membership_transactions')
          .select('id, membership_id, transaction_type, provider, status, amount_cents, plan, created_at, updated_at, paid_at')
          .in('membership_id', membershipIds)
          .abortSignal(signal)
      ]);

      if (snapshotResult.error) return { data: null, error: snapshotResult.error };
      if (transactionResult.error) return { data: null, error: transactionResult.error };

      const snapshots = (snapshotResult.data || []).map(mapSnapshot);
      const transactions = (transactionResult.data || []).map(mapTransaction);
      const dependentNameById = new Map(dependents.map(dependent => [dependent.id, dependent.full_name]));
      const transactionByMembership = new Map<string, AnnualMembershipTransaction[]>();
      transactions.forEach(transaction => {
        const current = transactionByMembership.get(transaction.membershipId) || [];
        current.push(transaction);
        transactionByMembership.set(transaction.membershipId, current);
      });

      const items = await Promise.all(memberships.map(async membership => {
        const snapshot = getSnapshot(snapshots, membership.id);
        const membershipTransactions = transactionByMembership.get(membership.id) || [];
        const transaction = chooseTransaction(membershipTransactions);
        return {
          membership,
          personName: membership.profileId ? user!.fullName : dependentNameById.get(membership.dependentId || '') || 'Dependente',
          holderName: user!.fullName,
          snapshot,
          snapshotPhotoUrl: snapshot ? await createSignedStorageUrl(snapshot.photoPath, 'avatars') : undefined,
          transaction,
          transactionPlan: membershipTransactions.find(item => Boolean(item.plan))?.plan || transaction?.plan || null
        };
      }));

      return {
        data: items.sort((a, b) => {
          if (b.membership.membershipPeriod !== a.membership.membershipPeriod) {
            return b.membership.membershipPeriod - a.membership.membershipPeriod;
          }
          return b.membership.createdAt.localeCompare(a.membership.createdAt);
        }),
        error: null
      };
    },
    { enabled: Boolean(user?.id) }
  );

  const items = queryData?.data || [];

  if (!user) return null;

  return (
    <section className={`w-full max-w-4xl mt-12 ${className}`} aria-labelledby="annual-membership-history-title">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-cbjjs-blue/10 p-3 text-cbjjs-blue dark:bg-blue-900/30 dark:text-blue-200">
          <History size={22} aria-hidden="true" />
        </div>
        <div>
          <h2 id="annual-membership-history-title" className="text-xl font-black text-gray-900 dark:text-white">Histórico anual</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Filiações e carteirinhas de cada período, incluindo seus dependentes.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-gray-400">
          <Loader2 size={20} className="mr-2 animate-spin" aria-hidden="true" /> Carregando histórico anual...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
          <AlertCircle size={24} className="mx-auto mb-2 text-rose-600 dark:text-rose-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">Não foi possível carregar o histórico anual.</p>
          <button type="button" onClick={() => refetch()} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-800">Tentar novamente</button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <CalendarDays size={26} className="mx-auto mb-2 text-gray-400" aria-hidden="true" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nenhuma filiação anual encontrada.</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Quando houver um período registrado, ele aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const { membership, transaction } = item;
            const isExempt = membership.paymentStatus === AnnualMembershipPaymentStatus.EXEMPT;
            return (
              <article key={membership.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-gray-900 dark:text-white">Período {membership.membershipPeriod}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${statusClasses(membership.status)}`}>{formatMembershipStatus(membership.status)}</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      <UserRound size={15} aria-hidden="true" /> {membership.profileId ? `Titular: ${item.personName}` : `Dependente: ${item.personName} • Titular: ${item.holderName}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatMembershipType(membership.membershipType)}</p>
                  </div>
                  {item.snapshot ? (
                    <button type="button" onClick={() => setSelectedItem(item)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cbjjs-blue px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-cbjjs-blue focus:ring-offset-2 dark:focus:ring-offset-slate-900">
                      <Eye size={16} aria-hidden="true" /> Visualizar snapshot
                    </button>
                  ) : (
                    <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                      Snapshot indisponível
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 text-sm dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
                  <div><span className="block text-[10px] font-black uppercase tracking-wide text-gray-400">Validade</span><span className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(membership.validFrom)} a {formatDate(membership.validUntil)}</span></div>
                  <div><span className="block text-[10px] font-black uppercase tracking-wide text-gray-400">Pagamento</span><span className={`font-semibold ${paymentClasses(membership.paymentStatus)}`}>{formatPaymentStatus(membership.paymentStatus)}{isExempt ? ' • Isenção' : ''}</span></div>
                  <div><span className="block text-[10px] font-black uppercase tracking-wide text-gray-400">Plano</span><span className="font-semibold text-gray-800 dark:text-gray-200">{formatPlan(item.transactionPlan)}</span></div>
                  <div><span className="block text-[10px] font-black uppercase tracking-wide text-gray-400">Transação</span><span className="font-semibold text-gray-800 dark:text-gray-200">{transaction ? formatTransactionStatus(transaction.status) : 'Não disponível'}</span></div>
                </div>

                {!item.snapshot ? (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> Os dados históricos completos da carteirinha não estão disponíveis para este período. Os dados da filiação continuam sendo exibidos acima.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="annual-snapshot-title">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-cbjjs-blue">Snapshot imutável</p>
                <h2 id="annual-snapshot-title" className="mt-1 text-xl font-black text-gray-900 dark:text-white">Carteirinha do período {selectedItem.membership.membershipPeriod}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Dados congelados em {formatDate(selectedItem.snapshot?.issuedAt)}.</p>
              </div>
              <button type="button" onClick={() => setSelectedItem(null)} aria-label="Fechar visualização do snapshot" className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-slate-800 dark:hover:text-white"><X size={20} aria-hidden="true" /></button>
            </div>

            {selectedItem.snapshot ? (
              <div className="space-y-5">
                <IDCardView
                  fullName={selectedItem.snapshot.fullName}
                  profileImage={selectedItem.snapshotPhotoUrl}
                  federationId={selectedItem.snapshot.federationId || undefined}
                  dob={selectedItem.snapshot.dateOfBirth || ''}
                  belt={selectedItem.snapshot.belt || 'Branca'}
                  academyName={selectedItem.snapshot.academyName || 'Não informada'}
                  paymentConfirmedAt={selectedItem.snapshot.validFrom || selectedItem.snapshot.issuedAt}
                  validUntil={selectedItem.snapshot.validUntil || undefined}
                  responsavel={selectedItem.snapshot.responsibleName || undefined}
                />
                <div className="grid grid-cols-1 gap-3 rounded-2xl bg-gray-50 p-4 text-sm dark:bg-slate-800/70 sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><CreditCard size={16} aria-hidden="true" /> Matrícula: {selectedItem.snapshot.federationId ? String(selectedItem.snapshot.federationId).padStart(6, '0') : 'Não informada'}</p>
                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><CheckCircle2 size={16} aria-hidden="true" /> Validade congelada: {formatDate(selectedItem.snapshot.validFrom)} a {formatDate(selectedItem.snapshot.validUntil)}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
};
