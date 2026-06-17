import { supabase } from '../lib/supabase';
import { User, Role, PaymentStatus, DocumentStatus, Belt, RegistrationStatus } from '../types';

export const studentService = {
  async getProfessorStudents(professorId: string) {
    const { data: academiesData, error: academiesError } = await supabase
      .from('academies')
      .select('id, name, phone')
      .eq('owner_id', professorId);

    if (academiesError) throw academiesError;
    if (!academiesData || academiesData.length === 0) {
      return { mappedStudents: [], hasAc: false };
    }

    const academyIds = academiesData.map(a => a.id);
    const academyMap = academiesData.reduce((acc: any, curr) => {
      acc[curr.id] = { name: curr.name, phone: curr.phone };
      return acc;
    }, {});

    const { data: rawStudents, error: studentsError } = await supabase
      .from('profiles')
      .select('*')
      .in('academy_id', academyIds);

    if (studentsError) throw studentsError;

    const { data: rawDependents, error: depError } = await supabase
      .from('dependents')
      .select('*')
      .in('academy_id', academyIds);

    if (depError) throw depError;

    const parentIds = Array.from(new Set((rawDependents || []).map(d => d.parent_id)));
    const parentMap: Record<string, string> = {};
    
    if (parentIds.length > 0) {
      const { data: parentsData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', parentIds);
      
      parentsData?.forEach(p => {
        parentMap[p.id] = p.full_name;
      });
    }

    const studentIds = rawStudents?.map(s => s.id) || [];
    const { data: requestsData } = await supabase
        .from('profile_change_requests')
        .select('*')
        .in('user_id', studentIds)
        .eq('status', 'PENDING');

    const requestsMap: {[key: string]: any[]} = {};
    if (requestsData) {
      requestsData.forEach((req: any) => {
        if (!requestsMap[req.user_id]) requestsMap[req.user_id] = [];
        requestsMap[req.user_id].push(req);
      });
    }

    const mappedAtletas: User[] = (rawStudents || []).map(p => ({
      id: p.id, 
      federationId: p.federation_id, 
      fullName: p.full_name, 
      email: p.email, 
      dob: p.dob, 
      phone: p.phone, // Mapeamento do telefone adicionado
      role: p.role as Role,
      isBoardingComplete: p.is_boarding_complete, 
      paymentStatus: (p.payment_status as PaymentStatus) || PaymentStatus.PENDING, 
      profileImage: p.profile_image_url,
      registrationDate: p.updated_at || p.created_at, 
      address: p.address, 
      cpf: p.cpf, 
      nationality: p.nationality,
      isDependent: false,
      athleteData: { belt: p.belt as Belt },
      documents: {
        identity: { status: (p.doc_identity_status as DocumentStatus) || DocumentStatus.MISSING, url: p.doc_identity_url },
        medical: { status: (p.doc_medical_status as DocumentStatus) || DocumentStatus.MISSING, url: p.doc_medical_url }
      },
      academy: { 
        name: academyMap[p.academy_id]?.name || 'Unidade', 
        isOwner: false, 
        status: (p.academy_status as RegistrationStatus) || RegistrationStatus.PENDING 
      },
      pendingRequests: requestsMap[p.id] || []
    }));

    const mappedDependents: User[] = (rawDependents || []).map(d => ({
      id: d.id, 
      federationId: d.federation_id, 
      fullName: d.full_name, 
      email: '', 
      dob: d.dob, 
      phone: d.phone, // Mapeamento do telefone adicionado
      role: Role.STUDENT,
      isBoardingComplete: true, 
      paymentStatus: (d.payment_status as PaymentStatus) || PaymentStatus.PENDING, 
      profileImage: d.profile_image_url,
      registrationDate: d.created_at, 
      address: d.address, 
      cpf: d.cpf, 
      nationality: d.nationality,
      isDependent: true,
      parentName: parentMap[d.parent_id] || 'Responsável Cadastrado', 
      athleteData: { belt: d.belt as Belt },
      documents: {
        identity: { status: (d.doc_identity_status as DocumentStatus) || DocumentStatus.MISSING, url: d.doc_identity_url },
        medical: { status: (d.doc_medical_status as DocumentStatus) || DocumentStatus.MISSING, url: d.doc_medical_url }
      },
      academy: { 
        name: academyMap[d.academy_id]?.name || 'Unidade', 
        isOwner: false, 
        status: (d.academy_status as RegistrationStatus) || RegistrationStatus.PENDING 
      },
      pendingRequests: []
    }));

    return { 
      mappedStudents: [...mappedAtletas, ...mappedDependents], 
      hasAc: true 
    };
  },

  async approveAcademyLink(studentId: string, isDependent: boolean) {
    const table = isDependent ? 'dependents' : 'profiles';
    const { error } = await supabase
      .from(table)
      .update({ academy_status: 'APPROVED' })
      .eq('id', studentId);
    
    if (error) throw error;
    return true;
  }
};