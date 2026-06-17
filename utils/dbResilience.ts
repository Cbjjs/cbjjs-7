import { supabase } from '../lib/supabase';

/**
 * SENTINEL v2 - Motor de Resiliência de Nível Industrial
 * Otimizado para evitar o 'Loader Infinito' em trocas de aba.
 */
export async function safeDbCall<T>(
  operation: (signal?: AbortSignal) => Promise<{ data: T | null; error: any; count?: number | null }>,
  options: { 
    retries?: number; 
    timeout?: number; 
    label?: string;
    signal?: AbortSignal;
  } = {}
) {
  const { retries = 2, timeout = 12000, label = 'Sentinel_v2', signal: externalSignal } = options;
  let lastError: any = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    // AbortController unificado
    const internalController = new AbortController();
    const timeoutId = setTimeout(() => internalController.abort(), timeout);

    // Sincronização atômica de sinais: Se o React Query ou o Timeout disparar, a rede para.
    const cleanup = () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortHandler);
    };

    const abortHandler = () => internalController.abort();
    externalSignal?.addEventListener('abort', abortHandler);

    try {
      // Execução direta.
      const response = await operation(internalController.signal);
      
      cleanup();

      if (response.error) {
          lastError = response.error;
          
          // Tratamento de Token Expirado/Inexistente (401/403)
          if (response.error.status === 401 || response.error.code === 'PGRST301') {
              console.warn(`[${label}] Sessão expirada. Tentando refresh rápido...`);
              const { error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) throw refreshError;
              continue; // Re-tentativa com nova sessão
          }

          // Backoff exponencial para erros de rede
          const delay = Math.min(Math.pow(2, attempt) * 1000, 4000);
          await new Promise(r => setTimeout(r, delay));
          continue;
      }

      return { data: response.data, count: response.count, error: null };
    } catch (err: any) {
      cleanup();
      lastError = err;

      if (err.name === 'AbortError') {
        // CRÍTICO: Se for um AbortError (cancelamento pelo TanStack Query ou timeout),
        // não devemos tentar novamente, mas sim lançar o erro para que o TanStack
        // saiba que a query foi cancelada.
        throw err; 
      }
      
      const delay = Math.min(Math.pow(2, attempt) * 1000, 4000);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Se todas as tentativas falharem, retornamos o último erro com detalhes
  const detailedError = {
      message: lastError?.message || 'Erro de comunicação persistente',
      code: lastError?.code || 'UNKNOWN',
      details: lastError?.details || 'Nenhum detalhe adicional fornecido.',
      originalError: lastError
  };
  
  return { data: null, error: detailedError, count: null };
}