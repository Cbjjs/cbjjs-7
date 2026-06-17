-- 1. Criação dos Buckets necessários para o funcionamento do App
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', true),
  ('academy-certs', 'academy-certs', true),
  ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Segurança para 'academy-certs' (Documentos de Professores)
CREATE POLICY "Permitir upload para usuários autenticados - academy-certs" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'academy-certs');

CREATE POLICY "Permitir leitura pública - academy-certs" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'academy-certs');

-- 3. Políticas para 'documents' (RG/CNH/Atestados de Atletas)
CREATE POLICY "Permitir upload para usuários autenticados - documents" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Permitir leitura pública - documents" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'documents');

-- 4. Políticas para 'avatars' (Fotos de perfil)
CREATE POLICY "Permitir upload para usuários autenticados - avatars" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Permitir leitura pública - avatars" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'avatars');

-- 5. Políticas para 'event-banners' (Banners da Gestão de Eventos)
CREATE POLICY "Permitir upload para usuários autenticados - event-banners" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-banners');

CREATE POLICY "Permitir leitura pública - event-banners" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'event-banners');