import { supabase } from '../lib/supabase';
import { User, Role, DocumentStatus, PaymentStatus, RegistrationStatus, Belt } from '../types';
import { createSignedStorageUrl } from '../utils/storage';

/**
 * REGRA DE NEGÓCIO OFICIAL CBJJS - CENTRALIZADA
 */

export const athleteService = {
  async getAdminAthletes(params: {
    subTab: 'approvals' | 'all',
    searchTerm: string,
    page: number,
    pageSize: number,
    academyId?: string
  }) {
    const { subTab, searchTerm, page, pageSize, academyId } = params;
    const to = page * pageSize - 1;
    const approvalFilter = subTab === 'all'
      ? 'or(is_federation_approved.eq.true,and(doc_identity_status.eq.APPROVED,doc_profile_status.eq.APPROVED,doc_medical_status.eq.APPROVED,doc_belt_status.eq.APPROVED,payment_status.eq.PAID))'
      : 'or(and(is_federation_approved.eq.false,doc_identity_status.neq.APPROVED),and(is_federation_approved.eq.false,doc_profile_status.neq.APPROVED),and(is_federation_approved.eq.false,doc_medical_status.neq.APPROVED),and(is_federation_approved.eq.false,doc_belt_status.neq.APPROVED),and(is_federation_approved.eq.false,payment_status.neq.PAID))';

    let qProfiles = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('academy_status', 'APPROVED');
    let qDependents = supabase
      .from('dependents')
      .select('*', { count: 'exact' })
      .eq('academy_status', 'APPROVED');

    if (academyId) {
      qProfiles = qProfiles.eq('academy_id', academyId);
      qDependents = qDependents.eq('academy_id', academyId);
    }

    const profileFilter = searchTerm
      ? `and(${approvalFilter},or(full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%))`
      : approvalFilter;
    const dependentFilter = searchTerm
      ? `and(${approvalFilter},full_name.ilike.%${searchTerm}%)`
      : approvalFilter;
    qProfiles = qProfiles.or(profileFilter);
    qDependents = qDependents.or(dependentFilter);

    if (academyId) {
      qProfiles = qProfiles.order('full_name', { ascending: true }).range(0, to);
      qDependents = qDependents.order('full_name', { ascending: true }).range(0, to);
    } else {
      qProfiles = qProfiles.order('created_at', { ascending: false }).range(0, to);
      qDependents = qDependents.order('created_at', { ascending: false }).range(0, to);
    }

    const [resProfiles, resDependents] = await Promise.all([qProfiles, qDependents]);
    if (resProfiles.error) throw resProfiles.error;
    if (resDependents.error) throw resDependents.error;

    const academyIds = Array.from(new Set([
      ...(resProfiles.data || []).map(row => row.academy_id),
      ...(resDependents.data || []).map(row => row.academy_id)
    ].filter(Boolean)));
    const { data: academies, error: academiesError } = academyIds.length > 0
      ? await supabase.from('academies').select('id, name, federation_id').in('id', academyIds)
      : { data: [], error: null };
    if (academiesError) throw academiesError;

    const academyMap = (academies || []).reduce((acc: Record<string, { name: string; federationId?: string }>, curr) => {
      acc[curr.id] = { name: curr.name, federationId: curr.federation_id ? String(curr.federation_id) : undefined };
      return acc;
    }, {});

    const candidates = [
      ...(resProfiles.data || []).map(raw => ({ raw, user: this.mapRawToUser(raw, false) })),
      ...(resDependents.data || []).map(raw => ({ raw, user: this.mapRawToUser(raw, true) }))
    ];

    const filtered = candidates.filter(({ user }) => {
      const isApproved = user.isFederationApproved || this.checkAutomaticApproval(user);
      return subTab === 'approvals' ? !isApproved : isApproved;
    });

    const sorted = filtered.sort((a, b) => {
      if (!academyId) {
        const dateA = new Date(a.user.registrationDate || 0).getTime();
        const dateB = new Date(b.user.registrationDate || 0).getTime();
        return dateB - dateA;
      }
      return a.user.fullName.localeCompare(b.user.fullName);
    });

    const pageCandidates = sorted.slice((page - 1) * pageSize, page * pageSize);
    const data = await Promise.all(pageCandidates.map(async ({ raw, user }) => {
      user.profileImage = await createSignedStorageUrl(raw.profile_image_url, 'avatars');
      user.documents.profile.url = user.profileImage;
      user.documents.identity.url = undefined;
      user.documents.medical.url = undefined;
      user.documents.belt.url = undefined;
      return {
        ...user,
        academy: {
          status: RegistrationStatus.APPROVED,
          name: academyMap[raw.academy_id]?.name || 'Não informada',
          federationId: academyMap[raw.academy_id]?.federationId
        }
      };
    }));

    return {
      data,
      total: (resProfiles.count || 0) + (resDependents.count || 0)
    };
  },

  async getAdminAthleteDetails(userId: string, isDependent: boolean): Promise<User> {
    const table = isDependent ? 'dependents' : 'profiles';
    const { data, error } = await supabase.from(table).select('*').eq('id', userId).single();
    if (error) throw error;

    const user = await this.mapRawToUserWithSignedUrls(data, isDependent);
    const { data: academy } = data.academy_id
      ? await supabase.from('academies').select('id, name, federation_id').eq('id', data.academy_id).maybeSingle()
      : { data: null };

    return {
      ...user,
      academy: {
        status: RegistrationStatus.APPROVED,
        name: academy?.name || 'Não informada',
        federationId: academy?.federation_id ? String(academy.federation_id) : undefined
      }
    };
  },

  /**
   * Busca academias e calcula estatísticas de aprovação de atletas (Nível 1)
   */
  async getAcademiesWithAthleteStats() {
    const { data: academies, error } = await supabase
      .from('academies')
      .select('id, name, team_name')
      .eq('status', RegistrationStatus.APPROVED);

    if (error) throw error;

    const [resProfiles, resDependents] = await Promise.all([
      supabase.from('profiles').select('id, academy_id, is_federation_approved, doc_identity_status, doc_profile_status, doc_medical_status, doc_belt_status, payment_status').eq('academy_status', 'APPROVED'),
      supabase.from('dependents').select('id, academy_id, is_federation_approved, doc_identity_status, doc_profile_status, doc_medical_status, doc_belt_status, payment_status').eq('academy_status', 'APPROVED')
    ]);

    const allAthletes = [...(resProfiles.data || []), ...(resDependents.data || [])];
    const statsMap: Record<string, { total: number, pending: number }> = {};

    academies.forEach(a => statsMap[a.id] = { total: 0, pending: 0 });

    allAthletes.forEach(athlete => {
      if (!athlete.academy_id || !statsMap[athlete.academy_id]) return;

      const isApproved = athlete.is_federation_approved || (
        athlete.doc_identity_status === DocumentStatus.APPROVED &&
        athlete.doc_profile_status === DocumentStatus.APPROVED &&
        athlete.doc_medical_status === DocumentStatus.APPROVED &&
        athlete.doc_belt_status === DocumentStatus.APPROVED &&
        athlete.payment_status === PaymentStatus.PAID
      );

      statsMap[athlete.academy_id].total++;
      if (!isApproved) {
        statsMap[athlete.academy_id].pending++;
      }
    });

    return academies.map(a => ({
      ...a,
      totalAthletes: statsMap[a.id].total,
      pendingApprovalCount: statsMap[a.id].pending
    }));
  },

  checkAutomaticApproval(athlete: User): boolean {
    const docs = athlete.documents;
    const hasDocs = 
        docs.identity.status === DocumentStatus.APPROVED &&
        docs.profile?.status === DocumentStatus.APPROVED &&
        docs.medical?.status === DocumentStatus.APPROVED &&
        docs.belt?.status === DocumentStatus.APPROVED;
    
    const isPaid = athlete.paymentStatus === PaymentStatus.PAID;
    return hasDocs && isPaid;
  },

  mapRawToUser(data: any, isDependent: boolean): User {
    const dob = data.dob || data.birth_date || data.athlete_data?.dob || data.belt_history?.dob;
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email || '',
      dob: dob || '',
      role: data.role || Role.STUDENT,
      cpf: data.cpf,
      phone: data.phone, // Mapeamento do telefone adicionado
      nationality: data.nationality,
      gender: data.gender,
      isBoardingComplete: !!data.is_boarding_complete,
      profileImage: data.profile_image_url,
      address: data.address,
      federationId: data.federation_id,
      isFederationApproved: !!data.is_federation_approved,
      isDependent,
      paymentStatus: (data.payment_status as PaymentStatus) || PaymentStatus.PENDING,
      paymentPlan: data.payment_plan,
      paymentConfirmedAt: data.payment_confirmed_at,
      registrationDate: data.created_at,
      athleteData: { belt: data.belt as Belt, ...(data.belt_history || {}) },
      documents: {
        identity: { status: data.doc_identity_status || DocumentStatus.MISSING, url: data.doc_identity_url, rejectionReason: data.doc_identity_reason },
        medical: { status: data.doc_medical_status || DocumentStatus.MISSING, url: data.doc_medical_url, rejectionReason: data.doc_medical_reason },
        profile: { status: data.doc_profile_status || DocumentStatus.MISSING, url: data.profile_image_url, rejectionReason: data.doc_profile_reason },
        belt: { status: data.doc_belt_status || DocumentStatus.MISSING, url: data.doc_belt_url, rejectionReason: data.doc_belt_reason }
      }
    };
  },

  async mapRawToUserWithSignedUrls(data: any, isDependent: boolean): Promise<User> {
    const user = this.mapRawToUser(data, isDependent);
    user.profileImage = await createSignedStorageUrl(data.profile_image_url, 'avatars');
    user.documents.identity.url = await createSignedStorageUrl(data.doc_identity_url, 'documents');
    if (user.documents.medical) user.documents.medical.url = await createSignedStorageUrl(data.doc_medical_url, 'documents');
    if (user.documents.profile) user.documents.profile.url = user.profileImage;
    if (user.documents.belt) user.documents.belt.url = await createSignedStorageUrl(data.doc_belt_url, 'documents');
    return user;
  },

  async updateDocumentStatus(userId: string, isDependent: boolean, type: string, status: DocumentStatus, reason?: string) {
    const table = isDependent ? 'dependents' : 'profiles';
    const fieldMap: any = { identity: 'doc_identity_status', medical: 'doc_medical_status', profile: 'doc_profile_status', belt: 'doc_belt_status' };
    const reasonMap: any = { identity: 'doc_identity_reason', medical: 'doc_medical_reason', profile: 'doc_profile_reason', belt: 'doc_belt_reason' };
    
    const updates: any = { [fieldMap[type]]: status };
    if (reason) updates[reasonMap[type]] = reason;
    
    const { error } = await supabase.from(table).update(updates).eq('id', userId);
    if (error) throw error;

    if (status === DocumentStatus.APPROVED) {
        const { data: current } = await supabase.from(table).select('*').eq('id', userId).single();
        if (current) {
            const userObj = this.mapRawToUser(current, isDependent);
            if (this.checkAutomaticApproval(userObj)) {
                await supabase.from(table).update({ is_federation_approved: true }).eq('id', userId);
            }
        }
    }
  },

  async markAsPaid(userId: string, isDependent: boolean) {
    const table = isDependent ? 'dependents' : 'profiles';
    const { error } = await supabase.from(table).update({ payment_status: 'PAID', payment_confirmed_at: new Date().toISOString() }).eq('id', userId);
    if (error) throw error;

    const { data: current } = await supabase.from(table).select('*').eq('id', userId).single();
    if (current) {
        const userObj = this.mapRawToUser(current, isDependent);
        if (this.checkAutomaticApproval(userObj)) {
            await supabase.from(table).update({ is_federation_approved: true }).eq('id', userId);
        }
    }
  },

  async updateFederationId(userId: string, isDependent: boolean, newId: number) {
    const table = isDependent ? 'dependents' : 'profiles';
    const { error } = await supabase.from(table).update({ federation_id: newId }).eq('id', userId);
    if (error) throw error;
  },

  async approveFederation(userId: string, isDependent: boolean) {
    const table = isDependent ? 'dependents' : 'profiles';
    const { error } = await supabase.from(table).update({ is_federation_approved: true }).eq('id', userId);
    if (error) throw error;
  }
};