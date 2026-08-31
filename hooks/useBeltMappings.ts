import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '../lib/supabase';
import { DEFAULT_BELT_MAPPINGS } from '../utils/beltFormatter';

export function useBeltMappings() {
  const query = useSupabaseQuery<Record<string, string>>(
    ['belt-display-mappings'],
    async (signal) => {
      const { data, error } = await (supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'belt_display_mappings')
        .maybeSingle() as any).abortSignal(signal);

      if (error) return { data: null, error };
      if (!data?.value) return { data: DEFAULT_BELT_MAPPINGS, error: null };

      try {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        return { data: { ...DEFAULT_BELT_MAPPINGS, ...parsed }, error: null };
      } catch (parseError) {
        console.warn('[BELT_MAPPINGS] Erro ao parsear mapeamento de faixas, usando padrão:', parseError);
        return { data: DEFAULT_BELT_MAPPINGS, error: null };
      }
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache
    }
  );

  return {
    mappings: query.data?.data || DEFAULT_BELT_MAPPINGS,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch
  };
}
