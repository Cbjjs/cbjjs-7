import { supabase } from '../lib/supabase';
import { 
    AcademyCertificate, 
    CertificatePaymentStatus, 
    CertificateDeliveryStatus 
} from '../types';

export const certificateService = {
    async getCertificatePrice(): Promise<number> {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'academy_certificate_price')
            .single();

        if (error) return 150.00; // Default fallback
        return parseFloat(data.value);
    },

    async requestCertificate(academyId: string, userId: string, amount: number) {
        // Busca se já existe um pedido pendente para esta academia e este usuário
        const { data: existingCert } = await supabase
            .from('academy_certificates')
            .select('id')
            .eq('academy_id', academyId)
            .eq('owner_id', userId)
            .eq('status_payment', 'PENDING')
            .maybeSingle();

        if (existingCert) {
            // Se existir, atualiza o valor e a data (upsert manual via update)
            const { data, error } = await supabase
                .from('academy_certificates')
                .update({
                    amount: amount,
                    created_at: new Date().toISOString()
                })
                .eq('id', existingCert.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        // Se não existir, cria um novo
        const { data, error } = await supabase
            .from('academy_certificates')
            .insert({
                academy_id: academyId,
                owner_id: userId,
                amount: amount,
                status_payment: 'PENDING',
                status_delivery: 'WAITING_PAYMENT'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getMyCertificates(userId: string): Promise<AcademyCertificate[]> {
        const { data, error } = await supabase
            .from('academy_certificates')
            .select('*, academy:academies(*)')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            id: item.id,
            academyId: item.academy_id,
            ownerId: item.owner_id,
            amount: item.amount,
            statusPayment: item.status_payment as CertificatePaymentStatus,
            statusDelivery: item.status_delivery as CertificateDeliveryStatus,
            billingId: item.billing_id,
            createdAt: item.created_at,
            paidAt: item.paid_at,
            academy: item.academy ? {
                id: item.academy.id,
                name: item.academy.name,
                teamName: item.academy.team_name,
                ownerId: item.academy.owner_id,
                status: item.academy.status,
                address: item.academy.address
            } : undefined
        }));
    },

    async getAllCertificates(): Promise<AcademyCertificate[]> {
        const { data, error } = await supabase
            .from('academy_certificates')
            .select('*, academy:academies(*), owner:profiles!owner_id(full_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            id: item.id,
            academyId: item.academy_id,
            ownerId: item.owner_id,
            amount: item.amount,
            statusPayment: item.status_payment as CertificatePaymentStatus,
            statusDelivery: item.status_delivery as CertificateDeliveryStatus,
            billingId: item.billing_id,
            createdAt: item.created_at,
            paidAt: item.paid_at,
            academy: item.academy ? {
                id: item.academy.id,
                name: item.academy.name,
                teamName: item.academy.team_name,
                ownerId: item.academy.owner_id,
                status: item.academy.status,
                address: item.academy.address
            } : undefined,
            owner: {
                fullName: item.owner?.full_name || 'Desconhecido'
            }
        }));
    },

    async updateDeliveryStatus(certificateId: string, status: CertificateDeliveryStatus) {
        const updateData: any = { status_delivery: status };
        
        // Se cancelar a entrega, também marcamos o pagamento como cancelado se estiver pendente
        if (status === CertificateDeliveryStatus.CANCELLED) {
            updateData.status_payment = 'CANCELLED';
        }

        const { error } = await supabase
            .from('academy_certificates')
            .update(updateData)
            .eq('id', certificateId);

        if (error) throw error;
        return true;
    }
};
