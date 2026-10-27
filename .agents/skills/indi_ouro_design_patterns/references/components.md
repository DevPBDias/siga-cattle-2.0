# Componentes e Atomic Design — INDI Ouro 2.0

## Regra do Extrato

Extraia para components/shared/ quando:
- O bloco aparece em 2+ lugares (DRY)
- O componente passa de 150 linhas
- Um componente tem mais de 6 props booleanas (showX, hasY, isZ)

---

## Atoms — components/ui/

Fornecidos pelo shadcn/ui. Nunca modifique sem boa razão.
Altura padronizada: h-6 (24px) para Button/Input/Select/DatePicker.

`
Button    → variant: default | secondary | destructive | outline | ghost
Input     → altura h-6
Select    → SelectTrigger altura h-6
DatePicker → trigger altura h-6
Dialog    → ÚNICO padrão de modal permitido
Accordion → listas expansíveis
Badge     → variantes via cva
`

---

## Molecules — components/shared/ (criar conforme necessário)

### FormRow (já existe em components/ui/FormRow.tsx)

`	sx
// Grid 2:3 — label à esquerda, controle à direita
<FormRow label="Identificação (RGN)" required htmlFor="rgn">
  <Input id="rgn" value={rgn} onChange={...} />
</FormRow>
`

### FormSection (já existe em components/ui/FormRow.tsx)

`	sx
<FormSection title="Dados Cadastrais">
  <FormRow label="..."><Input /></FormRow>
  <FormRow label="..."><Select /></FormRow>
</FormSection>
`

### InfoRow — Para exibição de dados (NÃO formulário)

`	sx
// Molecule a criar se não existir:
// <InfoRow label="Fazenda" value={animal.farm_name ?? "—"} />
// Props: label: string, value: ReactNode, className?: string
`

### EmptyState — Estado vazio padronizado

`	sx
// Molecule a criar se não existir:
// <EmptyState icon={Search} title="Nenhum animal" description="Tente outro filtro." />
`

### AsyncState — Loading / Vazio / Erro em um componente

`	sx
// Molecule a criar se não existir:
// <AsyncState loading={loading} empty={!data.length} error={error}>
//   {data.map(item => <Card key={item.id} {...item} />)}
// </AsyncState>
`

---

## Organisms — components/features/<domínio>/

Composição de molecules + atoms para uma feature específica.

### Destino de arquivos ao atomizar uma tela

| Situação | Destino |
|---|---|
| Usado **só neste domínio** | `components/features/<domínio>/<subpasta>/` |
| Usado em **2+ domínios** | `components/shared/` |
| Elemento base (Button, Input…) | `components/ui/` — nunca crie novos aqui |
| Layout global fixo | `components/layout/` |

### Subpastas canônicas de features/<domínio>/

```
components/features/<domínio>/
├── form/       ← Formulários, campos, inputs especializados
├── details/    ← Cards de detalhe, InfoRows de exibição somente-leitura
├── lists/      ← Listas, itens de lista, accordions de registro
├── modals/     ← Diálogos de confirmação, edição, criação
└── manage/     ← Ações de gestão: filtros, botões de ação em massa
```

> **Se a subpasta não existir, crie-a.** O agente tem permissão explícita para criar qualquer subpasta dentro de `components/features/<domínio>/`. Nunca deixe componentes de feature soltos na raiz de `features/` ou de `components/`.

### Domínios existentes no projeto

```
components/features/
├── animals/       ← Gestão de animais (canônico — use como referência)
├── commercial/    ← Fluxos comerciais
├── doses/         ← Doses de sêmen
├── farm/          ← Fazenda / propriedade
├── home/          ← Tela inicial
├── mortes/        ← Registro de mortes
├── nascimentos/   ← Registro de nascimentos
├── reports/       ← Relatórios PDF
├── reproduction/  ← Eventos reprodutivos
└── vaccines/      ← Vacinas
```

Para domínios ainda não listados (ex: `pesagem`, `movimentacoes`), crie a pasta em `components/features/<novo-domínio>/`.

### Exemplo de atomização: gerenciar/page.tsx

```
# ANTES — page monolítica de 400+ linhas
app/(protected)/gerenciar/page.tsx

# DEPOIS — page de ~40 linhas + componentes atômicos
app/(protected)/gerenciar/page.tsx              ← só orquestra
components/features/animals/
  manage/
    ├── AnimalManageHeader.tsx                  ← filtros e busca
    ├── AnimalManageList.tsx                    ← lista com accordion
    ├── AnimalManageEmptyState.tsx              ← estado vazio contextual
    └── AnimalManageActions.tsx                 ← botões de ação
```

### Organismos canônicos existentes (referência)

- `features/animals/` — estrutura completa com form/, details/, lists/, modals/, manage/
- `components/buttons/HomeButtons.tsx` → grid 4 colunas de atalhos
- `components/home/StatsFooter.tsx` → cards de estatísticas do rebanho

---

## Padrão de Composição vs Props Booleanas

### ERRADO — props booleanas em cascata
`	sx
<AnimalCard
  showFarm={true}
  showStatus={false}
  showAge={true}
  showWeight={false}
  isCompact={true}
/>
`

### CERTO — composição com children/slots
`	sx
<AnimalCard animal={animal}>
  <AnimalCard.Farm />
  <AnimalCard.Age />
</AnimalCard>
// ou simplesmente dividir em componentes menores por contexto
`

---

## Padrão de Variantes com CVA

Use cva (class-variance-authority) para componentes com múltiplas aparências.
Já está em uso no Button. Aplique em: Badge, InfoRow, StatCard.

`	sx
import { cva } from "class-variance-authority";

const badgeVariants = cva(
  "text-xs px-2.5 py-1 rounded-full font-bold",
  {
    variants: {
      state: {
        ativo:    "bg-field-green/10 text-field-green",
        prenha:   "bg-amber/10 text-amber",
        descarte: "bg-primary/10 text-primary",
        morto:    "bg-destructive/10 text-destructive",
        vendido:  "bg-indi-ouro/20 text-primary",
        inativo:  "bg-muted text-muted-foreground",
      },
    },
  }
);

// Uso:
<span className={badgeVariants({ state: "ativo" })}>ATIVO</span>
`

---

## Limites de Tamanho

| Elemento | Limite recomendado |
|---|---|
| Componente (.tsx) | ≤ 150 linhas |
| Função/handler | ≤ 40 linhas |
| Props de um componente | ≤ 6 |
| Profundidade de JSX | ≤ 5 níveis |
