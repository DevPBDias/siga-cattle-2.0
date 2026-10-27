# Offline-First, Sincronizacao e Datas — INDI Ouro 2.0

## Principio Offline-First

O app funciona 100% sem rede. RxDB armazena tudo localmente (IndexedDB/SQLite).
A sincronizacao com o servidor e secundaria e acontece em background.

**Consequencias para o codigo:**
- Toda escrita e imediata e local (sem await de rede no fluxo principal)
- IDs sao gerados no cliente com uuid() — nunca espere o servidor gerar ID
- Conflitos de sync sao resolvidos por updated_at (last-write-wins por padrao)

---

## Soft Delete

Nunca remova documentos do banco. Use soft delete:

```ts
// CORRETO
await mutate('update', {
  id: animalId,
  _deleted: true,
  updated_at: Date.now(),
});

// ERRADO — quebra sync e historico
await mutate('remove', animalId);
```

Toda query deve filtrar `_deleted != true`:

```ts
collection.find().where('_deleted').ne(true)
```

---

## IDs de Documentos

Sempre gere no cliente com uuid():

```ts
import { v4 as uuid } from 'uuid';

const doc = {
  id: uuid(),  // <- cliente gera, nunca o banco
  ...payload,
};
```

Isso garante escrita idempotente: pode-se reinserir sem conflito.

---

## Timestamps

Sempre use `Date.now()` (milissegundos Unix) — nunca strings de data para timestamps:

```ts
created_at: Date.now(),  // number
updated_at: Date.now(),  // number
```

---

## Datas de Negocio (campos como birth_date, event_date)

Para datas de negocio (campos que o usuario digita), use strings ISO "YYYY-MM-DD".

**REGRA CRITICA:** Nunca use `new Date("YYYY-MM-DD")` diretamente — causa recuo de 1 dia em UTC-3.

Use sempre os utilitarios de `@/utils/dates`:

```ts
import { parseLocalDate, formatDate, calcIdade } from '@/utils/dates';

// Converter string para Date sem perda de fuso
const date = parseLocalDate('2024-03-15');

// Formatar para exibicao
const label = formatDate('2024-03-15');  // "15/03/2024"

// Calcular idade
const idade = calcIdade('2020-01-10');  // "4 anos e 2 meses"
```

Nunca faca operacoes de data fora de `@/utils/dates`.

---

## Estados de UI Obrigatorios

Todo componente que depende de dados async deve cobrir 3 estados:

```tsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorState message={error.message} />;
if (!data || data.length === 0) return <EmptyState message="Nenhum registro encontrado." />;

return <ListaDeItens data={data} />;
```

Nunca mostre tela em branco. Use os componentes shared:
- `<LoadingSpinner />` — atoms/ui
- `<EmptyState message="..." />` — molecules/shared
- `<ErrorState message="..." />` — molecules/shared

---

## Sincronização com Backend (Ciclo de Vida Oficial)

A sincronização é orquestrada por `src/providers/ReplicationProvider.tsx` e `src/lib/sync/`:

1. **Abertura / Splash Screen (2.8s):**
   - Nenhuma sincronização é iniciada. O app apenas exibe a marca e vai para `/login` (ou `/home` se já autenticado).
2. **Tela de Login:**
   - Nenhuma sincronização roda antes da confirmação da sessão de login.
3. **Tela Home (Pós-login):**
   - Ao entrar na Home com sessão válida, o `ReplicationProvider` dispara a replicação do RxDB.
4. **Indicador de Status (`SyncStatusIndicator.tsx`):**
   - Localizado no topo direito da tela Home.
   - Exibe em tempo real: Sincronizando (spinner azul), Sincronizado (check verde), Offline (wifi-off amarelo) ou Erro.
   - **Interatividade:** O usuário pode clicar no indicador para disparar sincronização manual (`triggerSync()`) e receber feedback via toast do `sonner`.
5. **Realtime com Debounce (`src/lib/sync/realtimeSync.ts`):**
   - Assina `postgres_changes` no canal Supabase Realtime para todas as entidades.
   - Utiliza **debounce de 350ms** por tabela para evitar tempestade de requisições de pull simultâneas no dispositivo móvel quando alterações em lote ocorrem.
6. **Proteção da API:**
   - O endpoint `/api/sync` aplica estritamente a allowlist `ALLOWED_TABLES` tanto em operações de pull (GET) quanto de push (POST).

