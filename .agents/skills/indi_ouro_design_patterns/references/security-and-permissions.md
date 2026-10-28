# Segurança, Autenticação e Permissões — INDI Ouro 2.0

## 1. Modelo de Negócio: Propriedade Única (Dono & Membros)

O INDI Ouro 2.0 opera com um modelo focado em **uma propriedade por banco**:
- **Dono (Owner):** Possui autoridade total sobre o sistema. Gerencia os perfis da equipe, convida novos funcionários, define quais telas cada um pode acessar e é o único autorizado a excluir fazendas e alterar cargos no Supabase.
- **Membro (Funcionário):** Atua como lançador/registrador de dados operacionais (pesagens, vacinas, nascimentos, etc.). Tem acesso restrito exclusivamente às telas que o Dono liberar. Nunca pode se auto-promover a `owner` nem alterar permissões.

---

## 2. Guardiões de Rota e Sincronização Inicial (`WrapperAuth.tsx`)

Como o INDI Ouro 2.0 é um PWA 100% offline-first, a proteção de rotas não depende de middleware de servidor, operando no cliente de forma resiliente:

```
Navegação para Rota Protegida (ex: /comercial ou /geral/evolucao)
  │
  └── Cliente & Offline: src/components/auth/WrapperAuth.tsx (ProtectedClient)
         ├── 1. Aguarda estado: `loading` de autenticação/autorização e `initialSyncReady` do ReplicationProvider (timeout de 10s).
         ├── 2. Sessão: Se não autenticado (!user), redireciona imediatamente para /login.
         ├── 3. Resolução de Rota: Converte URL em PermissionKey via `getPermissionForPath(pathname)`.
         ├── 4. Validação estrita via `canAccessPermission(role, permissions, key)`:
         │      ├── Fallback padrão de segurança: SEMPRE "member" (menor privilégio).
         │      ├── Rota exclusiva do Dono: `evolucao` (/geral/evolucao) exige obrigatoriamente `role === 'owner'`.
         │      └── Outras rotas: Dono tem acesso total; Membro requer chave explícita nas permissões.
         └── 5. Bloqueio: Se não autorizado (!pathAllowed), bloqueia renderização e redireciona para /consulta ou /perfil.
```

> **Atenção:** Esconder botão no menu ou rodapé (`MobileFooter.tsx`) é apenas UX. A proteção real está na camada de autorização (`routeAccess.ts` + `permissions.type.ts` + `WrapperAuth.tsx`), impedindo que membros acessem a tela mesmo digitando a URL diretamente.

---

## 3. Gestão de Membros e Senha Automática (`useInviteMember`)

Ao convidar novos membros na aba **Permissões** da tela de Perfil:
1. **Cliente Supabase Isolado:** Usa `createIsolatedAuthClient()` para chamar `signUp()` do funcionário sem deslogar a sessão do Dono no celular.
2. **Senha Inicial Automática:** Calculada por `generateUserPassword(email)`:
   - *Regra:* 3 primeiras letras do e-mail + `123` (ex: `carlos@fazenda.com` → `car123`).
   - Evita dependência de provedores de SMTP/e-mail no campo.
3. **Perfil Inicial:** Criado com `role: "member"`, `owner_id: Dono.id` e permissão padrão `{ home: true, consulta: true }`.
4. **Telas e Módulos Configuráveis:** O Dono ativa/desativa as permissões na UI via `ProfileMemberList.tsx` (baseado em `APP_PERMISSIONS`). Telas exclusivas (ex: `evolucao`) não são delegáveis a membros.

---

## 4. Cache Offline com TTL Sincronizado

Para permitir uso no pasto sem conexão à internet:
- **`offlineAuthCache.ts`:** Cache da sessão do usuário com expiração de 30 dias.
- **`permissionsCache.ts`:** Cache do cargo (`role`) e telas liberadas (`permissions`), também com TTL de **30 dias** (`cachedAt` e `expiresAt`).
- Se o cache expirar, é invalidado e limpo automaticamente na próxima leitura, forçando revalidação segura. Ao fazer novo login ou logout, os caches são limpos.

---

## 5. Proteção de API (`src/app/api/sync/route.ts`)

O endpoint `/api/sync` valida o parâmetro `table` contra um `Set` estrito de tabelas permitidas (`ALLOWED_TABLES`):
- Bloqueia consultas ou gravações em tabelas do sistema (`auth.users`, etc.) com HTTP `403 Forbidden`.

---

## 6. Políticas de RLS no Supabase

- Todas as 16+ tabelas possuem RLS habilitado.
- Funções de checagem usam `SECURITY DEFINER` e `set search_path = public` para evitar recursão infinita no PostgreSQL:
  - `public.is_current_user_owner()`
  - `public.get_my_owner_id()`
- **Tabela `user_profiles`:**
  - Migração canônica: `supabase/migrations/20261028_auth_authorization_consistency.sql`
  - Remove políticas legadas conflitantes antes de recriar as regras.
  - `SELECT`: próprio perfil, perfis cujo `owner_id` é o usuário atual ou qualquer perfil se for Dono.
  - `INSERT`: permitido ao próprio usuário ou ao Dono (para criar membros).
  - `UPDATE`: Dono altera qualquer perfil; Membro só altera dados pessoais e é proibido de se auto-promover (`role = 'member'`).
  - `DELETE`: exclusivo do Dono.
- **Tabelas Operacionais (`animals`, `farms`, etc.):**
  - Usuários autenticados podem ler e registrar dados vinculados ao seu tenant.
  - Exclusão física (`DELETE`) de fazendas é restrita ao Dono.

---

## 7. Skill Dedicada de Autenticação e Autorização

Para qualquer alteração profunda em login, RLS, sincronização inicial ou guards, consulte sempre a skill dedicada:
`indi-ouro-auth-authorization` (`.agents/skills/indi-ouro-auth-authorization/SKILL.md`).
