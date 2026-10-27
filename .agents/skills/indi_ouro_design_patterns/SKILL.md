---
name: indi-ouro-design-patterns
description: >
  Guia oficial de arquitetura, React patterns, Atomic Design e boas práticas de código
  para o INDI Ouro 2.0. Ative ao criar, alterar ou revisar qualquer componente, hook,
  formulário, relatório, modal ou serviço no projeto.
---

# Design Patterns & React Patterns — INDI Ouro 2.0

> **Leia este arquivo primeiro.** Para detalhes, siga os links em eferences/.

---

## 1. Árvore de Decisão Rápida

`
Preciso criar algo novo?
│
├── É UI repetida (card, badge, campo de info)?
│   └── → Molecule em components/shared/ (ex: InfoRow, StatCard, EmptyState)
│
├── É uma tela nova?
│   └── → Só usa hooks + components/. Sem lógica de negócio direto na page.tsx
│
├── É lógica com estado (form, loading, validação)?
│   └── → Custom hook useXxxForm() / useXxxController()
│
├── É acesso ao banco local (RxDB)?
│   └── → useLocalQuery / useLocalDocument / useLocalMutation (core)
│        → Encapsula em hook de domínio: hooks/db/<entidade>/useXxx.ts
│
├── É efeito colateral com múltiplas entidades?
│   └── → Service em lib/services/ — nunca direto no componente
│
├── É variação de regra de negócio (protocolo, tipo de evento)?
│   └── → Config object / Strategy — não if/else espalhado
│
└── É um relatório PDF novo?
    └── → Nova *.definition.ts + 1 linha em definitions/index.ts (Registry)
`

---

## 2. Camadas e Regras de Dependência

`
app/(protected)/          ← Pages: orquestram, não têm regra de negócio
    └── usa ↓
components/               ← UI pura: atoms, molecules, organisms
    └── usa ↓
hooks/db/<entidade>/      ← Hooks de domínio (useAnimals, useCreateAnimal)
    └── usa ↓
hooks/core/               ← Facade de RxDB (useLocalQuery, useLocalMutation)
    └── usa ↓
lib/services/             ← Efeitos colaterais e orquestração multi-entidade
    └── usa ↓
db/                       ← Schema, conexão e migrationStrategies do RxDB
types/                    ← Contratos TypeScript — importado por todos
utils/                    ← Funções puras (dates, formatters) — sem efeitos
`

**Regras:**
- Uma camada nunca importa de uma camada acima.
- Uma feature nunca importa o interior de outra; só o index.ts.
- db/client.ts direto no componente → PROIBIDO.

---

## 3. Atomic Design no Projeto

| Nível | Pasta | Exemplos existentes |
|---|---|---|
| Atoms | `components/ui/` | Button, Input, Select, Badge, Dialog |
| Molecules | `components/shared/` | FormRow, FormSection, EmptyState, InfoRow |
| Organisms | `components/features/<domínio>/` | AnimalCard, DosesList, ReproducaoForm |
| Templates | `components/layout/` | ShortHeader, MobileFooter |
| Pages | `app/(protected)/` | Só compõem; zero lógica de negócio |

---

## 3.1 Destino de Componentes ao Atomizar uma Tela

| Situação | Destino |
|---|---|
| Usado **só neste domínio** | `components/features/<domínio>/<subpasta>/` |
| Usado em **2+ domínios** | `components/shared/` |
| Elemento base (Button, Input…) | `components/ui/` — nunca crie novos aqui |
| Layout global fixo | `components/layout/` |

### Subpastas canônicas dentro de features/<domínio>/

```
components/features/<domínio>/
├── form/       ← Formulários e campos de entrada
├── details/    ← Cards de detalhe, InfoRows de exibição
├── lists/      ← Listas, itens de lista, accordions
├── modals/     ← Diálogos de confirmação, edição, criação
└── manage/     ← Ações de gestão (botões de ação em massa, filtros)
```

> **Se a subpasta não existir, crie-a.** O agente tem permissão explícita para criar qualquer pasta dentro de `components/features/<domínio>/` conforme necessário. Nunca deixe componentes de feature soltos na raiz.

### Exemplo: atomizando `gerenciar/page.tsx`

```
# ANTES — page monolítica de 400+ linhas
app/(protected)/gerenciar/page.tsx

# DEPOIS — page de ~40 linhas + componentes atômicos
app/(protected)/gerenciar/page.tsx          ← só orquestra
components/features/animals/
  manage/
    ├── AnimalManageHeader.tsx              ← filtros e busca
    ├── AnimalManageList.tsx                ← lista com accordion
    ├── AnimalManageEmptyState.tsx          ← estado vazio contextual
    └── AnimalManageActions.tsx             ← botões de ação
```

**Critério para extrair:**
- Aparece em 2+ lugares → `components/shared/`
- Mais de 150 linhas → divida em subcomponentes
- Mais de 6 props → revise ou use composição

---

## 4. DO / DON'T Críticos

### DO
- Use useLocalQuery / useLocalMutation / useLocalDocument para toda leitura/escrita
- Encapsule lógica de domínio em hooks/db/<entidade>/useXxx.ts
- Use FormRow + FormSection para todos os formulários
- Use @/utils/dates para toda operação com datas
- Use soft delete: _deleted: true + updated_at: Date.now()
- Use toast do sonner para todo feedback
- IDs de documentos: sempre uuid() no cliente (escrita idempotente)
- Novos relatórios: crie *.definition.ts + registre em definitions/index.ts
- Use fallback role: "member" para princípio do menor privilégio em guards de autenticação
- Sincronização e replicação de dados ativam somente após autenticação na tela Home
- Validação de tabelas de sincronização sempre via ALLOWED_TABLES

### DON'T
- getDatabase() direto em componentes ou pages
- new Date("YYYY-MM-DD") — causa recuo de 1 dia no UTC-3
- any em tipos de entidade
- Duplicar componente existente — estenda com variant ou props
- console.error sem toast.error correspondente
- Modal feito na mão (fixed inset-0) — use Dialog do shadcn/ui
- Lógica de negócio em page.tsx
- Assumir role "owner" como default em caso de cache vazio ou incerteza
- Iniciar replicação no splash screen ou na tela de login

---

## 5. Padrão de Hook de Domínio

Todo hook de domínio sempre retorna { data, loading, error, actions }.

Exemplo canônico: src/hooks/db/animals/useAnimals.ts

---

## 6. Padrão de Registry (Relatórios)

Novo relatório = 1 arquivo + 1 linha no registry.
Exemplo canônico: src/lib/pdf/definitions/reproduction.definition.ts

---

## 7. Checklist Obrigatório

- [ ] Componente tem <= 150 linhas?
- [ ] page.tsx não chama getDatabase() ou useLocalMutation diretamente?
- [ ] Toda data usa @/utils/dates?
- [ ] Toda escrita usa soft delete (_deleted: true)?
- [ ] Sem any em tipos de entidade?
- [ ] Sem cópia de componente existente?
- [ ] Modal usa Dialog do shadcn/ui?
- [ ] Estados de loading, vazio e erro cobertos?
- [ ] Funciona sem rede (offline-first)?
- [ ] Feedback usa toast do sonner?
- [ ] Fallback de autorização assume "member" e respeita o modelo Dono/Membro?

---

## 8. Referências Detalhadas

- Arquitetura e camadas: references/architecture.md
- Atomic Design e componentes: references/components.md
- Hooks core, domínio e services: references/data-hooks.md
- Formulários e validação: references/forms.md
- Offline-first, sync e datas: references/offline-sync.md
- Segurança, permissões e RLS: references/security-and-permissions.md
- Anti-patterns reais: references/anti-patterns.md

