import { supabase } from '../lib/supabase';
import { User, Role, PaymentStatus } from '../types';

export const userService = {
  async getAllUsers(params: { searchTerm: string, page: number, pageSize: number }) {
    const { searchTerm, page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
        let query = supabase
          .from('profiles')
          .select('*, academies!profiles_academy_id_fkey(name)', { count: 'exact' });

        if (searchTerm) {
          query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
        }

        const { data, count, error } = await query
          .range(from, to)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map(p => ({
          id: p.id,
          fullName: p.full_name || 'Usuário Sem Nome',
          email: p.email,
          dob: p.dob || '',
          phone: p.phone, // Mapeamento do telefone adicionado
          role: p.role as Role,
          isBoardingComplete: !!p.is_boarding_complete,
          profileImage: p.profile_image_url,
          federationId: p.federation_id,
          paymentStatus: (p.payment_status as PaymentStatus) || PaymentStatus.PENDING,
          cpf: p.cpf,
          registrationDate: p.created_at,
          academy: (p as any).academies ? { name: (p as any).academies.name } : undefined
        }));

        return { data: mapped as any, total: count || 0 };
    } catch (err: any) {
        throw err;
    }
  },

  async deleteUser(userId: string) {
    // Chamada para a Edge Function que remove o usuário do Auth e do Database
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { targetUserId: userId }
    });

    if (error) throw error;
    return data;
  }
};