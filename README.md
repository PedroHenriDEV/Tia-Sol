# RECREA PRO
Fundação da aplicação de gestão para recreação e eventos.

## Configuração
1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/0001_foundation.sql` no SQL Editor ou via Supabase CLI.
3. Copie `.env.example` para `.env.local` e preencha URL e anon key.
4. Crie a proprietária em Authentication > Users. Não há usuário ou senha padrão no código.
5. Execute `npm run dev`.

## Validação
- `npm run lint`
- `npm run typecheck`
- `npm run build`

A conexão e o RLS exigem um projeto Supabase real configurado. Nunca use a service role no navegador.
