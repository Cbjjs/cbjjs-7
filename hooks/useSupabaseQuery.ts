import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { safeDbCall } from '../utils/dbResilience';

export function useSupabaseQuery<T>(
  queryKey: any[],
  fetcher: (signal: AbortSignal) => Promise<{ data: T | null; error: any; count?: number | null }>,
  options: Partial<UseQueryOptions<{ data: T; count: number | null | undefined }, Error>> = {}
) {
  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const label = `Query_${queryKey[0]}`;
      console.log(`[QUERY] Iniciando busca: ${label}`);
      
      const result = await safeDbCall(() => fetcher(signal), { 
        label: label,
        signal 
      });
      
      if (result.error) {
        console.error(`[QUERY] Falha na busca ${label}:`, result.error.message);
        throw new Error(result.error.message || 'Erro de conexão com o servidor.');
      }
      
      console.log(`[QUERY] Sucesso na busca: ${label}`);
      return { 
        data: result.data as T, 
        count: result.count 
      };
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true, 
    retry: 1,
    placeholderData: (previousData) => previousData,
    ...options
  });
}