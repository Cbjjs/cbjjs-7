-- Adiciona a coluna category na tabela de eventos para suportar Gi/NoGi
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Gi & NoGi';