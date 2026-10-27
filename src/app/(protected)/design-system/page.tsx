"use client";

import { useState } from "react";
import ShortHeader from "@/components/layout/ShortHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormRow, FormSection } from "@/components/ui/FormRow";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
  Calendar,
  Layers,
  Palette,
  FormInput,
  Bell,
  Home,
  CalendarDays,
  ClipboardPen,
  UserRound,
  Tag,
  Navigation,
  LayoutGrid,
  BarChart3,
  Syringe,
  Scale,
  Baby,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { todayISO, formatDate } from "@/utils/dates";

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [dateValue, setDateValue] = useState(todayISO());
  const [rgn, setRgn] = useState("INDI 8492");
  const [category, setCategory] = useState("touro");

  return (
    <div className="min-h-screen bg-background pb-12">
      <ShortHeader title="DESIGN SYSTEM" />

      <main className="p-4 max-w-xl mx-auto space-y-6">
        {/* Banner de Apresentação */}
        <section className="bg-gradient-to-br from-primary to-primary/90 text-white rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--indi-ouro)]" />
            <h1 className="text-lg font-black tracking-tight uppercase">
              INDI Ouro 2.0 — Design System
            </h1>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            Biblioteca oficial de componentes, cores, tipografia e diretrizes mobile-first
            para agentes de IA e desenvolvedores.
          </p>
        </section>

        {/* 1. Paleta de Cores e Tokens */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Palette className="w-4 h-4 text-field-green" />
            <h2>Cores e Tokens da Marca</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-primary text-white flex flex-col justify-between h-20 shadow-xs">
              <span className="text-[10px] uppercase font-bold opacity-80">Primary</span>
              <span className="text-xs font-black">#1e3b2b</span>
            </div>
            <div className="p-3 rounded-xl bg-field-green text-white flex flex-col justify-between h-20 shadow-xs">
              <span className="text-[10px] uppercase font-bold opacity-80">Field Green</span>
              <span className="text-xs font-black">#2d7d46</span>
            </div>
            <div className="p-3 rounded-xl bg-amber text-white flex flex-col justify-between h-20 shadow-xs">
              <span className="text-[10px] uppercase font-bold opacity-80">Amber</span>
              <span className="text-xs font-black">#d97706</span>
            </div>
            <div className="p-3 rounded-xl bg-indi-ouro text-foreground flex flex-col justify-between h-20 shadow-xs">
              <span className="text-[10px] uppercase font-bold opacity-80">INDI Ouro</span>
              <span className="text-xs font-black">#ffcb04</span>
            </div>
            <div className="p-3 rounded-xl bg-background border border-border flex flex-col justify-between h-20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Background</span>
              <span className="text-xs font-black text-foreground">#f4f7f4</span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-between h-20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Card</span>
              <span className="text-xs font-black text-foreground">#ffffff</span>
            </div>
            <div className="p-3 rounded-xl bg-muted border border-border flex flex-col justify-between h-20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Muted</span>
              <span className="text-xs font-black text-foreground">#edf2ec</span>
            </div>
            <div className="p-3 rounded-xl bg-destructive text-white flex flex-col justify-between h-20 shadow-xs">
              <span className="text-[10px] uppercase font-bold opacity-80">Destructive</span>
              <span className="text-xs font-black">#d95757</span>
            </div>
          </div>
        </section>

        {/* 2. Botões Canônicos */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Layers className="w-4 h-4 text-field-green" />
            <h2>Variantes de Botões</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button size="sm" variant="default" className="w-full">
              <Plus /> Botão Primário (SM)
            </Button>

            <Button size="sm" variant="secondary" className="w-full">
              Secundário / Cancelar
            </Button>

            <Button size="sm" variant="destructive" className="w-full">
              <Trash2 /> Botão Destrutivo
            </Button>

            <Button size="sm" disabled className="w-full">
              <Loader2 className="animate-spin" /> Carregando...
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="w-full border-field-green/40 text-field-green hover:bg-field-green/10"
              onClick={() => setModalOpen(true)}
            >
              Abrir Modal de Teste
            </Button>
          </div>
        </section>

        {/* 3. Alinhamento de Controles (Altura Única h-6 / 24px) */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Layers className="w-4 h-4 text-field-green" />
            <h2>Alinhamento de Controles (Altura Padronizada SM - h-6)</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Todos os controles interativos (Input, Select, DatePicker e Button) compartilham exatamente a mesma altura de 24px (<code className="font-mono text-primary font-bold">h-6</code>).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
            <Input placeholder="Input de texto" value={rgn} onChange={(e) => setRgn(e.target.value)} />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vaca">Matriz</SelectItem>
                <SelectItem value="touro">Touro</SelectItem>
                <SelectItem value="bezerro">Bezerro</SelectItem>
              </SelectContent>
            </Select>
            <DatePicker value={dateValue} onChange={setDateValue} />
            <Button size="sm" className="w-full">
              <Check /> Salvar
            </Button>
          </div>
        </section>

        {/* 4. Formulário Responsivo (FormRow) */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <FormInput className="w-4 h-4 text-field-green" />
            <h2>Padrão de Formulário (FormRow)</h2>
          </div>

          <FormSection title="Dados Cadastrais">
            <FormRow label="Identificação (RGN)" required>
              <Input
                placeholder="Ex: 8492"
                value={rgn}
                onChange={(e) => setRgn(e.target.value)}
              />
            </FormRow>

            <FormRow label="Data do Evento" required>
              <DatePicker
                value={dateValue}
                onChange={(val) => setDateValue(val)}
              />
            </FormRow>

            <FormRow label="Categoria do Animal">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaca">Matriz / Vaca</SelectItem>
                  <SelectItem value="touro">Reprodutor / Touro</SelectItem>
                  <SelectItem value="bezerro">Bezerro</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormSection>
        </section>

        {/* 4. Lista Expansível (Accordion) */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Calendar className="w-4 h-4 text-field-green" />
            <h2>Listas e Cards Expansíveis</h2>
          </div>

          <Accordion type="single" collapsible defaultValue="demo-item" className="space-y-2">
            <AccordionItem value="demo-item" className="bg-background rounded-2xl border border-border/60 px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-3">
                  <div className="text-left">
                    <p className="font-bold text-sm text-primary">{rgn}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(dateValue)} · Lote Pasto 04</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-field-green/10 text-field-green">
                    ATIVO
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 border-t border-border/40 text-xs space-y-2 text-foreground">
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-muted-foreground uppercase font-bold text-[10px] block">Categoria</span>
                    <span className="font-semibold capitalize">{category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold text-[10px] block">Última Pesagem</span>
                    <span className="font-semibold">685 kg</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* 5. Toasts e Notificações */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Bell className="w-4 h-4 text-field-green" />
            <h2>Notificações (Sonner Toasts)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-field-green/40 text-field-green hover:bg-field-green/10 font-bold"
              onClick={() => toast.success("Operação realizada com sucesso!")}
            >
              Toast Sucesso
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-amber/40 text-amber hover:bg-amber/10 font-bold"
              onClick={() => toast.warning("Atenção: Revise os dados informados.")}
            >
              Toast Aviso
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 font-bold"
              onClick={() => toast.error("Erro ao salvar o registro no banco.")}
            >
              Toast Erro
            </Button>
          </div>
        </section>

        {/* 6. Home Buttons — Grid de Atalhos da Home */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <LayoutGrid className="w-4 h-4 text-field-green" />
            <h2>Home Buttons — Grid de Atalhos</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Grid 4 colunas usado na tela inicial. Cada botão é um{" "}
            <code className="font-mono text-primary font-bold">Link</code> com
            ícone centralizado e label minúsculo.
          </p>

          <div className="grid grid-cols-4 gap-1 mt-2">
            {[
              { icon: ClipboardPen, label: "Consulta" },
              { icon: Scale, label: "Medidas" },
              { icon: Baby, label: "Nascimentos" },
              { icon: Syringe, label: "Vacinas" },
              { icon: Calendar, label: "Reprodução" },
              { icon: BarChart3, label: "Relatórios" },
              { icon: TrendingUp, label: "Comercial" },
              { icon: UserRound, label: "Perfil" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex w-full flex-col items-center justify-center gap-1 rounded-lg bg-white p-2 shadow-xl active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-center w-full">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <span className="text-[9px] font-bold uppercase text-primary text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Status Badges — Tags de Estado do Animal */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Tag className="w-4 h-4 text-field-green" />
            <h2>Status Badges — Tags de Estado</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Badges usados em acordeões e listas para indicar o estado do animal
            ou registro. Sempre{" "}
            <code className="font-mono text-primary font-bold">rounded-full</code>
            , texto em maiúsculas e{" "}
            <code className="font-mono text-primary font-bold">font-bold</code>.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-field-green/10 text-field-green">
              ATIVO
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber/10 text-amber">
              PRENHA
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary/10 text-primary">
              DESCARTE
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-destructive/10 text-destructive">
              MORTO
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-indi-ouro/20 text-primary">
              VENDIDO
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-muted text-muted-foreground">
              INATIVO
            </span>
          </div>

          <div className="text-[10px] font-mono bg-muted rounded-lg px-3 py-2 text-muted-foreground leading-relaxed">
            <span className="text-primary font-bold">Padrão:</span>{" "}
            {`<span className="text-xs px-2.5 py-1 rounded-full font-bold bg-field-green/10 text-field-green">ATIVO</span>`}
          </div>
        </section>

        {/* 8. List Action Rows — Botões de Redirecionamento */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <ArrowRight className="w-4 h-4 text-field-green" />
            <h2>List Actions — Botões de Redirecionamento</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Padrão de botões usados em telas de submenu (ex: Gestão Animal,
            Geral/Relatórios). Fundo{" "}
            <code className="font-mono text-primary font-bold">bg-primary</code>
            , texto branco, alinhamento à esquerda.
          </p>

          <div className="flex flex-col gap-2">
            {[
              { label: "Pesagens e Escore Corporal", icon: Scale },
              { label: "Reprodução e Inseminações", icon: Calendar },
              { label: "Planilha de Exportação", icon: BarChart3 },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="bg-primary text-white w-full pl-4 py-3 rounded-md flex flex-row justify-start items-center font-medium text-sm uppercase shadow-lg gap-2 text-left cursor-pointer active:scale-[.98] transition-all"
              >
                <Icon className="w-4 h-4 opacity-80" />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* 9. Stats Cards — Cards de Estatísticas */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <BarChart3 className="w-4 h-4 text-field-green" />
            <h2>Stats Cards — Cards de Estatísticas</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Cards de métricas usados em sumários e dashboards. Número em
            destaque com{" "}
            <code className="font-mono text-primary font-bold">text-[var(--indi-ouro)]</code>
            {" "}e label em{" "}
            <code className="font-mono text-primary font-bold">text-white/85</code>
            {" "}(fundo primário).
          </p>

          <div className="rounded-2xl bg-primary p-3 space-y-2">
            {/* Total */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-md border border-white/20">
              <span className="text-sm text-white/85 font-extrabold">Total de animais</span>
              <strong className="text-[var(--indi-ouro)] text-2xl font-extrabold leading-none">142</strong>
            </div>

            {/* Breakdown por sexo */}
            <div className="grid grid-cols-2 gap-3 p-1">
              {[
                { label: "Machos", total: 58, ages: [12, 18, 14, 14] },
                { label: "Fêmeas", total: 84, ages: [20, 26, 22, 16] },
              ].map(({ label, total, ages }) => (
                <div key={label}>
                  <div className="mb-1 flex items-end justify-between gap-4 pb-1 text-xs text-[var(--indi-ouro)] font-extrabold border-b border-white/20">
                    <span className="font-bold text-white/85">{label}</span>
                    <strong className="text-[15px] text-[var(--indi-ouro)]">{total}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["0-12m", "13-24m", "25-36m", "+36m"].map((range, i) => (
                      <div
                        key={range}
                        className="px-1 py-1.5 flex flex-col justify-center items-center border border-white rounded-[8px] bg-transparent"
                      >
                        <strong className="text-[var(--indi-ouro)] text-base leading-none">{ages[i]}</strong>
                        <span className="mt-0.5 text-white/85 text-[9px] font-bold">{range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Mobile Footer Nav */}
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Navigation className="w-4 h-4 text-field-green" />
            <h2>Mobile Footer Nav — Barra de Navegação</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Barra fixa inferior usada em todas as telas protegidas.
            Item ativo recebe{" "}
            <code className="font-mono text-primary font-bold">text-field-green font-extrabold</code>;
            inativo usa{" "}
            <code className="font-mono text-primary font-bold">text-[#809086]</code>.
          </p>

          <div className="bg-white/95 border border-border rounded-xl flex justify-between gap-4 px-6 py-1.5">
            {[
              { label: "Início", icon: Home, active: true },
              { label: "Calendário", icon: CalendarDays, active: false },
              { label: "Cadastro", icon: ClipboardPen, active: false },
              { label: "Perfil", icon: UserRound, active: false },
            ].map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={`rounded-[14px] flex flex-col items-center justify-center gap-1 text-[9px] cursor-pointer transition-all ${
                  active
                    ? "text-field-green font-extrabold"
                    : "text-[#809086]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="tracking-tight uppercase">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal / Dialog de Confirmação Canônico */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card rounded-2xl border border-border/60 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber" />
              Diálogo de Confirmação Canônico
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Este é o modelo oficial de modal para ações destrutivas ou de revisão importante no INDI Ouro 2.0.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-field-green text-white hover:bg-field-green/90 font-bold"
              onClick={() => {
                setModalOpen(false);
                toast.success("Ação confirmada!");
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}