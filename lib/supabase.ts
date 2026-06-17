
import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase
const supabaseUrl = 'https://sbrswtbtcsfomnggeugr.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_X47WKoQ7J-GOHQ9p3l-D3Q_LzKtEpJA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'cbjjs-auth-token',
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'cbjjs-platform' },
    // Aumenta a resiliência de rede global do cliente
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // Garante que requisições de 're-foco' tenham prioridade
        priority: 'high'
      } as any);
    }
  },
  db: {
    schema: 'public'
  }
});
