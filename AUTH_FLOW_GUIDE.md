# Guia de Fluxo de Autenticação (Supabase + React Context)

Este guia documenta a implementação robusta de autenticação, persistência de sessão e logout limpo utilizada neste projeto.

## 1. Estrutura Principal (AuthContext.tsx)

O coração do sistema é o `AuthContext`, que gerencia o estado do usuário (`user`), o status de autenticação (`authStatus`) e o carregamento do perfil (`loadUserProfile`).

### 1.1. Inicialização e Persistência (useEffect)

O `useEffect` principal garante:
1.  Verificação inicial da sessão (`supabase.auth.getSession()`).
2.  Se houver sessão, chama `loadUserProfile` para buscar os dados do perfil no banco de dados.
3.  Monitoramento de eventos de autenticação (`onAuthStateChange`) para reagir a logins, logouts e atualizações de usuário.

### 1.2. Carregamento do Perfil (`loadUserProfile`)

Esta função é crítica, pois ela:
1.  Busca os dados do usuário na tabela `profiles` (onde o RLS é aplicado).
2.  Utiliza o `safeDbCall` para resiliência de rede e tratamento de tokens expirados.
3.  **CRÍTICO:** Se o perfil não existir (primeiro login após registro), ele cria um perfil inicial.
4.  Define `setAuthStatus('AUTHENTICATED')` e `setLoading(false)`.

### 1.3. Login (`login`)

A função de login garante que o loader não trave:
```typescript
const login = async (email: string, password: string) => {
    // ... (setLoading(true), setError(null))
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) { /* ... tratamento de erro ... */ }
    
    if (data.session && data.user) {
        // CRÍTICO: Chama loadUserProfile manualmente para garantir que o fluxo continue
        // e o loader seja desligado, sem depender do evento assíncrono SIGNED_IN.
        await loadUserProfile(data.user.id, data.user.email || '', true);
    } else {
        setLoading(false); // Desliga o loader se for confirmação de email pendente
    }
};
```

### 1.4. Logout Limpo (`logout`)

Para evitar o ciclo de re-autenticação, o logout deve ser agressivo na limpeza:
```typescript
const logout = async () => {
    setLoading(true);
    try {
      // 1. Limpa o cache do TanStack Query (essencial para evitar re-fetch de dados antigos)
      queryClient.clear();
      
      // 2. Limpa o estado local imediatamente
      setUser(null);
      setAuthStatus('UNAUTHENTICATED');
      localStorage.removeItem('cbjjs_current_page');

      // 3. Chama o signOut do Supabase
      await supabase.auth.signOut();
      
      // O App.tsx renderizará <Login /> automaticamente.
    } catch (err) {
      console.warn("SignOut falhou", err);
    } finally {
      setLoading(false);
    }
};
```

## 2. Componente App.tsx

O `App.tsx` utiliza o `authStatus` para renderizar a tela correta:

```typescript
// ... dentro de AppContent
if (authStatus === 'CHECKING' || (isAuthenticated && !user)) {
    return <LoaderScreen />;
}

if (authStatus === 'UNAUTHENTICATED') {
    return <Login />;
}

// Se autenticado e perfil carregado
return (
    <Layout>
        {renderPage()}
    </Layout>
);