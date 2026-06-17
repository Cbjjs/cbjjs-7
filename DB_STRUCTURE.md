# Estrutura Oficial do Banco de Dados (Espelho)

Este arquivo reflete a estrutura exata que o código espera encontrar no Supabase. Qualquer alteração no código que exija novos campos deve ser precedida pela atualização deste arquivo e envio do SQL correspondente ao usuário.

## 1. Tipos Enumerados (Enums)
- `registration_status`: `PENDING`, `APPROVED`, `REJECTED`
- `document_status`: `MISSING`, `PENDING`, `APPROVED`, `REJECTED`
- `payment_status`: `PENDING`, `PAID`, `OVERDUE`
- `user_role`: `STUDENT`, `PROFESSOR`, `ADMIN`

## 2. Perfis de Usuários (`public.profiles`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Referência a auth.users |
| `federation_id` | serial | ID sequencial de federado (ex: 00001) |
| `full_name` | text | Nome completo |
| `email` | text | Email de contato |
| `dob` | date | Data de nascimento |
| `role` | user_role | Papel no sistema |
| `is_boarding_complete`| boolean | Status do onboarding |
| `profile_image_url` | text | URL da foto no storage |
| `nationality` | text | Nacionalidade |
| `cpf` | text | CPF formatado |
| `gender` | text | Gênero |
| `payment_status` | payment_status | Status da anuidade |
| `theme` | text | Preferência de tema (light/dark) |
| `address` | jsonb | {zip, street, city, state, number, complement} |
| `belt` | text | Faixa atual |
| `belt_history` | jsonb | Datas de cada graduação |
| `doc_identity_status` | document_status | Status do RG/CNH |
| `doc_identity_url` | text | Link do arquivo |
| `doc_medical_status` | document_status | Status do Atestado |
| `doc_medical_url` | text | Link do arquivo |
| `academy_id` | uuid | Vínculo com a academia (FK) |
| `academy_status` | registration_status| Status da aprovação pelo professor |

## 3. Academias (`public.academies`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | uuid (PK) | ID único |
| `owner_id` | uuid | Referência ao professor (auth.users) |
| `name` | text | Nome da unidade |
| `team_name` | text | Nome da equipe/bandeira |
| `cnpj` | text | CNPJ (opcional) |
| `responsible_cpf` | text | CPF do professor |
| `phone` | text | Telefone de contato |
| `address` | jsonb | Endereço completo |
| `certificate_url` | text | Diploma de Faixa Preta |
| `identity_url` | text | Documento do professor |
| `status` | registration_status| Status de aprovação pela CBJJS |

## 4. Eventos (`public.events`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | uuid (PK) | ID único |
| `name` | text | Título do campeonato |
| `date_display` | text | Ex: "24 e 25" |
| `month_display` | text | Ex: "JANEIRO" |
| `location` | text | Local do evento |
| `registration_link` | text | Link externo (SouCompetidor) |
| `image_url` | text | Banner do evento |
| `category` | text | Modalidade (Gi, NoGi ou Gi & NoGi) |

## 5. Solicitações (`public.profile_change_requests`)
Gerencia pedidos de troca de faixa que dependem de aprovação do professor ou admin.

## 6. Configurações (`public.system_settings`)
| Chave | Valor | Uso |
| :--- | :--- | :--- |
| `registration_fee` | 120,00 | Valor cobrado no onboarding |
| `login_banner_text` | ... | Frase de impacto na tela inicial |