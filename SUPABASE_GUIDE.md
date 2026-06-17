
# Guia de Implementação de Banco de Dados: CBJJS (Supabase)

## 4. Storage (Buckets de Arquivos)

A aplicação requer buckets de armazenamento configurados como **PÚBLICOS** para que as URLs salvas no banco de dados funcionem corretamente.

### Buckets Necessários:
1.  **`avatars`**: Fotos de perfil dos usuários.
2.  **`documents`**: Documentos de identidade e atestados médicos.
3.  **`academy-certs`**: (CRÍTICO) Certificados de faixa preta enviados por professores.

### Configuração de Políticas de Segurança (Storage):

Para o bucket `academy-certs`, execute o SQL abaixo:

```sql
-- Garante acesso de upload para usuários logados
CREATE POLICY "Upload Academias" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'academy-certs');

-- Garante acesso de leitura para todos (visualização de documentos no Admin/Profile)
CREATE POLICY "Leitura Pública" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'academy-certs');
```

---

## 5. Row Level Security (RLS) - Academias

Para garantir que o fluxo de cadastro funcione:

```sql
-- Atleta deve conseguir ver todas as academias aprovadas para se vincular
CREATE POLICY "Visualizar Academias Aprovadas" ON public.academies
FOR SELECT USING (status = 'APPROVED');

-- Professor deve conseguir criar sua própria academia
CREATE POLICY "Inserir Academias" ON public.academies
FOR INSERT WITH CHECK (auth.uid() = owner_id);
```
