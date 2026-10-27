# Arquitetura de Camadas — INDI Ouro 2.0

## Diagrama de Dependências

`
app/(protected)/page.tsx
    │  Orquestra fluxo. Zero acesso direto ao DB.
    │  Importa: hooks/db, components/, utils/
    ▼
components/
    │  UI pura. Recebe props. Sem chamadas ao banco.
    │  Atoms (components/ui/)
    │  Molecules (components/shared/)  ← FormRow, InfoRow, EmptyState
    │  Organisms (feature-specific)    ← Cards, Listas, Modais
    ▼
hooks/db/<entidade>/
    │  Um hook = uma responsabilidade de domínio.
    │  Retorna sempre: { data, loading, error, actions }
    │  Exemplos: useAnimals, useCreateAnimal, useUpdateAnimal
    ▼
hooks/core/
    │  Facade de RxDB. Nunca expõe RxDB para camadas acima.
    │  useLocalQuery    → lista reativa (Observable)
    │  useLocalDocument → documento único reativo
    │  useLocalMutation → create, update, remove, bulkInsert
    ▼
lib/services/  (quando necessário)
    │  Efeitos colaterais com múltiplas coleções.
    │  Ex: criarMovimento = inativar animal + criar venda + criar movimentação
    │  Funções assíncronas puras, sem estado React.
    ▼
db/client.ts
    │  Inicialização única do RxDB.
    │  Schema, plugins, migrationStrategies.
    │  Acessado via useRxDatabase() — nunca importado diretamente.

Transversal (importado por todos):
    types/          ← Interfaces TypeScript das entidades
    utils/dates.ts  ← Toda operação com data
    utils/          ← Funções puras, sem efeitos colaterais
`

---

## Regras Absolutas

1. **Fluxo unidirecional**: app → components → hooks → services → db
2. **Nenhuma feature importa o interior de outra** — use o index.ts da feature
3. **db/client.ts só é acessado via useRxDatabase()** — nunca import direto em componente
4. **Services são funções puras** (async, sem useState) — estado fica nos hooks
5. **Types são contratos imutáveis** — mudança de tipo = revisão de todos os usos

---

## Estrutura de Pastas Recomendada (por feature complexa)

`
hooks/db/reproduction_event/
├── useReproductionEvents.ts     ← query reativa
├── useReproductionEventById.ts  ← documento único
├── useCreateReproductionEvent.ts
├── useUpdateReproductionEvent.ts
└── useDeleteReproductionEvent.ts

lib/services/
└── reproductionService.ts       ← orquestra múltiplas entidades

lib/pdf/definitions/
└── reproduction.definition.ts   ← Registry de relatórios
`

---

## Regras de Nomenclatura

| Elemento | Convenção | Exemplo |
|---|---|---|
| Arquivos de componente | PascalCase | AnimalCard.tsx |
| Hooks | camelCase com prefixo use | useCreateAnimal.ts |
| Tipos/Interfaces | PascalCase | Animal, ReproductionEvent |
| Utilitários | camelCase | dates.ts, ormatAge |
| Constantes | SCREAMING_SNAKE | AVAILABLE_REPORTS |
| Pastas de feature | kebab-case ou snake_case | eproduction_event/ |
| Textos de UI | pt-BR | "Salvar Registro" |
| Código/variáveis | Inglês | const animalState = ... |
