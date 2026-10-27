# Anti-Patterns — INDI Ouro 2.0

Estes sao erros reais ou altamente provaveis no projeto. Ao encontrar qualquer um, corrija antes de adicionar codigo novo.

---

## 1. Acesso direto ao banco em componente

ERRADO:
```ts
// Em um componente React
const db = await getDatabase();
const animals = await db.animals.find().exec();
```

CORRETO:
```ts
// Use o hook de dominio
const { data: animals } = useAnimals();
```

Por que: quebra reatividade, impossibilita testes, viola arquitetura de camadas.

---

## 2. new Date("YYYY-MM-DD") em UTC-3

ERRADO:
```ts
const nascimento = new Date("2024-03-15");
// Retorna 2024-03-14 23:00:00 em UTC-3 — data errada!
```

CORRETO:
```ts
import { parseLocalDate } from '@/utils/dates';
const nascimento = parseLocalDate("2024-03-15");
```

Por que: "YYYY-MM-DD" e interpretado como UTC pelo JS, causando recuo de 1 dia em fusos negativos.

---

## 3. Hard delete em vez de soft delete

ERRADO:
```ts
await db.animals.findOne(id).remove();
```

CORRETO:
```ts
await mutate('update', { id, _deleted: true, updated_at: Date.now() });
```

Por que: hard delete quebra sincronizacao e elimina historico de auditoria.

---

## 4. Duplicar componente existente

ERRADO: Criar AnimalCard2.tsx, NewAnimalCard.tsx ou copiar JSX de outro arquivo.

CORRETO: Estender o componente com props ou variants do shadcn/ui.

Por que: gera divergencia de estilo e dupla manutencao.

---

## 5. Modal feito na mao com fixed inset-0

ERRADO:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="bg-white p-6 rounded-lg">...</div>
</div>
```

CORRETO:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Titulo</DialogTitle></DialogHeader>
    ...
  </DialogContent>
</Dialog>
```

Por que: Dialog do shadcn gerencia foco, escape key, scroll lock e acessibilidade.

---

## 6. Logica de negocio em page.tsx

ERRADO:
```tsx
// app/(protected)/animals/page.tsx
export default function AnimalsPage() {
  const db = useRxDatabase();
  const [animals, setAnimals] = useState([]);

  useEffect(() => {
    db.animals.find().exec().then(setAnimals);
  }, []);
  ...
}
```

CORRETO:
```tsx
export default function AnimalsPage() {
  const { data: animals, loading } = useAnimals();
  ...
}
```

---

## 7. any em tipos de entidade

ERRADO:
```ts
function updateAnimal(payload: any) { ... }
```

CORRETO:
```ts
function updateAnimal(payload: Partial<Animal> & { id: string }) { ... }
```

---

## 8. console.error sem feedback visual

ERRADO:
```ts
try {
  await create(data);
} catch (err) {
  console.error(err);
}
```

CORRETO:
```ts
try {
  await create(data);
} catch (err) {
  console.error(err);
  toast.error('Erro ao salvar. Tente novamente.');
}
```

---

## 9. ID gerado pelo servidor

ERRADO:
```ts
// Esperar o banco/servidor retornar o ID
const { id } = await api.createAnimal(data);
```

CORRETO:
```ts
import { v4 as uuid } from 'uuid';
const id = uuid(); // gerado no cliente
await mutate('create', { id, ...data });
```

---

## 10. Importar interior de outra feature

ERRADO:
```ts
import { calcularPeso } from '@/hooks/db/animals/internal/weightCalc';
```

CORRETO: expor via index.ts da feature, ou mover para utils/ se for puro.
