# Formularios e Validacao — INDI Ouro 2.0

## Componentes Padrao de Formulario

Todos os formularios usam FormRow e FormSection de components/shared/.
Nunca monte label+input manualmente fora desses componentes.

### FormRow

Envolve um campo com label, mensagem de erro e estado disabled/required.

```tsx
<FormRow label="Nome do Animal" required error={errors.name?.message}>
  <Input
    id="animal-name"
    {...register('name')}
    placeholder="Ex: Mimosa"
  />
</FormRow>
```

### FormSection

Agrupa FormRows com titulo de secao.

```tsx
<FormSection title="Identificacao">
  <FormRow label="Brinco" required error={errors.tag?.message}>
    <Input {...register('tag')} />
  </FormRow>
  <FormRow label="Raca" error={errors.breed?.message}>
    <Select {...register('breed')}>...</Select>
  </FormRow>
</FormSection>
```

---

## Biblioteca de Formulario

Use react-hook-form + zod para toda validacao.

### Padrao completo

```ts
// 1. Schema de validacao
const animalSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  tag: z.string().min(1, 'Brinco obrigatorio'),
  birth_date: z.string().optional(),
});

type AnimalFormData = z.infer<typeof animalSchema>;

// 2. Hook de formulario
const { register, handleSubmit, formState: { errors } } = useForm<AnimalFormData>({
  resolver: zodResolver(animalSchema),
  defaultValues: { name: '', tag: '' },
});

// 3. Submit
const onSubmit = async (data: AnimalFormData) => {
  await create(data);
};
```

---

## Formularios Grandes: useXxxForm()

Se o formulario tem mais de 3 campos ou logica condicional, extraia para um hook:

```ts
// hooks/forms/useAnimalForm.ts
export function useAnimalForm(defaultValues?: Partial<Animal>) {
  const form = useForm<AnimalFormData>({
    resolver: zodResolver(animalSchema),
    defaultValues,
  });

  const { create, loading } = useCreateAnimal();

  const onSubmit = form.handleSubmit(async (data) => {
    await create(data);
  });

  return { form, onSubmit, loading };
}
```

O componente apenas chama:
```tsx
const { form, onSubmit, loading } = useAnimalForm();
```

---

## Regras de UX para Formularios

- Todo campo obrigatorio tem `required` no FormRow
- Mensagem de erro aparece abaixo do campo (via FormRow)
- Botao de submit fica disabled enquanto loading=true
- Apos sucesso: toast.success + fechar modal ou redirecionar
- Apos erro: toast.error com mensagem descritiva
- Nunca use alert() ou confirm()

---

## Selects com Dados do Banco

Use o hook de dominio dentro do formulario:

```tsx
const { data: breeds } = useBreeds();

<FormRow label="Raca">
  <Select {...register('breed_id')}>
    {breeds.map(b => (
      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
    ))}
  </Select>
</FormRow>
```
