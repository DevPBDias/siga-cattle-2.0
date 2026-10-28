# Modelo de segurança do INDI Ouro 2.0

## Papéis

- `owner`: acesso total às permissões do aplicativo e gerenciamento da equipe.
- `member`: acesso somente às permissões concedidas; o padrão mínimo inclui `home` e `consulta`.

O perfil é armazenado em `public.user_profiles`. O vínculo de equipe usa `owner_id`.

## RLS de `user_profiles`

A migração [20261028_auth_authorization_consistency.sql](../../../supabase/migrations/20261028_auth_authorization_consistency.sql) é a referência para as políticas:

- `SELECT`: próprio perfil, perfis cujo `owner_id` é o usuário atual ou todos os perfis quando o usuário atual é dono.
- `INSERT`: próprio perfil ou dono criando perfil da equipe.
- `UPDATE`: o dono pode administrar a equipe; o membro pode atualizar o próprio perfil, mas somente mantendo `role = 'member'`.
- `DELETE`: somente dono.

As funções `is_current_user_owner()` e `get_my_owner_id()` usam `SECURITY DEFINER` e `search_path = public` para evitar recursão nas políticas.

## Fluxo de autorização no cliente

1. `AuthProvider` resolve a sessão.
2. O RxDB local fica disponível pelo `RxDBProvider`.
3. `AccessProvider` combina perfil remoto, perfil local e cache.
4. `ReplicationProvider` sincroniza depois da autenticação e sinaliza `initialSyncReady`.
5. `WrapperAuth` libera ou redireciona a rota.

Quando o perfil remoto não estiver disponível, mantenha uma decisão já validada no cache/local; nunca transforme uma ausência remota em `owner`. Quando não houver nenhuma decisão confiável, use `member`.

## Rotas exclusivas do dono

Rotas como `/geral/evolucao` devem ter uma chave própria (`evolucao`) e uma regra explícita `role === 'owner'` em `canAccessPermission`. Não dependa apenas da chave JSON de permissões do membro, pois ela pode ser alterada manualmente.
