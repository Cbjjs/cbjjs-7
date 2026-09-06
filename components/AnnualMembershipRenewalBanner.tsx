import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import {
  AnnualMembership,
  AnnualMembershipPaymentStatus,
  AnnualMembershipStatus,
  AnnualMembershipType
} from '../types';

interface AnnualMembershipRenewalBannerProps {
  onNavigate?: (page: string) => void;
}

type MembershipRow = AnnualMembership & {
  ownerName: string;
};

type RenewalNotice = {
  kind: 'EXPIRING' | 'EXPIRED' | 'PENDING_PAYMENT';
  membership: MembershipRow;
  personName: string;
  navigateTo: string;
};

type DateOnly = {
  timestamp: number;
  label: string;
};

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const parseDateOnly = (value: string | null): DateOnly | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    timestamp,
    label: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(parsed)
  };
};

const getTodayUtc = (): number => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};

const mapMembership = (row: any, ownerName: string): MembershipRow => ({
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
  updatedAt: row.updated_at,
  ownerName
});

const ownerKey = (membership: AnnualMembership): string =>
  membership.profileId ? `profile:${membership.profileId}` : `dependent:${membership.dependentId}`;

const hasPaidOrExemptHistory = (memberships: MembershipRow[]): boolean =>
  memberships.some(membership =>
    (membership.status === AnnualMembershipStatus.ACTIVE || membership.status === AnnualMembershipStatus.EXPIRED) &&
    (membership.paymentStatus === AnnualMembershipPaymentStatus.PAID ||
      membership.paymentStatus === AnnualMembershipPaymentStatus.EXEMPT)
  );

const getNoticeForOwner = (memberships: MembershipRow[], todayUtc: number): RenewalNotice | null => {
  if (!hasPaidOrExemptHistory(memberships)) return null;

  const ordered = [...memberships].sort((a, b) => {
    if (b.membershipPeriod !== a.membershipPeriod) return b.membershipPeriod - a.membershipPeriod;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const pendingRenewal = ordered.find(membership =>
    membership.membershipType === AnnualMembershipType.RENEWAL &&
    membership.status === AnnualMembershipStatus.PENDING &&
    (membership.paymentStatus === AnnualMembershipPaymentStatus.PENDING ||
      membership.paymentStatus === AnnualMembershipPaymentStatus.OVERDUE ||
      membership.paymentStatus === AnnualMembershipPaymentStatus.EXEMPT)
  );
  const currentMembership = ordered.find(membership =>
    membership.status === AnnualMembershipStatus.ACTIVE ||
    membership.status === AnnualMembershipStatus.EXPIRED
  );
  const membership = pendingRenewal || currentMembership;

  if (!membership) return null;

  const dateOnly = parseDateOnly(membership.validUntil);
  const isExempt = membership.paymentStatus === AnnualMembershipPaymentStatus.EXEMPT;
  const personName = membership.ownerName;
  const navigateTo = membership.dependentId ? 'my-dependents' : 'profile';

  if (pendingRenewal) {
    return { kind: isExempt ? 'EXPIRED' : 'PENDING_PAYMENT', membership, personName, navigateTo };
  }

  if (membership.status === AnnualMembershipStatus.EXPIRED || (dateOnly && dateOnly.timestamp < todayUtc)) {
    return { kind: 'EXPIRED', membership, personName, navigateTo };
  }

  if (
    membership.status === AnnualMembershipStatus.ACTIVE &&
    dateOnly &&
    dateOnly.timestamp >= todayUtc &&
    dateOnly.timestamp - todayUtc <= 30 * DAY_IN_MILLISECONDS
  ) {
    return { kind: 'EXPIRING', membership, personName, navigateTo };
  }

  return null;
};

export const AnnualMembershipRenewalBanner: React.FC<AnnualMembershipRenewalBannerProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: queryData } = useSupabaseQuery<MembershipRow[]>(
    ['annual-membership-renewal-banner', user?.id],
    async signal => {
      const { data: dependentData, error: dependentError } = await supabase
        .from('dependents')
        .select('id, full_name')
        .eq('parent_id', user!.id)
        .abortSignal(signal);

      if (dependentError) return { data: null, error: dependentError };

      const profileResult = await supabase
        .from('annual_memberships')
        .select('id, membership_period, profile_id, dependent_id, membership_type, status, payment_status, valid_from, valid_until, activated_at, created_at, updated_at, exemption_reason, exemption_granted_by, exemption_granted_at')
        .eq('profile_id', user!.id)
        .abortSignal(signal);

      if (profileResult.error) return { data: null, error: profileResult.error };

      const dependents = (dependentData || []) as Array<{ id: string; full_name: string }>;
      let dependentMemberships: any[] = [];

      if (dependents.length > 0) {
        const dependentResult = await supabase
          .from('annual_memberships')
          .select('id, membership_period, profile_id, dependent_id, membership_type, status, payment_status, valid_from, valid_until, activated_at, created_at, updated_at, exemption_reason, exemption_granted_by, exemption_granted_at')
          .in('dependent_id', dependents.map(dependent => dependent.id))
          .abortSignal(signal);

        if (dependentResult.error) return { data: null, error: dependentResult.error };
        dependentMemberships = dependentResult.data || [];
      }

      const profileMemberships = (profileResult.data || []).map(row => mapMembership(row, 'Sua filiação anual'));
      const dependentNameById = new Map(dependents.map(dependent => [dependent.id, dependent.full_name]));
      const mappedDependentMemberships = dependentMemberships.map(row =>
        mapMembership(row, dependentNameById.get(row.dependent_id) || 'Filiação do dependente')
      );

      return {
        data: [...profileMemberships, ...mappedDependentMemberships],
        error: null
      };
    },
    { enabled: Boolean(user?.id && user.isBoardingComplete) }
  );

  const notices = useMemo(() => {
    if (!queryData?.data) return [];

    const membershipsByOwner = new Map<string, MembershipRow[]>();
    queryData.data.forEach(membership => {
      const key = ownerKey(membership);
      const ownerMemberships = membershipsByOwner.get(key) || [];
      ownerMemberships.push(membership);
      membershipsByOwner.set(key, ownerMemberships);
    });

    const todayUtc = getTodayUtc();
    return Array.from(membershipsByOwner.values())
      .map(memberships => getNoticeForOwner(memberships, todayUtc))
      .filter((notice): notice is RenewalNotice => notice !== null);
  }, [queryData]);

  if (!user || !user.isBoardingComplete || isDismissed || notices.length === 0) return null;

  return (
    <section
      aria-label="Aviso sobre filiação anual"
      className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100 md:p-5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={22} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-bold">Atenção à filiação anual</h2>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Fechar aviso de filiação anual"
              className="-mr-1 -mt-1 rounded-lg p-1.5 text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {notices.map((notice, index) => {
              const dateOnly = parseDateOnly(notice.membership.validUntil);
              const isExempt = notice.membership.paymentStatus === AnnualMembershipPaymentStatus.EXEMPT;
              const daysUntilExpiration = dateOnly
                ? Math.round((dateOnly.timestamp - getTodayUtc()) / DAY_IN_MILLISECONDS)
                : null;

              return (
                <div key={notice.membership.id} className={index > 0 ? 'border-t border-amber-200 pt-3 dark:border-amber-900/70' : ''}>
                  <div className="flex items-start gap-2">
                    {notice.kind === 'EXPIRING' ? <Clock size={17} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" /> : null}
                    <div className="min-w-0 flex-1 text-sm leading-relaxed">
                      {isExempt ? (
                        <p>
                          A filiação anual de <strong>{notice.personName}</strong>{' '}
                          {notice.kind === 'EXPIRING' && daysUntilExpiration !== null
                            ? `vence em ${daysUntilExpiration === 0 ? 'hoje' : `${daysUntilExpiration} dias`}.`
                            : 'está vencida ou precisa de renovação.'}{' '}
                          A situação precisa ser renovada ou reavaliada administrativamente.
                        </p>
                      ) : notice.kind === 'PENDING_PAYMENT' ? (
                        <p>
                          A renovação anual de <strong>{notice.personName}</strong> está aguardando pagamento. Acesse a área de filiação para acompanhar o processo; não é necessário iniciar outra cobrança.
                        </p>
                      ) : notice.kind === 'EXPIRING' ? (
                        <p>
                          A filiação anual de <strong>{notice.personName}</strong> vence em{' '}
                          <strong>{daysUntilExpiration === 0 ? 'hoje' : `${daysUntilExpiration} dias`}</strong>{' '}
                          ({dateOnly?.label}). Consulte a área de filiação para se preparar para a renovação.
                        </p>
                      ) : (
                        <p>
                          A filiação anual de <strong>{notice.personName}</strong> está vencida{dateOnly ? ` desde ${dateOnly.label}` : ''} e a renovação está pendente. Consulte a área de filiação para iniciar o processo.
                        </p>
                      )}
                    </div>
                  </div>

                  {!isExempt && onNavigate ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(notice.navigateTo)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 dark:focus:ring-offset-amber-950"
                    >
                      {notice.kind === 'PENDING_PAYMENT' ? 'Acompanhar filiação' : 'Ver filiação'}
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
