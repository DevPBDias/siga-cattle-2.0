"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ReproductionEvent,
  EventType,
  ReproductionStatus,
  OvarySize,
  OvaryStructure,
  CycleStage,
  Diagnostic,
  PregnancyOrigin,
} from "@/types/reproduction_event.type";
import { Loader2 } from "lucide-react";
import { SemenDoseSelector } from "@/components/features/doses/SemenDoseSelector";
import { formatDate, DateOnly } from "@/utils/dates";
import { FormRow } from "@/components/ui/FormRow";
import { useNaturalBulls } from "@/hooks/db/animals/useNaturalBulls";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

/* -------------------------------------------------------------------------- */
/* Opções                                                                      */
/* -------------------------------------------------------------------------- */

interface Option<T extends string = string> {
  value: T;
  label: string;
}

const PROTOCOLS: Option[] = [
  { value: "Sync D10", label: "Sync D10" },
  { value: "Sync D11", label: "Sync D11" },
];

const BODY_SCORES: Option[] = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: String(n),
}));

const CYCLE_STAGES: Option<CycleStage>[] = [
  { value: "Estro", label: "Estro" },
  { value: "Anestro 1", label: "Anestro 1" },
  { value: "Anestro 2", label: "Anestro 2" },
];

const OVARY_SIZES: Option<OvarySize>[] = [
  { value: "normal", label: "Normal" },
  { value: "pequeno", label: "Pequeno" },
  { value: "grande", label: "Grande" },
];

const OVARY_STRUCTURES: Option<OvaryStructure>[] = [
  { value: "Folículo", label: "Folículo" },
  { value: "Corpo Lúteo", label: "Corpo Lúteo" },
  { value: "Cisto", label: "Cisto" },
];

const REPRODUCTION_STATUS: Option<ReproductionStatus>[] = [
  { value: "parida", label: "Parida" },
  { value: "solteira", label: "Solteira" },
];

const DIAGNOSTICS: Option<Diagnostic>[] = [
  { value: "prenha", label: "Prenha" },
  { value: "vazia", label: "Vazia" },
];

/* -------------------------------------------------------------------------- */
/* Componentes auxiliares                                                      */
/* -------------------------------------------------------------------------- */

function SelectField<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecione",
}: {
  id?: string;
  value?: string | null;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
}) {
  return (
    <Select value={value || ""} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger id={id} className="w-full border-0 bg-muted/40 text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const DateBox = ({ items }: { items: { label: string; date?: string | null }[] }) => (
  <div className="flex w-full justify-between gap-2 rounded-md border border-primary/60 p-2">
    {items.map((item) => (
      <p
        key={item.label}
        className="flex w-fit items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
      >
        {item.label}
        <span className="text-center text-sm font-normal text-primary">
          {item.date ? formatDate(item.date) : "—"}
        </span>
      </p>
    ))}
  </div>
);

function CheckboxRow({
  id,
  checked,
  onCheckedChange,
  label,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="w-full flex items-center gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        className=" border-1 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wide text-primary cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}

function Section({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className="rounded-md border border-primary/70 px-2">
      <AccordionTrigger className="py-2 text-[11px] font-bold uppercase text-muted-foreground hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2.5 pb-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* -------------------------------------------------------------------------- */
/* Formulário principal                                                        */
/* -------------------------------------------------------------------------- */

interface ReproductionFormProps {
  initialData?: Partial<ReproductionEvent>;
  onSubmit: (data: Partial<ReproductionEvent>) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
  onCancel: () => void;
}

export function ReproductionForm({
  initialData,
  onSubmit,
  isLoading,
  isEdit,
  onCancel,
}: ReproductionFormProps) {
  // Em edição o tipo já está definido; em criação começa vazio
  const [selectedType, setSelectedType] = useState<EventType | "">(
    initialData?.event_type ?? "",
  );

  const [formData, setFormData] = useState<Partial<ReproductionEvent>>({
    d0_date: "",
    bull_name: "",
    protocol_name: "",
    ...initialData,
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
      if (initialData.event_type) setSelectedType(initialData.event_type);
    }
  }, [initialData]);

  const [showResync, setShowResync] = useState(
    !!(initialData?.resync_bull || initialData?.d32_date),
  );
  const [showNaturalMating, setShowNaturalMating] = useState(
    !!(initialData?.natural_mating_bull),
  );

  const isIATF = selectedType === "IATF" || selectedType === "FIV";
  const isNaturalMating = selectedType === "Monta natural";
  const isD11 = formData.protocol_name === "Sync D11";
  const protocolLabel = isD11 ? "Sync D11" : "Sync D10";

  const pregnancyOriginOptions: Option<PregnancyOrigin>[] = [
    { value: "d10", label: protocolLabel },
    { value: "resync", label: isD11 ? "Resync D34" : "Resync D32" },
    {
      value: "natural_mating",
      label: isD11 ? "Monta Natural D37-D82" : "Monta Natural D35-D80",
    },
  ];

  const { bullOptions: naturalBulls = [], loading: naturalBullsLoading } =
    useNaturalBulls({ onlyActive: true });

  const naturalBullOptions = useMemo(() => {
    const list: Option[] = naturalBulls.map((b) => ({
      value: b.value,
      label: b.label,
    }));
    if (
      formData.natural_mating_bull &&
      !list.some((o) => o.value === formData.natural_mating_bull)
    ) {
      list.unshift({
        value: formData.natural_mating_bull,
        label: `${formData.natural_mating_bull} (atual)`,
      });
    }
    return list;
  }, [naturalBulls, formData.natural_mating_bull]);

  /* ----------------------------- Cálculos --------------------------------- */

  const calculateCalvingDates = (
    origin: PregnancyOrigin,
    dates: Partial<ReproductionEvent>,
  ) => {
    let startBase: DateOnly | undefined;
    let endBase: DateOnly | undefined;
    switch (origin) {
      case "d10":
        if (dates.d10_date) { startBase = DateOnly.fromISO(dates.d10_date); endBase = startBase; }
        break;
      case "resync":
        if (dates.d32_date) { startBase = DateOnly.fromISO(dates.d32_date); endBase = startBase; }
        break;
      case "natural_mating":
        if (dates.natural_mating_d35_entry && dates.natural_mating_d80_exit) {
          startBase = DateOnly.fromISO(dates.natural_mating_d35_entry);
          endBase = DateOnly.fromISO(dates.natural_mating_d80_exit);
        }
        break;
    }
    if (!startBase || !endBase) return {};
    const calvingStart = startBase.addDays(280);
    const calvingEnd = origin === "natural_mating" ? endBase.addDays(280) : endBase.addDays(315);
    return { calving_start_date: calvingStart.toISO(), calving_end_date: calvingEnd.toISO() };
  };

  const calculateDServices = (d0Date: string, protocolName = "Sync D10") => {
    if (!d0Date) return {};
    const d0 = DateOnly.fromISO(d0Date);
    const d11 = protocolName === "Sync D11";
    return {
      d8_date: d0.addDays(d11 ? 9 : 8).toISO(),
      d10_date: d0.addDays(d11 ? 11 : 10).toISO(),
      d22_date: d0.addDays(d11 ? 34 : 32).toISO(),
      d30_date: d0.addDays(d11 ? 42 : 40).toISO(),
      d32_date: d0.addDays(d11 ? 44 : 42).toISO(),
      natural_mating_d35_entry: d0.addDays(d11 ? 47 : 45).toISO(),
      natural_mating_d80_exit: d0.addDays(d11 ? 92 : 90).toISO(),
      d110_date: d0.addDays(120).toISO(),
    };
  };

  const handleChange = (field: keyof ReproductionEvent, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if ((field === "d0_date" && value) || field === "protocol_name") {
        const d0 = field === "d0_date" ? value : prev.d0_date;
        const protocol = field === "protocol_name" ? value : prev.protocol_name;
        if (d0) Object.assign(newData, calculateDServices(d0, protocol));
        if (!newData.pregnancy_origin) newData.pregnancy_origin = "d10";
      }
      const relevantFields: (keyof ReproductionEvent)[] = [
        "pregnancy_origin", "protocol_name", "d0_date",
        "natural_mating_d35_entry", "natural_mating_d80_exit",
      ];
      if (relevantFields.includes(field) && newData.pregnancy_origin) {
        Object.assign(newData, calculateCalvingDates(newData.pregnancy_origin, newData));
      }
      return newData;
    });
  };

  const handleTypeSelect = (type: EventType) => {
    setSelectedType(type);
    handleChange("event_type", type);
  };

  /** Ao checar/desmarcar Resync — atualiza pregnancy_origin e recalcula parto */
  const handleResyncToggle = (checked: boolean) => {
    setShowResync(checked);
    setFormData((prev) => {
      // Monta natural tem prioridade sobre resync
      const origin: PregnancyOrigin = showNaturalMating
        ? "natural_mating"
        : checked
        ? "resync"
        : "d10";
      const newData = { ...prev, pregnancy_origin: origin };
      Object.assign(newData, calculateCalvingDates(origin, newData));
      return newData;
    });
  };

  /** Ao checar/desmarcar Monta Natural — tem prioridade máxima na base de cálculo */
  const handleNaturalMatingToggle = (checked: boolean) => {
    setShowNaturalMating(checked);
    setFormData((prev) => {
      const origin: PregnancyOrigin = checked
        ? "natural_mating"
        : showResync
        ? "resync"
        : "d10";
      const newData = { ...prev, pregnancy_origin: origin };
      Object.assign(newData, calculateCalvingDates(origin, newData));
      return newData;
    });
  };

  const cleanData = (data: Partial<ReproductionEvent>) => {
    const cleaned = { ...data };
    // @ts-ignore
    delete cleaned.d35_date;
    // @ts-ignore
    delete cleaned.d80_date;
    (Object.keys(cleaned) as Array<keyof ReproductionEvent>).forEach((key) => {
      if (cleaned[key] === "") {
        // @ts-ignore
        cleaned[key] = undefined;
      }
    });
    return cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(cleanData(formData));
  };

  /* -------------------------------- Render -------------------------------- */

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* ── Seletor de tipo — sempre visível, igual ao padrão de movimentações ── */}
      <div className="space-y-2 grid grid-cols-2 items-center px-2">
        <label className="text-xs font-semibold uppercase text-primary">
          Tipo de evento
        </label>
        <Select
          value={selectedType}
          onValueChange={(v) => handleTypeSelect(v as EventType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IATF">IATF</SelectItem>
            <SelectItem value="FIV">FIV</SelectItem>
            <SelectItem value="Monta natural">Monta Natural</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Formulário aparece apenas após selecionar o tipo ── */}
      {selectedType !== "" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2 ">
          <Accordion
            type="multiple"
            defaultValue={["event-data", "bull-section", "diagnostic-section"]}
            className="space-y-2"
          >
            {/* ── 1. Dados do Evento ─────────────────────────────────── */}
            <Section value="event-data" title="Dados do Evento">
              <FormRow label="Data D0" required>
                <DatePicker
                  value={formData.d0_date || ""}
                  onChange={(v) => handleChange("d0_date", v)}
                  required
                />
              </FormRow>

              {isIATF && (
                <FormRow label="Protocolo" htmlFor="protocol_name">
                  <SelectField
                    id="protocol_name"
                    value={formData.protocol_name}
                    onChange={(v) => handleChange("protocol_name", v)}
                    options={PROTOCOLS}
                    placeholder="Selecione"
                  />
                </FormRow>
              )}

              {isIATF && formData.d0_date && (
                <DateBox
                  items={[
                    { label: isD11 ? "D9" : "D8", date: formData.d8_date },
                    { label: isD11 ? "D11" : "D10", date: formData.d10_date },
                  ]}
                />
              )}
              {isIATF && (
                <FormRow label="Touro IA">
                  <SemenDoseSelector
                    value={formData.bull_name || ""}
                    onValueChange={(name) => handleChange("bull_name", name)}
                    placeholder="Selecione o touro"
                  />
                </FormRow>
            )}
                        {isIATF && (
              <>
                <FormRow
                  label={`Diagnóstico (${isD11 ? "D32" : "D30"})`}
                  hint={formatDate(formData.d30_date)}
                  htmlFor="diagnostic_d30"
                >
                  <SelectField
                    id="diagnostic_d30"
                    value={formData.diagnostic_d30}
                    onChange={(v) => handleChange("diagnostic_d30", v)}
                    options={DIAGNOSTICS}
                    placeholder="Status"
                  />
                </FormRow>
                {formData.d22_date && (
                  <DateBox
                    items={[{ label: `Resync ${isD11 ? "D23" : "D22"}`, date: formData.d22_date }]}
                  />
                )}
              </>
            )}

                                      <FormRow label="Diagnóstico Final" htmlFor="final_diagnostic">
                <SelectField
                  id="final_diagnostic"
                  value={formData.final_diagnostic}
                  onChange={(v) => handleChange("final_diagnostic", v)}
                  options={DIAGNOSTICS}
                  placeholder="Pendente"
                />
              </FormRow>

                        {/* ── 5. Resync + Monta Natural (checkboxes) — só IATF/FIV ─ */}
            {isIATF && (
              <div className="border-t border-primary/40 py-2 space-y-1">
                <CheckboxRow
                  id="show_resync"
                  checked={showResync}
                  onCheckedChange={handleResyncToggle}
                  label="Realizar Resync"
                />
                {showResync && (
                  <div className="space-y-2.5 pt-1">
                    {formData.d30_date && (
                      <DateBox
                        items={[
                          { label: isD11 ? "D32" : "D30", date: formData.d30_date },
                          { label: `IA ${isD11 ? "D34" : "D32"}`, date: formData.d32_date },
                        ]}
                      />
                    )}
                    <FormRow label="Touro Resync">
                      <SemenDoseSelector
                        value={formData.resync_bull || ""}
                        onValueChange={(name) => handleChange("resync_bull", name)}
                        placeholder="Selecione o touro"
                      />
                    </FormRow>
                  </div>
                )}

                <div className="h-px bg-border/40" />

                <CheckboxRow
                  id="show_natural_mating"
                  checked={showNaturalMating}
                  onCheckedChange={handleNaturalMatingToggle}
                  label="Realizar Monta Natural"
                />
                {showNaturalMating && (
                  <div className="pt-1">
                    <FormRow label="Touro" htmlFor="natural_mating_bull">
                      <SelectField
                        id="natural_mating_bull"
                        value={formData.natural_mating_bull}
                        onChange={(name) => handleChange("natural_mating_bull", name)}
                        options={naturalBullOptions}
                        placeholder={
                          naturalBullsLoading ? "Carregando..." :
                          naturalBullOptions.length > 0 ? "Selecione o touro" : "Nenhum touro ativo"
                        }
                      />
                    </FormRow>
                  </div>
                )}
              </div>
            )}

            {/* ── Touro para Monta Natural como tipo principal ────────── */}
            {isNaturalMating && (
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold uppercase text-muted-foreground">Touro de Monta</p>
                <FormRow label="Touro" htmlFor="natural_bull_main">
                  <SelectField
                    id="natural_bull_main"
                    value={formData.natural_mating_bull}
                    onChange={(name) => handleChange("natural_mating_bull", name)}
                    options={naturalBullOptions}
                    placeholder={naturalBullsLoading ? "Carregando..." : "Selecione o touro"}
                  />
                </FormRow>
              </div>
            )}


              {/* Base de cálculo definida automaticamente pelos checkboxes */}
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Base de cálculo
                </span>
                <span className="text-xs font-semibold text-primary">
                  {formData.pregnancy_origin === "resync"
                    ? isD11 ? "Resync D34" : "Resync D32"
                    : formData.pregnancy_origin === "natural_mating"
                    ? "Monta Natural"
                    : isD11 ? "Sync D11" : "Sync D10"}
                </span>
              </div>
              {formData.calving_start_date && (
                <DateBox
                  items={[
                    { label: "Início", date: formData.calving_start_date },
                    { label: "Fim", date: formData.calving_end_date },
                  ]}
                />
              )}
            </Section>

            {/* ── 4. Avaliação Reprodutiva — fechada por padrão ──────── */}
            <Section value="reproductive-eval" title="Avaliação Reprodutiva">
              <FormRow label="Data Avaliação">
                <DatePicker
                  value={formData.evaluation_date || ""}
                  onChange={(v) => handleChange("evaluation_date", v)}
                />
              </FormRow>
              <FormRow label="Score Corporal" htmlFor="body_score">
                <SelectField
                  id="body_score"
                  value={formData.body_score?.toString()}
                  onChange={(v) => handleChange("body_score", parseInt(v))}
                  options={BODY_SCORES}
                />
              </FormRow>
              <FormRow label="Ciclo Estral" htmlFor="cycle_stage">
                <SelectField
                  id="cycle_stage"
                  value={formData.cycle_stage}
                  onChange={(v) => handleChange("cycle_stage", v)}
                  options={CYCLE_STAGES}
                />
              </FormRow>
              <FormRow label="Tamanho Ovários" htmlFor="ovary_size">
                <SelectField
                  id="ovary_size"
                  value={formData.ovary_size}
                  onChange={(v) => handleChange("ovary_size", v)}
                  options={OVARY_SIZES}
                />
              </FormRow>
              <FormRow label="Estrutura Ovários" htmlFor="ovary_structure">
                <SelectField
                  id="ovary_structure"
                  value={formData.ovary_structure}
                  onChange={(v) => handleChange("ovary_structure", v)}
                  options={OVARY_STRUCTURES}
                />
              </FormRow>
              <FormRow label="Status Reprodutivo" htmlFor="productive_status">
                <SelectField
                  id="productive_status"
                  value={formData.productive_status}
                  onChange={(v) => handleChange("productive_status", v)}
                  options={REPRODUCTION_STATUS}
                />
              </FormRow>
            </Section>
          </Accordion>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-8 w-full mt-2 bg-primary text-xs font-black uppercase tracking-wider shadow-md hover:bg-primary/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Salvar Alterações" : "Cadastrar Evento"}
          </Button>
        </div>
      )}
    </form>
  );
}
