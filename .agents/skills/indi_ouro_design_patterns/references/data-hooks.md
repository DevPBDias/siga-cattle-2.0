# Hooks de Dados — INDI Ouro 2.0

## Camada Core (hooks/core/)

Esses hooks sao a unica porta de entrada para o RxDB. Nenhum componente ou hook de dominio acessa o banco diretamente.

### useLocalQuery
Lista reativa de documentos. Atualiza automaticamente via Observable do RxDB.

Uso interno nos hooks de dominio:
```ts
const { data: animals, loading, error } = useLocalQuery<Animal>(
  db.animals,
  (collection) => collection.find().where('_deleted').ne(true)
);
```

### useLocalDocument
Documento unico reativo por ID.

```ts
const { data: animal, loading } = useLocalDocument<Animal>(db.animals, animalId);
```

### useLocalMutation
Wrapper para operacoes de escrita. Retorna { mutate, loading, error }.

```ts
const { mutate, loading } = useLocalMutation<Animal>(db.animals);

// Criar
await mutate('create', { id: uuid(), ...payload, _deleted: false });

// Atualizar (sempre patch, nunca overwrite)
await mutate('update', { id, ...changes, updated_at: Date.now() });

// Soft delete
await mutate('update', { id, _deleted: true, updated_at: Date.now() });
```

---

## Camada de Dominio (hooks/db/<entidade>/)

Cada entidade tem sua propria pasta com hooks especializados por responsabilidade.

### Estrutura por entidade

```
hooks/db/animals/
├── useAnimals.ts           <- lista reativa (query)
├── useAnimalById.ts        <- documento unico
├── useCreateAnimal.ts      <- mutacao de criacao
├── useUpdateAnimal.ts      <- mutacao de atualizacao
└── useDeleteAnimal.ts      <- soft delete
```

### Contrato de retorno obrigatorio

Todo hook de dominio retorna exatamente:

```ts
return {
  data,      // T[] | T | null
  loading,   // boolean
  error,     // Error | null
  actions,   // { create, update, remove, ... }
};
```

Nunca exponha funcoes RxDB diretamente — encapsule sempre em actions.

### Exemplo canonico: useAnimals.ts

Arquivo real: src/hooks/db/animals/useAnimals.ts
Retorna lista reativa de animais nao deletados, ordenada por nome.

### Exemplo canonico: useCreateAnimal.ts

Arquivo real: src/hooks/db/animals/useCreateAnimal.ts
Gera uuid() no cliente, define _deleted: false, created_at e updated_at.
Exibe toast.success apos criacao.

---

## Services (lib/services/)

Use quando uma operacao envolve multiplas colecoes ou efeitos externos.

**Regras:**
- Sao funcoes async puras — sem useState, sem hooks React
- Recebem db como parametro (testaveis)
- O hook de dominio chama o service; o componente nunca acessa o service diretamente

```ts
// lib/services/animalService.ts
export async function transferirAnimal(db, animalId, novoProprietario) {
  await db.animals.findOne(animalId).update({
    set: { owner: novoProprietario, updated_at: Date.now() }
  });
  await db.movements.insert({
    id: uuid(),
    animal_id: animalId,
    type: 'transfer',
    to: novoProprietario,
    created_at: Date.now(),
    _deleted: false,
  });
}
```
