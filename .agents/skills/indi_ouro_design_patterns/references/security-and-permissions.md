# Segurança, Autenticação e Permissões — INDI Ouro 2.0

## 1. Modelo de Negócio: Propriedade Única (Dono & Membros)

O INDI Ouro 2.0 opera com um modelo focado em **uma propriedade por banco**:
- **Dono (Owner):** Possui autoridade total sobre o sistema. Gerencia os perfis da equipe, convida novos funcionários, define quais telas cada um pode acessar e é o único autorizado a excluir fazendas e alterar cargos no Supabase.
- **Membro (Funcionário):** Atua como lançador/registrador de dados operacionais (pesagens, vacinas, nascimentos, etc.). Tem acesso restrito exclusivamente às telas que o Dono liberar. Nunca pode se auto-promover a `owner` nem alterar permissões.

---

## 2. Guardiões de Rota (Defesa em Camadas)

A segurança opera tanto no servidor quanto no cliente, sem quebrar o modo offline:

```
Requisição de Rota Protegida (ex: /comercial)
  │
  ├── 1. Servidor (Online / Web): src/middleware.ts
  │      └── Valida sessão no Supabase via @supabase/ssr (createServerClient).
  │      └── Redireciona para /login se não houver sessão ativa.
  │      └── Libera rotas públicas (/login, /home, /api, assets, PWA).
  │
  └── 2. Cliente & Offline: src/components/auth/WrapperAuth.tsx
         └── Lê cargo e permissões via useUserAccess().
         └── Fallback padrão de segurança: SEMPRE "member" (menor privilégio).
         └── Se o membro tentar abrir rota não autorizada: redireciona para /consulta ou /perfil.
```

---

## 3. Gestão de Membros e Senha Automática (`useInviteMember`)

Ao convidar novos membros na aba **Permissões** da tela de Perfil:
1. **Cliente Supabase Isolado:** Usa `createIsolatedAuthClient()` para chamar `signUp()` do funcionário sem deslogar a sessão do Dono no celular.
2. **Senha Inicial Automática:** Calculada por `generateUserPassword(email)`:
   - *Regra:* 3 primeiras letras do e-mail + `123` (ex: `carlos@fazenda.com` → `car123`).
   - Evita dependência de provedores de SMTP/e-mail no campo.
3. **Perfil Inicial:** Criado com `role: "member"`, `owner_id: Dono.id` e permissão padrão `{ consulta: true }`.
4. **12 Telas Configuráveis:** O Dono ativa/desativa as permissões na UI via `ProfileMemberList.tsx`.

---

## 4. Cache Offline com TTL Sincronizado

Para permitir uso no pasto sem conexão à internet:
- **`offlineAuthCache.ts`:** Cache da sessão do usuário com expiração de 30 dias.
- **`permissionsCache.ts`:** Cache do cargo (`role`) e telas liberadas (`permissions`), também com TTL de **30 dias** (`cachedAt` e `expiresAt`).
- Se o cache expirar, é invalidado e limpo automaticamente na próxima leitura, forçando revalidação segura.

---

## 5. Proteção de API (`src/app/api/sync/route.ts`)

O endpoint `/api/sync` valida o parâmetro `table` contra um `Set` estrito de tabelas permitidas (`ALLOWED_TABLES`):
- Bloqueia consultas ou gravações em tabelas do sistema (`auth.users`, etc.) com HTTP `403 Forbidden`.

---

## 6. Políticas de RLS no Supabase (`supabase/rls_tenant_isolation.sql`)

- Todas as 16+ tabelas possuem RLS habilitado.
- Funções de checagem usam `SECURITY DEFINER` para evitar recursão infinita no PostgreSQL:
  - `public.is_current_user_owner()`
  - `public.get_my_owner_id()`
- **Tabela `user_profiles`:**
  - `INSERT`: permitido ao próprio usuário ou ao Dono (para criar membros).
  - `UPDATE`: Dono altera qualquer perfil; Membro só altera dados pessoais e não pode mudar `role`.
  - `DELETE`: exclusivo do Dono.
- **Tabelas Operacionais (`animals`, `farms`, etc.):**
  - Usuários autenticados podem ler e registrar dados.
  - Exclusão física (`DELETE`) de fazendas é restrita ao Dono.
