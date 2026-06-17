import { supabase } from '../lib/supabase';
import { athleteService } from './athleteService';
import { User, RegistrationStatus, DocumentStatus, PaymentStatus } from '../types';

export interface AcademyStats {
  id: string;
  name: string;
  teamName: string;
  totalApprovedAthletes: number;
  pendingPrintCount: number;
}

export const idCardService = {
  /**
   * Busca todas as academias aprovadas e calcula quantos atletas aprovados cada uma possui,
   * além de identificar quantos ainda não tiveram a carteirinha impressa.
   */
  async getAcademiesWithStats() {
    // 1. Busca academias aprovadas
    const { data: academies, error: acError } = await supabase
      .from('academies')
      .select('id, name, team_name')
      .eq('status', RegistrationStatus.APPROVED);

    if (acError) throw acError;

    // 2. Busca todos os atletas e dependentes (apenas colunas necessárias para performance)
    // Para garantir paridade de lógica, precisamos dos campos de documentos e pagamento.
    const [resProfiles, resDependents] = await Promise.all([
      supabase.from('profiles').select('id, academy_id, is_federation_approved, is_id_card_printed, doc_identity_status, doc_profile_status, doc_medical_status, doc_belt_status, payment_status'),
      supabase.from('dependents').select('id, academy_id, is_federation_approved, is_id_card_printed, doc_identity_status, doc_profile_status, doc_medical_status, doc_belt_status, payment_status')
    ]);

    const allAthletesRaw = [
      ...(resProfiles.data || []).map(p => ({ ...p, isDependent: false })),
      ...(resDependents.data || []).map(d => ({ ...d, isDependent: true }))
    ];

    // 3. Agrupa e calcula estatísticas
    const statsMap: Record<string, { total: number, pending: number }> = {};
    
    // Inicializa o mapa com IDs de academias conhecidas
    academies.forEach(a => {
      statsMap[a.id] = { total: 0, pending: 0 };
    });

    allAthletesRaw.forEach(athlete => {
      if (!athlete.academy_id || !statsMap[athlete.academy_id]) return;

      // Aplica a mesma regra de negócio oficial do athleteService
      const isApproved = athlete.is_federation_approved || (
        athlete.doc_identity_status === DocumentStatus.APPROVED &&
        (athlete.doc_profile_status === DocumentStatus.APPROVED) &&
        athlete.doc_medical_status === DocumentStatus.APPROVED &&
        athlete.doc_belt_status === DocumentStatus.APPROVED &&
        athlete.payment_status === PaymentStatus.PAID
      );

      if (isApproved) {
        statsMap[athlete.academy_id].total++;
        if (!athlete.is_id_card_printed) {
          statsMap[athlete.academy_id].pending++;
        }
      }
    });

    return academies.map(a => ({
      id: a.id,
      name: a.name,
      teamName: a.team_name,
      totalApprovedAthletes: statsMap[a.id].total,
      pendingPrintCount: statsMap[a.id].pending
    })) as AcademyStats[];
  },

  /**
   * Busca todos os atletas aprovados de uma academia específica para a tela de impressão.
   */
  async getAcademyAthletesForPrinting(academyId: string) {
    const [resProfiles, resDependents] = await Promise.all([
      supabase.from('profiles').select('*').eq('academy_id', academyId).eq('academy_status', RegistrationStatus.APPROVED),
      supabase.from('dependents').select('*').eq('academy_id', academyId).eq('academy_status', RegistrationStatus.APPROVED)
    ]);

    const mappedProfiles = (resProfiles.data || []).map(p => athleteService.mapRawToUser(p, false));
    const mappedDependents = (resDependents.data || []).map(d => athleteService.mapRawToUser(d, true));

    const allAthletes = [...mappedProfiles, ...mappedDependents];

    // Filtra apenas os que passaram na aprovação da confederação
    const approvedAthletes = allAthletes.filter(a => 
      a.isFederationApproved || athleteService.checkAutomaticApproval(a)
    );

    return approvedAthletes.sort((a, b) => a.fullName.localeCompare(b.fullName));
  },

  /**
   * Marca um atleta individual como impresso/não impresso.
   */
  async markAsPrinted(userId: string, isDependent: boolean, status: boolean = true) {
    const table = isDependent ? 'dependents' : 'profiles';
    const { error } = await supabase
      .from(table)
      .update({ is_id_card_printed: status })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  },

  /**
   * Marca um lote de atletas como impressos.
   */
  async markBatchAsPrinted(athletes: { id: string, isDependent: boolean }[]) {
    const profileIds = athletes.filter(a => !a.isDependent).map(a => a.id);
    const dependentIds = athletes.filter(a => a.isDependent).map(a => a.id);

    const updates = [];
    if (profileIds.length > 0) {
      updates.push(supabase.from('profiles').update({ is_id_card_printed: true }).in('id', profileIds));
    }
    if (dependentIds.length > 0) {
      updates.push(supabase.from('dependents').update({ is_id_card_printed: true }).in('id', dependentIds));
    }

    await Promise.all(updates);
    return true;
  }
};