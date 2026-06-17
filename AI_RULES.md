# Regras de Desenvolvimento e Stack Tecnológica (AI Editor)

Este documento define a stack tecnológica e as regras de uso de bibliotecas para garantir a consistência e manutenibilidade do projeto.

## 1. Visão Geral da Stack Tecnológica

*   **Framework:** React (v18.x) com TypeScript.
*   **Linguagem:** TypeScript (obrigatório para todos os arquivos `.tsx`).
*   **Estilização:** Tailwind CSS (utilizado para todo o design e layout, incluindo responsividade).
*   **Gerenciamento de Estado (Servidor):** TanStack Query (via `useSupabaseQuery` hook) para todas as operações de leitura e escrita no banco de dados.
*   **Backend/Database:** Supabase (Postgres, Auth, Storage).
*   **Componentes UI:** Shadcn/ui (preferencialmente) e componentes customizados.
*   **Ícones:** Lucide-react.
*   **Navegação:** Customizada, gerenciada via `useState` e `onNavigate` no `App.tsx` e `Layout.tsx`.
*   **Resiliência de Dados:** Uso obrigatório do utilitário `safeDbCall` para todas as interações críticas com o Supabase.

## 2. Regras de Uso de Bibliotecas

| Biblioteca | Uso Principal | Regras de Implementação |
| :--- | :--- | :--- |
| **React/TypeScript** | Lógica de UI e Componentes. | Sempre utilize componentes funcionais e hooks. Mantenha a tipagem estrita. |
| **Tailwind CSS** | Estilização. | **Não** utilize CSS ou módulos CSS. Priorize classes utilitárias do Tailwind para todos os aspectos visuais. |
| **Shadcn/ui** | Componentes de UI. | Utilize os componentes pré-instalados (Button, Input, Card, etc.) para manter a consistência visual. |
| **Lucide-react** | Ícones. | Única fonte de ícones permitida. |
| **TanStack Query** | Data Fetching. | Use o hook `useSupabaseQuery` para buscar dados e gerenciar o estado do servidor (caching, refetching). |
| **Supabase** | Auth, DB, Storage. | Interaja com o Supabase através do cliente `lib/supabase.ts` e utilize `utils/dbResilience.ts` (`safeDbCall`) para operações críticas. |
| **Contexts** | Estado Global. | `AuthContext` e `ThemeContext` gerenciam o estado de sessão e tema. `ToastContext` para notificações. |
| **Estrutura de Arquivos** | Organização. | Componentes em `src/components/`, Páginas em `src/pages/`, Tipos em `types.ts`, Utilitários em `src/utils/`. |