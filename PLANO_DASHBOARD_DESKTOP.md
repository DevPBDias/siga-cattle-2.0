# Plano de Implementação: Dashboard Desktop (shadcn dashboard-01) para Gestão Bovina

Adaptação do template **`dashboard-01` do shadcn/ui** para o sistema de gestão pecuária bovina **INDI Ouro 2.0**, criando uma experiência rica em notebooks e computadores sem perder a usabilidade mobile-first de campo.

---

## 1. Visão Geral da Arquitetura Responsiva

O sistema adotará uma **casca híbrida e fluida**:

```
Dispositivo do Usuário
  ├── Mobile (< 768px):
  │     ├── ShortHeader no topo
  │     ├── Conteúdo otimizado para toque com 1 coluna vertical
  │     └── MobileFooter fixo no rodapé
  │
  └── Desktop / Notebook (≥ 768px / 1024px):
        ├── AppSidebar retrátil à esquerda (shadcn/ui Sidebar)
        ├── SiteHeader com Breadcrumbs + Seletor de Fazenda + Status de Sync + Perfil
        └── Conteúdo amplo com multi-colunas, cards e tabelas ricas
```

---

## 2. Tela Inicial (Dashboard Overview de Pecuária)

Adaptação dos blocos do template `dashboard-01` aos dados e fluxos do INDI Ouro 2.0:

### A. Barra Lateral (Sidebar)
- **Topo (Header da Sidebar):**
  - Logotipo INDI Ouro + Seletor de Fazenda / Propriedade ativa.
  - Botão de Destaque: **`+ Novo Lançamento`** (abre modal rápido para Pesagem, Vacina, Nascimento ou Movimentação).
- **Menu Principal (Navegação com ícones Lucide):**
  - 📊 **Dashboard Geral** (`/home`)
  - 📋 **Rebanho & Consulta** (`/consulta` e `/gerenciar`)
  - ⚖️ **Manejo de Pesagem** (`/pesagem-ce`)
  - 💉 **Sanitário & Vacinas** (`/vacinas`)
  - 🧬 **Reprodução & IATF** (`/reproducao`)
  - 🐣 **Maternidade & Nascimentos** (`/nascimentos`)
  - 🚚 **Movimentações & Mortes** (`/movimentacoes`, `/mortes`)
  - 💰 **Comercial / Vendas** (`/comercial`)
  - 📅 **Agenda & Calendário** (`/calendario`)
  - 📈 **Evolução do Rebanho** (`/geral/evolucao` — exclusivo para Owner)
  - 📑 **Relatórios & Exportação** (`/geral`)
- **Rodapé da Sidebar:**
  - Status de Sincronização Local-First (RxDB $\leftrightarrow$ Supabase com botão para forçar sync).
  - Card de Usuário com Avatar, Nome, Cargo (`Dono` ou `Membro`) e Acesso ao Perfil / Logout.

---

### B. Cards Superiores de Indicadores (SectionCards)
Substituição dos cartões de exemplo de receita por **KPIs essenciais do rebanho**:

1. **Rebanho Ativo (Total de Cabeças):**
   - *Número em destaque:* Total de animais vivos cadastrados na fazenda ativa.
   - *Subtexto / Variação:* `+X animais este mês` (entradas e nascimentos).
2. **Taxa de Maternidade & Nascimentos:**
   - *Número em destaque:* Bezerros nascidos nos últimos 30 dias / fêmeas prenhes.
   - *Subtexto / Variação:* Taxa de desmame ou prenhez do período.
3. **Desempenho Ponderal (GMD Médio):**
   - *Número em destaque:* Ganho Médio Diário (ex: `0.780 kg/dia`) ou Peso Médio atual.
   - *Subtexto / Variação:* Comparativo com a rodada de pesagem anterior.
4. **Alerta Sanitário & Agenda:**
   - *Número em destaque:* Vacinações pendentes ou protocolos do mês.
   - *Subtexto / Variação:* Lotes com manejo previsto para os próximos 7 dias.

---

### C. Gráfico Central Interativo (ChartAreaInteractive)
- **Título:** *Evolução do Rebanho e Desempenho*
- **Filtros rápidos (botões no topo direito):** `Últimos 7 dias` | `Últimos 30 dias` | `Últimos 3 meses` | `Último Ano`
- **Curvas de Área em Gradiente Suave:**
  - *Série 1 (Verde escuro / Field Green):* Machos ou Entradas / Nascimentos.
  - *Série 2 (Dourado / Indi Ouro):* Fêmeas ou Saídas / Abates.
  - *Alternativa via seletor:* Ganho de Peso Médio por Lote / Categoria ao longo do tempo.

---

### D. Tabela de Manejos e Registros Recentes (DataTable)
- **Abas Rápidas no Topo da Tabela:**
  - `Últimos Manejos` | `Nascimentos Recentes` | `Pesagens do Lote` | `Alertas Sanitários`
- **Colunas:**
  - Seleção em lote (checkboxes).
  - **Identificação:** Brinco / Nome / Tatuagem do animal.
  - **Categoria:** Bezerro, Novilha, Vaca, Touro, etc.
  - **Lote / Pasto:** Localização atual do animal.
  - **Último Evento:** Data e tipo de manejo realizado.
  - **Status:** Badge colorido (*Ativo*, *Em Tratamento*, *Vendido*, *Desmamado*).
  - **Ações:** Ver ficha completa, editar ou lançar pesagem.
- **Recursos:** Busca em tempo real por brinco/número, ordenação por coluna e paginação.

---

## 3. Adaptação das Demais Telas no Layout Desktop

| Tela | No Mobile (Atual) | No Desktop (Com o Dashboard) |
|---|---|---|
| **Cadastro (`/cadastro`)** | Formulário vertical comprido de 1 coluna | Formulário em **Grid de 2 ou 3 colunas**, com resumo lateral em tempo real do animal sendo criado |
| **Consulta (`/consulta`)** | Cards empilhados verticais | **Tabela rica** com filtros em barra lateral retrátil, ordenação, exportação rápida e busca instantânea |
| **Pesagem (`/pesagem-ce`)** | Entrada sequencial com teclado numérico | Modo **Planilha Rápida de Pesagem em Lote** com navegação por teclado (Enter/Tab) |
| **Vacinas (`/vacinas`)** | Lista simples com modais | Visão de **Protocolos e Cobertura Sanitária por Lote**, com indicadores de pendência |
| **Reprodução (`/reproducao`)** | Formulário sequencial | Visão de **Funil Reprodutivo** (Inseminadas $\rightarrow$ Diagnóstico de Gestação $\rightarrow$ Paridas) |
| **Calendário (`/calendario`)** | Lista de eventos por data | Visão de **Calendário Mensal Completo** em tela cheia com arraste de manejos |
| **Relatórios & Evolução (`/geral`)**| Geração sequencial em lista | **Visualizador lado a lado** (filtros à esquerda, pré-visualização e gráficos à direita) |

---

## 4. Prompt Pronto para o ChatGPT

```text
Atue como Especialista Sênior em UI/UX e Frontend com Next.js (App Router), Tailwind CSS e shadcn/ui.

Estamos desenvolvendo o INDI Ouro 2.0, um sistema de gestão pecuária bovina local-first (RxDB + Supabase).
Queremos adaptar o template 'dashboard-01' do shadcn/ui para criar uma experiência desktop completa (notebooks e computadores), mantendo a compatibilidade mobile para o uso no pasto.

Requisitos específicos:
1. Barra Lateral (AppSidebar):
   - Header com logo e seletor da fazenda ativa.
   - Botão em destaque "+ Novo Lançamento" (atalho rápido para pesagem, vacina, nascimento).
   - Menu categorizado: Dashboard, Rebanho, Manejos (Pesagem, Vacinas, Reprodução, Nascimentos), Movimentações, Comercial, Calendário e Relatórios/Evolução.
   - Rodapé com status de sincronização e perfil do usuário.

2. Tela Inicial (Dashboard):
   - 4 Cards de Métricas (SectionCards): Rebanho Ativo, Nascimentos/Maternidade, Ganho Médio Diário (GMD) e Vacinações Pendentes.
   - Gráfico de Área Interativo (ChartAreaInteractive): Evolução do rebanho/movimentações ao longo do tempo com seletor de período (7d, 30d, 3m, 1a) em tons de verde campo e dourado.
   - Tabela de Dados (DataTable): Abas para Últimos Manejos, Nascimentos, Pesagens e Alertas Sanitários com busca e paginação.

3. Responsividade:
   - Dispositivos móveis (<768px): mantém navegação via MobileFooter e cards em coluna única.
   - Dispositivos grandes (≥768px): exibe a AppSidebar retrátil e layout expandido.

Gere o código modular seguindo Atomic Design, Tailwind CSS e componentes shadcn/ui.
```

---

## 5. Roteiro de Execução Técnica

1. **Ajuste de Configuração:**
   - Corrigir o caminho do CSS em `components.json` para `"css": "src/app/globals.css"`.
2. **Criação do Shell Híbrido:**
   - Atualizar `src/app/(protected)/layout.tsx` para alternar responsivamente entre `AppSidebar` (telas $\ge$ 768px) e `MobileFooter` (telas < 768px).
3. **Componentes do Dashboard Bovina:**
   - Adaptar `SectionCards.tsx` para consumir dados reais do RxDB (`useAnimals`, `useWeights`, etc.).
   - Adaptar `ChartAreaInteractive.tsx` para renderizar as métricas temporais de gado com a paleta do INDI Ouro.
   - Adaptar `DataTable.tsx` para listar animais e manejos recentes com abas de contexto.
4. **Refinamento Responsivo das Demais Telas:**
   - Adicionar classes responsivas de grid e largura máxima nas páginas de cadastro, consulta, manejos e relatórios.
