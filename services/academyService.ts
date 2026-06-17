import { supabase } from '../lib/supabase';
import { Academy, RegistrationStatus, DocumentStatus } from '../types';

export interface AcademyWithProfile extends Academy {
    ownerProfile?: { 
        fullName: string; 
        email: string; 
        dob: string; 
        cpf: string; 
    }
}

export const academyService = {
  // --- MÉTODOS DO PROFESSOR (USUÁRIO) ---
  
  async getMyAcademies(userId: string, signal?: AbortSignal) {
    const { data: academies, error } = await supabase
        .from('academies')
        .select('*')
        .eq('owner_id', userId)
        .eq('deleted', 'no') // Não mostra deletadas para o professor
        .order('created_at', { ascending: false })
        .abortSignal(signal!);

    if (error) throw error;

    return (academies || []).map(acc => ({
        id: acc.id, 
        name: acc.name, 
        teamName: acc.team_name, 
        ownerId: acc.owner_id,
        cnpj: acc.cnpj, 
        responsibleCpf: acc.responsible_cpf, 
        phone: acc.phone,
        address: acc.address, 
        status: acc.status as RegistrationStatus,
        deleted: acc.deleted,
        blackBeltCertificate: { 
            status: acc.doc_certificate_status || (acc.certificate_url ? DocumentStatus.PENDING : DocumentStatus.MISSING), 
            url: acc.certificate_url,
            rejectionReason: acc.doc_certificate_reason 
        },
        identityDocument: { 
            status: acc.doc_identity_status || (acc.identity_url ? DocumentStatus.PENDING : DocumentStatus.MISSING), 
            url: acc.identity_url,
            rejectionReason: acc.doc_identity_reason
        }
    })) as Academy[];
  },

  async createAcademy(userId: string, data: any) {
    const academyData = {
        owner_id: userId, 
        name: data.teamName, 
        team_name: data.teamName, 
        cnpj: data.cnpj, 
        responsible_cpf: data.responsibleCpf, 
        phone: data.phone,
        address: { 
            zip: data.zip, 
            street: data.street, 
            city: data.city, 
            state: data.state, 
            number: data.number, 
            complement: data.complement 
        },
        status: 'PENDING',
        deleted: 'no'
    };

    const { data: result, error } = await supabase.from('academies').insert(academyData).select().single();
    if (error) throw error;
    return result;
  },

  async updateAcademyData(academyId: string, data: any) {
    const updateData = {
        name: data.teamName, 
        team_name: data.teamName, 
        cnpj: data.cnpj, 
        responsible_cpf: data.responsibleCpf, 
        phone: data.phone,
        address: { 
            zip: data.zip, 
            street: data.street, 
            city: data.city, 
            state: data.state, 
            number: data.number, 
            complement: data.complement 
        }
    };

    const { error } = await supabase.from('academies').update(updateData).eq('id', academyId);
    if (error) throw error;
    return true;
  },

  // --- MÉTODOS DO ADMIN ---

  async getAdminAcademies(params: { 
    subTab: 'approvals' | 'all' | 'trash', 
    searchTerm: string, 
    page: number, 
    pageSize: number 
  }) {
    const { subTab, searchTerm, page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('academies')
        .select('*, owner_profile:profiles!owner_id(*)', { count: 'exact' });

    if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
    }

    if (subTab === 'trash') {
        query = query.eq('deleted', 'yes');
    } else {
        query = query.eq('deleted', 'no');
        
        if (subTab === 'approvals') {
            const { data: reqData } = await supabase
                .from('academy_change_requests')
                .select('academy_id')
                .eq('status', 'PENDING');
                
            const pendingIds = reqData?.map(r => r.academy_id) || [];
            
            if (pendingIds.length > 0) {
                query = query.or(`status.eq.PENDING,id.in.(${pendingIds.join(',')})`);
            } else {
                query = query.eq('status', 'PENDING');
            }
        } else {
            query = query.eq('status', 'APPROVED');
        }
    }

    const { data, count, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const academyIds = data?.map(a => a.id) || [];
    const { data: reqs } = await supabase
        .from('academy_change_requests')
        .select('*')
        .in('academy_id', academyIds)
        .eq('status', 'PENDING');

    const mapped: AcademyWithProfile[] = data?.map((a: any) => {
        const profile = Array.isArray(a.owner_profile) ? a.owner_profile[0] : a.owner_profile;
        const pending = reqs?.find(r => r.academy_id === a.id);
        
        return {
            id: a.id,
            name: a.name,
            teamName: a.team_name,
            ownerId: a.owner_id,
            cnpj: a.cnpj,
            responsibleCpf: a.responsible_cpf,
            phone: a.phone,
            status: a.status as RegistrationStatus,
            deleted: a.deleted,
            address: a.address,
            blackBeltCertificate: { 
                url: a.certificate_url, 
                status: a.doc_certificate_status || (a.certificate_url ? DocumentStatus.PENDING : DocumentStatus.MISSING),
                rejectionReason: a.doc_certificate_reason
            },
            identityDocument: { 
                url: a.identity_url, 
                status: a.doc_identity_status || (a.identity_url ? DocumentStatus.PENDING : DocumentStatus.MISSING),
                rejectionReason: a.doc_identity_reason
            },
            ownerProfile: profile ? { 
                fullName: profile.full_name, 
                email: profile.email, 
                dob: profile.dob, 
                cpf: profile.cpf 
            } : undefined,
            pendingChangeRequest: pending ? {
                id: pending.id,
                academyId: pending.academy_id,
                oldData: pending.old_data,
                newData: pending.new_data,
                status: pending.status as any,
                createdAt: pending.created_at
            } : undefined
        };
    }) || [];

    return { 
        data: mapped, 
        total: count || 0 
    };
  },

  async updateAcademyDocumentStatus(academyId: string, type: string, status: DocumentStatus, reason?: string) {
    const fieldMap: any = { 
        blackBeltCertificate: 'doc_certificate_status', 
        identityDocument: 'doc_identity_status' 
    };
    const reasonMap: any = { 
        blackBeltCertificate: 'doc_certificate_reason', 
        identityDocument: 'doc_identity_reason' 
    };
    
    const updates: any = { [fieldMap[type]]: status };
    if (reason) updates[reasonMap[type]] = reason;
    
    const { error } = await supabase.from('academies').update(updates).eq('id', academyId);
    if (error) throw error;
    return true;
  },

  async approveAcademy(academyId: string) {
    const { error } = await supabase
        .from('academies')
        .update({ status: 'APPROVED' })
        .eq('id', academyId);
    
    if (error) throw error;
    return true;
  },

  async approveAcademyUpdate(requestId: string, academyId: string, newData: any) {
    const { error: updateError } = await supabase
        .from('academies')
        .update(newData)
        .eq('id', academyId);
    
    if (updateError) throw updateError;

    const { error: reqError } = await supabase
        .from('academy_change_requests')
        .update({ status: 'APPROVED' })
        .eq('id', requestId);
    
    if (reqError) throw reqError;
    
    return true;
  },

  async deleteAcademy(academyId: string) {
    const { error } = await supabase
        .from('academies')
        .update({ deleted: 'yes' })
        .eq('id', academyId);
    
    if (error) throw error;
    return true;
  },

  async restoreAcademy(academyId: string) {
    const { error } = await supabase
        .from('academies')
        .update({ deleted: 'no' })
        .eq('id', academyId);
    
    if (error) throw error;
    return true;
  }
};