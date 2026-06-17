import { supabase } from '../lib/supabase';
import { User, Role, DocumentStatus, PaymentStatus, RegistrationStatus, Belt } from '../types';

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
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Base das queries
    let qProfiles = supabase.from('profiles').select('*').eq('academy_status', 'APPROVED');
    let qDependents = supabase.from('dependents').select('*').eq('academy_status', 'APPROVED');

    // Filtro por Academia (Nível 2)
    if (academyId) {
      qProfiles = qProfiles.eq('academy_id', academyId);
      qDependents = qDependents.eq('academy_id', academyId);
    }

    if (searchTerm) {
      qProfiles = qProfiles.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      qDependents = qDependents.or(`full_name.ilike.%${searchTerm}%`);
    }

    const [resProfiles, resDependents] = await Promise.all([qProfiles, qDependents]);

    const { data: academies } = await supabase.from('academies').select('id, name');
    const academyMap = (academies || []).reduce((acc: any, curr) => { acc[curr.id] = curr.name; return acc; }, {});

    const mappedAtletas = (resProfiles.data || []).map(p => ({
        ...this.mapRawToUser(p, false),
        academy: { status: RegistrationStatus.APPROVED, name: academyMap[p.academy_id] || 'Não informada' }
    }));

    const mappedDependents = (resDependents.data || []).map(d => ({
        ...this.mapRawToUser(d, true),
        academy: { status: RegistrationStatus.APPROVED, name: academyMap[d.academy_id] || 'Não informada' }
    }));

    const allMapped = [...mappedAtletas, ...mappedDependents];

    const filtered = allMapped.filter(athlete => {
        const isApproved = athlete.isFederationApproved || this.checkAutomaticApproval(athlete);
        return subTab === 'approvals' ? !isApproved : isApproved;
    });

    // Se estivermos em uma visão global (sem academyId), ordenamos por data de registro (ordem de chegada)
    // Caso contrário, mantemos a ordem alfabética da visão por academia
    const sorted = filtered.sort((a, b) => {
        if (!academyId) {
            const dateA = new Date(a.registrationDate || 0).getTime();
            const dateB = new Date(b.registrationDate || 0).getTime();
            return dateB - dateA; // Mais recentes primeiro (ordem de chegada)
        }
        return a.fullName.localeCompare(b.fullName);
    });

    return { data: sorted.slice(from, to + 1), total: sorted.length };
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