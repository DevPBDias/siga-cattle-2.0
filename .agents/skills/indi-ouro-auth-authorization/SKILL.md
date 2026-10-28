---
name: indi-ouro-auth-authorization
description: Autenticação, autorização, RLS, proteção de rotas e sincronização inicial do INDI Ouro 2.0. Use ao alterar login, perfis, permissões, guards, Supabase user_profiles ou o fluxo RxDB/Supabase.
metadata:
  short-description: Auth, autorização e RLS do INDI Ouro 2.0
---

# Autenticação e autorização do INDI Ouro 2.0

Use esta skill em qualquer mudança que possa alterar quem entra no sistema, quais telas aparecem ou quais dados um usuário pode ler e modificar.

## Arquitetura atual

- `AuthProvider` é a fonte do estado de sessão Supabase e mantém fallback offline em `offlineAuthCache`.
- `RxDBProvider` inicializa o banco local no layout global, inclusive enquanto o usuário está na tela de login.
- `ReplicationProvider` só configura replicações depois de existir usuário autenticado. Ele aguarda a primeira rodada, com limite de 10 segundos, antes de marcar `initialSyncReady`.
- `AccessProvider` resolve cargo e permissões usando Supabase, cache de permissões e perfil local do RxDB. Ausência ou erro deve assumir `member`, nunca `owner`.
- `WrapperAuth` bloqueia a renderização enquanto autenticação, autorização ou sincronização inicial estão pendentes. Falha de sync não pode prender a aplicação indefinidamente; o modo local deve continuar disponível.
- O caminho da rota é convertido em `PermissionKey` por `src/lib/auth/routeAccess.ts` e validado por `canAccessPermission`.

## Regras obrigatórias

1. Nunca conceda `owner` por fallback, perfil ausente, erro de rede ou cache vazio.
2. Limpe o cache de permissões ao iniciar um novo login e ao sair da conta.
3. Toda nova rota protegida precisa entrar em `APP_PERMISSIONS` ou ser explicitamente tratada em `routeAccess.ts`.
4. Esconder um botão não é proteção suficiente: a rota deve ser bloqueada pelo guard.
5. Rotas exclusivas do dono devem ser verificadas por cargo no código de autorização, além de não aparecerem no menu do membro. Exemplo atual: `evolucao` em `/geral/evolucao`.
6. A primeira sincronização pode atrasar a entrada na área protegida, mas precisa ter timeout e fallback offline.
7. Não iniciar replicação na tela de login sem usuário autenticado.
8. Depois de uma alteração remota recebida pelo RxDB, componentes que dependem de dados calculados podem atualizar ou recarregar de forma controlada; ausência de documentos recebidos não deve causar reload.

## Alterações no Supabase

Para `public.user_profiles`, a migração canônica é:

`supabase/migrations/20261028_auth_authorization_consistency.sql`

Antes de criar outra política, verifique as políticas existentes em `pg_policies`. Políticas antigas e novas permissivas podem coexistir e produzir autorização incorreta. A migração canônica remove as políticas anteriores da tabela antes de criar as regras atuais.

Validações mínimas no SQL Editor:

```sql
select id, email, role, permissions, owner_id, _deleted
from public.user_profiles
where id = auth.uid() or owner_id = auth.uid();

select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'user_profiles';
```

Não considere uma correção de frontend completa enquanto a migração RLS não tiver sido executada e os perfis reais tiverem sido verificados.

## Checklist de implementação

- [ ] O estado de sessão usa `useAuthContext`/`useAuth`, sem nova fonte paralela de login.
- [ ] A leitura local usa `useLocalQuery` ou um hook de domínio, nunca `getDatabase()` em uma page.
- [ ] O fallback de cargo é `member`.
- [ ] O estado de loading termina também em erro, offline e timeout.
- [ ] O botão e a URL têm a mesma regra de acesso.
- [ ] O membro não pode alterar seu próprio cargo ou se promover.
- [ ] A mudança foi validada com `problems` e `git diff --check`.
- [ ] Mudanças no Service Worker ou no bundle de produção foram consideradas quando o problema for específico da produção.

Para detalhes das políticas e do modelo de propriedade, leia [references/security-model.md](references/security-model.md).
