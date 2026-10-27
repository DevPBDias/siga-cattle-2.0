---
name: indi-ouro-design-system
description: "Guia oficial de UI/UX, Design System, componentes shadcn/ui, Tailwind CSS e padrões funcionais mobile-first do INDI Ouro 2.0 para agentes de IA criando ou refatorando telas e funcionalidades."
---

# Design System & Diretrizes de UI/UX — INDI Ouro 2.0

Este documento é a especificação canônica de Design System para o INDI Ouro 2.0.
**TODO AGENTE DE IA DEVE SEGUIR ESTE GUIA AO CRIAR OU ALTERAR TELAS, FORMULÁRIOS, MODAIS OU COMPONENTES NO PROJETO.**

---

## 1. Princípios e Direção Visual

- **Mobile-First Real**: O app é um PWA voltado para uso no campo por pecuaristas e gestores. A resolução de referência é **`383 x 777 px`**, mas deve se expandir fluidamente até Desktop (`max-w-md` a `max-w-lg` centralizado quando em telas maiores).
- **Paleta Institucional Agrícola**:
  - `bg-background` (`#f4f7f4`): Fundo suave neutro levemente esverdeado.
  - `primary` (`#1e3b2b`): Verde escuro floresta institucional para títulos, cabeçalhos e botões primários.
  - `field-green` (`#2d7d46`): Verde operacional para confirmações, badges de sucesso e status ativos.
  - `amber` (`#d97706`): Laranja/âmbar para cotações financeiras, valores em R$, alertas e status pendentes.
  - `indi-ouro` (`#ffcb04`): Dourado oficial da marca para destaque exclusivo e ícones nobres.
  - `card` (`#ffffff`): Fundo de cards e modais brancos, limpos, com bordas finas `border-border/60` e `rounded-2xl`.
- **Aparência Premium e Sem Poluição**:
  - Proibido o uso de gradientes agressivos ou efeitos neon.
  - Proibido usar emojis como ícones de botões em fluxos de negócio. Use sempre a biblioteca **`lucide-react`**.
  - Evitar sombras pesadas; usar `shadow-sm` ou `shadow-md` suave.
  - Todo card de conteúdo usa cantos arredondados generosos (`rounded-2xl` = 16px).

---

## 2. Tokens de Design (Tailwind CSS v4)

Todas as cores e dimensões estão vinculadas às variáveis do `src/app/globals.css`. Utilize exclusivamente as classes utilitárias abaixo:

| Token / Propósito | Classe Tailwind | Valor / Aplicação |
| :--- | :--- | :--- |
| **Fundo de Tela** | `bg-background` | Fundo cinza/verde claro `#f4f7f4` |
| **Fundo de Card / Modal** | `bg-card` | Fundo branco `#ffffff` |
| **Cor Primária** | `bg-primary`, `text-primary` | Verde institucional `#1e3b2b` |
| **Verde Operacional** | `bg-field-green`, `text-field-green` | Verde `#2d7d46` (ações de campo e sucesso) |
| **Âmbar / Comercial** | `bg-amber`, `text-amber` | `#d97706` (financeiro e destaques) |
| **Destrutivo / Erro** | `bg-destructive`, `text-destructive`| Vermelho suave `#d95757` |
| **Bordas** | `border-border` ou `border-border/60` | Cinza claro `#e0e7e1` |
| **Texto Principal** | `text-foreground` | Verde/chumbo escuro `#1a241c` |
| **Texto Secundário** | `text-muted-foreground` | Cinza neutro `#5a6b5d` |
| **Raio de Borda Padrão** | `rounded-2xl` (16px) | Cards, modais e containers |
| **Raio de Borda de Controles** | `rounded-md` (6px) | Inputs, botões, selects e tags |
| **Altura Padronizada de Controles** | `h-6` (24px) | Altura canônica única para Button (SM), Input, Select e DatePicker |

---

## 3. Estrutura Padrão de Tela (Layout Canônico)

Toda tela do sistema deve seguir a anatomia abaixo para garantir que o cabeçalho fique fixo e o rodapé mobile fixo (`MobileFooter`) não oculte botões ou formulários.

```tsx
"use client";

import ShortHeader from "@/components/layout/ShortHeader";

export default function ExemploPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Cabeçalho padrão: Título em caixa alta com botão de voltar integrado */}
      <ShortHeader title="TÍTULO DA TELA" />

      {/* Container responsivo: 100% no mobile, largura máxima controlada no desktop */}
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Card Operacional */}
        <section className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-primary tracking-tight">
            Seção de Conteúdo
          </h2>
          {/* Componentes da tela */}
        </section>
      </main>
    </div>
  );
}
```

> **IMPORTANTE**: Sempre incluir `pb-12` no container da página para garantir espaçamento adequado acima do `MobileFooter`.

---

## 4. Biblioteca de Componentes Canônicos (`src/components/ui/`)

Quando um agente precisar de qualquer elemento de interface, deve **obrigatoriamente** importar de `@/components/ui/`:

### 4.1 Altura Padronizada de Controles (`SM` = `h-6` / 24px)
> **REGRA DE OURO**: Todos os botões, inputs, selects e seletores de data compartilham **exatamente a mesma altura de 24px (`h-6`)**, garantindo alinhamento e estética compacta, sem botões esticados ou alturas desconexas.
> **PROIBIDO** aplicar classes manuais como `h-10`, `h-11`, `h-12`, `h-14` nos botões ou campos.

### 4.2 Botões (`@/components/ui/button`)
Os botões já vêm por padrão com a altura canônica `sm` (`h-6`):
```tsx
import { Button } from "@/components/ui/button";
import { Plus, Check, Trash2, Loader2 } from "lucide-react";

// 1. Primário (Ação principal da tela)
<Button className="w-full">
  <Plus /> Salvar Registro
</Button>

// 2. Secundário / Cancelar
<Button variant="secondary" className="w-full">
  Cancelar
</Button>

// 3. Perigo / Exclusão
<Button variant="destructive" className="w-full">
  <Trash2 /> Excluir Registro
</Button>

// 4. Contorno / Ação secundária
<Button variant="outline" className="w-full border-field-green/40 text-field-green">
  Ação Auxiliar
</Button>

// 5. Estado de Carregamento
<Button disabled className="w-full">
  <Loader2 className="animate-spin" /> Processando...
</Button>
```

### 4.3 Formulários Responsivos (`@/components/ui/FormRow` e `@/components/ui/FormField`)
Labels e controles ficam alinhados horizontalmente com altura perfeitamente nivelada (`h-6`):

```tsx
import { FormRow, FormSection } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayISO } from "@/utils/dates";

<FormSection title="Dados Gerais">
  <FormRow label="Identificação (RGN)" required error={errors.rgn}>
    <Input
      placeholder="Ex: 1234"
      value={rgn}
      onChange={(e) => setRgn(e.target.value)}
    />
  </FormRow>

  <FormRow label="Data do Evento" required>
    <DatePicker
      value={date}
      onChange={(val) => setDate(val)}
    />
  </FormRow>

  <FormRow label="Categoria">
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="vaca">Vaca</SelectItem>
        <SelectItem value="touro">Touro</SelectItem>
        <SelectItem value="bezerro">Bezerro</SelectItem>
      </SelectContent>
    </Select>
  </FormRow>
</FormSection>
```

### 4.4 Diálogos e Modais de Confirmação (`@/components/ui/dialog`)
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md p-6 bg-card rounded-2xl border border-border/60 shadow-2xl">
    <DialogHeader className="space-y-2">
      <DialogTitle className="text-lg font-bold text-primary">
        Confirmar Exclusão
      </DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        Esta ação não poderá ser desfeita. Tem certeza de que deseja excluir este item?
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex flex-row gap-2 pt-4">
      <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleConfirm}>
        Confirmar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4.4 Cards e Listas Expansíveis com Accordion (`@/components/ui/accordion`)
Para listas de animais, pesagens, coberturas ou movimentações:
```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { formatDate } from "@/utils/dates";

<Accordion type="single" collapsible className="space-y-2">
  <AccordionItem value={item.id} className="bg-card rounded-2xl border border-border/60 px-4 shadow-sm">
    <AccordionTrigger className="hover:no-underline py-3">
      <div className="flex items-center justify-between w-full pr-3">
        <div className="text-left">
          <p className="font-bold text-sm text-primary">{item.title}</p>
          <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-secondary text-primary">
          {item.status}
        </span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="pt-2 pb-4 border-t border-border/40 text-sm space-y-2 text-foreground">
      {/* Detalhes expansíveis */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

### 4.5 Home Buttons — Grid de Atalhos (`@/components/buttons/HomeButtons`)
Grade de 4 colunas usada exclusivamente na tela inicial. Cada item é um `Link` (`next/link`) com ícone centralizado e label em fonte mínima.

```tsx
// Componente canônico: src/components/buttons/HomeButtons.tsx
// Padrão visual de cada item:
<Link
  href="/rota"
  className="flex w-full flex-col items-center justify-center gap-1 rounded-lg bg-white p-2 shadow-xl active:scale-95 transition-all duration-300"
>
  <div className="flex items-center justify-center w-full">
    <Icon className="h-8 w-8 text-primary" />
  </div>
  <span className="text-[9px] font-bold uppercase text-primary text-center">
    {label}
  </span>
</Link>

// Wrapper da grade:
<section className="grid w-full grid-cols-4 gap-1 mt-2">
  {/* itens */}
</section>
```

### 4.6 Status Badges — Tags de Estado do Animal
Sempre `rounded-full`, texto em maiúsculas (`ATIVO`, `PRENHA`, etc.) e `font-bold`. Nunca usar `rounded-md` para status.

```tsx
// ATIVO (Verde)
<span className="text-xs px-2.5 py-1 rounded-full font-bold bg-field-green/10 text-field-green">ATIVO</span>

// PRENHA (Âmbar)
<span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber/10 text-amber">PRENHA</span>

// DESCARTE (Primário)
<span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary/10 text-primary">DESCARTE</span>

// MORTO (Destrutivo)
<span className="text-xs px-2.5 py-1 rounded-full font-bold bg-destructive/10 text-destructive">MORTO</span>

// VENDIDO (Dourado)
<span className="text-xs px-2.5 py-1 rounded-full font-bold bg-indi-ouro/20 text-primary">VENDIDO</span>

// INATIVO (Muted)
<span className="text-xs px-2.5 py-1 rounded-full font-bold bg-muted text-muted-foreground">INATIVO</span>
```

### 4.7 List Actions — Botões de Redirecionamento (`@/components/buttons/RedirectButtons`)
Usados em telas de submenu (ex: Gestão Animal, Geral/Relatórios). Fundo `bg-primary`, texto branco, alinhamento à esquerda, `rounded-md`.

```tsx
// Padrão de cada botão de ação:
<Link
  href="/rota"
  className="bg-primary text-white w-full pl-4 py-3 rounded-md flex flex-row justify-start items-center font-medium text-sm uppercase shadow-lg gap-2 text-left"
>
  <Icon className="w-4 h-4 opacity-80" />
  Nome da Ação
</Link>

// Componente pronto:
import RedirectButtons from "@/components/buttons/RedirectButtons";
<RedirectButtons data={linksArray} />
```

### 4.8 Stats Cards — Cards de Estatísticas do Rebanho
Usados em sumários e dashboards. Fundo `bg-primary`, número principal em `text-indi-ouro`, labels em `text-white/85`. Componente pronto em `@/components/home/StatsFooter`.

```tsx
// Container externo:
<div className="rounded-2xl bg-primary p-3 space-y-2">
  {/* Total */}
  <div className="flex items-center justify-between gap-2 p-2 rounded-md border border-white/20">
    <span className="text-sm text-white/85 font-extrabold">Total de animais</span>
    <strong className="text-indi-ouro text-2xl font-extrabold leading-none">{total}</strong>
  </div>

  {/* Breakdown por faixa etária */}
  <div className="px-1 py-1.5 flex flex-col justify-center items-center border border-white rounded-[8px] bg-transparent">
    <strong className="text-indi-ouro text-base leading-none">{count}</strong>
    <span className="mt-0.5 text-white/85 text-[9px] font-bold">0-12m</span>
  </div>
</div>
```

### 4.9 Mobile Footer Nav — Barra de Navegação (`@/components/layout/MobileFooter`)
Barra fixa no rodapé de todas as telas protegidas. Item ativo: `text-field-green font-extrabold`. Item inativo: `text-[#809086]`. Nunca substituir por outro padrão.

```tsx
import { MobileFooter } from "@/components/layout/MobileFooter";

// Já é incluído no layout protegido:
// src/app/(protected)/layout.tsx

// Padrão visual de cada item:
<button
  className={`rounded-[14px] flex flex-col items-center justify-center gap-1 text-[9px] transition-all ${
    active ? "text-field-green font-extrabold" : "text-[#809086]"
  }`}
>
  <Icon className="w-4 h-4" />
  <span className="tracking-tight uppercase">{label}</span>
</button>
```

---

**NUNCA utilize as seguintes práticas:**
- ❌ `new Date("YYYY-MM-DD")` (causa recuo de 1 dia para o dia anterior no Brasil UTC-3).
- ❌ `new Date().toISOString().split("T")[0]` (vira a data de amanhã após as 21h em Brasília).
- ❌ `toLocaleDateString()` sem timezone especificado.

**SEMPRE utilize o utilitário centralizado [`@/utils/dates`](file:///c:/Users/User/Desktop/Projetos/INDI%20Ouro%202.0/src/utils/dates.ts):**
```tsx
import { 
  todayISO,           // Inicializar campos de hoje em inputs YYYY-MM-DD
  formatDate,         // Formatar para DD/MM/YYYY
  formatDateTime,     // Formatar timestamp de auditoria (America/Sao_Paulo)
  formatAge,          // "X anos e Y meses" ou { short: true }
  parseToDate,        // Date seguro para DatePicker
  diffInDays,         // Intervalo em dias
  compareDates,       // Ordenação cronológica em .sort()
} from "@/utils/dates";

// Inicialização de form:
const [data, setData] = useState(todayISO());

// Exibição:
<p>{formatDate(animal.born_date)}</p>
<p>{formatAge(animal.born_date)}</p>
```

---

## 6. Feedback de Ações e Notificações (Toasts)

Sempre utilizar o **`sonner`** para feedback visual imediato:
```tsx
import { toast } from "sonner";

// Sucesso:
toast.success("Animal cadastrado com sucesso!");

// Erro:
toast.error("Não foi possível salvar os dados. Verifique os campos.");

// Alerta:
toast.warning("Atenção: Data futura não permitida.");
```

---

## 7. Tipografia — Hierarquia e Pesos

Nunca use tamanhos ou pesos arbitrários. Siga a escala abaixo:

| Uso | Classes Tailwind | Exemplo |
|---|---|---|
| Título de tela (ShortHeader) | `text-base font-extrabold uppercase tracking-widest text-white` | "ANIMAIS" |
| Título de seção (card) | `text-base font-bold text-primary tracking-tight` | "Dados do Animal" |
| Label de campo | `text-xs font-semibold text-muted-foreground uppercase` | "Nome" |
| Valor principal / número | `text-2xl font-extrabold text-indi-ouro leading-none` | "142" |
| Corpo de texto | `text-sm text-foreground` | Parágrafos gerais |
| Texto auxiliar / metadata | `text-xs text-muted-foreground` | "Atualizado em 10/04" |
| Badge / tag de status | `text-xs font-bold uppercase` | "ATIVO" |
| Botão home grid | `text-[9px] font-bold uppercase text-primary` | "ANIMAIS" |

**Regras:**
- `tracking-tight` em títulos de seção → evita letras coladas
- `tracking-widest` + `uppercase` apenas em cabeçalhos de tela (ShortHeader)
- Nunca misture `font-medium` com `font-extrabold` no mesmo bloco de texto
- Valores monetários e números de destaque sempre em `text-indi-ouro` ou `text-amber`

---

## 8. Estados de UI — Loading, Vazio e Erro

Todo componente que depende de dados async **obrigatoriamente** cobre 3 estados:

### Loading — Skeleton

Use o `Skeleton` do shadcn/ui. Para telas de detalhe, use `DetailsSkeleton`.

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { DetailsSkeleton } from "@/components/ui/skeletons/DetailsSkeleton";

// Lista simples
if (loading) return (
  <div className="space-y-2 p-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full rounded-2xl" />
    ))}
  </div>
);

// Tela de detalhe completa
if (loading) return <DetailsSkeleton />;
```

### Vazio — EmptyState

Bloco centralizado com ícone neutro e mensagem contextual:

```tsx
// Pattern inline (sem componente dedicado)
if (!data || data.length === 0) return (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
      <PackageOpen className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-sm font-semibold text-muted-foreground">
      Nenhum registro encontrado.
    </p>
    <p className="text-xs text-muted-foreground/70">
      Toque em "+" para adicionar o primeiro.
    </p>
  </div>
);
```

### Erro — ErrorState

```tsx
if (error) return (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
      <AlertTriangle className="w-6 h-6 text-destructive" />
    </div>
    <p className="text-sm font-semibold text-destructive">
      Erro ao carregar os dados.
    </p>
    <p className="text-xs text-muted-foreground">{error.message}</p>
  </div>
);
```

**Ordem obrigatória no componente:**
```tsx
if (loading) return <LoadingUI />;
if (error)   return <ErrorUI />;
if (!data || data.length === 0) return <EmptyUI />;
return <ContentUI data={data} />;
```

---

## 9. Sistema de Espaçamento

Use o sistema de espaçamento consistente por contexto — nunca valores arbitrários.

| Contexto | Classes | Motivo |
|---|---|---|
| Padding de tela | `p-4` | Container principal (`main`) |
| Gap entre cards | `space-y-4` | Separação padrão entre seções |
| Gap interno de card | `space-y-4` ou `space-y-3` | Conteúdo dentro do `bg-card` |
| Gap entre FormRows | `space-y-3` | FormSection usa isso internamente |
| Gap em listas compactas | `space-y-2` | Accordion items, chips |
| Gap em grid de ações | `gap-1` | HomeButtons (grid 4 cols) |
| Gap em botões lado a lado | `gap-2` | DialogFooter, pares de ação |
| Padding de card | `p-4` | Cards principais |
| Padding de card compacto | `p-3` | Stats cards, badges summary |
| Padding inferior de tela | `pb-12` | Espaço acima do MobileFooter |

**Anti-pattern de espaçamento:**
```tsx
// ERRADO — valores arbitrários
<div className="mt-7 mb-3 px-5">

// CORRETO — escala do sistema
<div className="mt-4 mb-2 px-4">
```

---

## 10. Abas — Padrão com StandardTabList

Use sempre `StandardTabList` para telas com múltiplas abas. **Nunca construa TabsList manualmente.**

```tsx
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";
import { Beef, Scale, Heart } from "lucide-react";

const TABS = [
  { value: "dados",       label: "Dados",      icon: Beef  },
  { value: "pesagens",    label: "Pesagens",   icon: Scale },
  { value: "reproducao",  label: "Reprodução", icon: Heart },
];

export function AnimalTabs({ animalId }: { animalId: string }) {
  const [tab, setTab] = useState("dados");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <StandardTabList
        tabs={TABS}
        activeTab={tab}
        variant="premium"   // "premium" = aba ativa expande com label | "simple" = todas com label
      />

      <TabsContent value="dados">
        <DadosTab animalId={animalId} />
      </TabsContent>

      <TabsContent value="pesagens">
        <PesagensTab animalId={animalId} />
      </TabsContent>

      <TabsContent value="reproducao">
        <ReproducaoTab animalId={animalId} />
      </TabsContent>
    </Tabs>
  );
}
```

**Variantes:**
- `variant="premium"` ← padrão: abas inativas mostram só ícone, ativa expande com label animado
- `variant="simple"` ← todas as abas mostram ícone + label (para 2–3 abas curtas)

**Regra:** Use `variant="simple"` quando tiver 2 ou 3 abas com labels curtos (≤ 8 chars). Use `"premium"` para 4+ abas ou labels longos.

---

## 11. Checklist Obrigatório para Toda Nova Tela

Antes de finalizar qualquer nova tela ou componente, valide:
1. [ ] A tela usa `min-h-screen bg-background pb-12`?
2. [ ] O cabeçalho usa `ShortHeader` com botão de voltar ativo?
3. [ ] Todos os botões, inputs e modais vêm de `@/components/ui/`?
4. [ ] O formulário usa `FormRow` para alinhamento e rótulos claros?
5. [ ] Todas as datas usam `@/utils/dates` (`todayISO()`, `formatDate()`)?
6. [ ] A tela funciona limpa na largura mobile de **383px** sem scroll horizontal?
7. [ ] Os estados de `loading`, `vazio` e `erro` estão cobertos (Skeleton → EmptyState → ErrorState)?
8. [ ] Nenhuma cor "crua" (ex: `bg-green-500`, `bg-blue-600`) foi usada fora dos tokens (`primary`, `field-green`, `amber`)?
9. [ ] Tipografia segue a escala (sem pesos ou tamanhos arbitrários)?
10. [ ] Espaçamentos usam a escala do sistema (`p-4`, `space-y-4`, `gap-2`...)?
11. [ ] Telas com abas usam `StandardTabList` (nunca `TabsList` manual)?
