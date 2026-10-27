"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Edit2, Trash2, Info, Activity, ChevronDownIcon } from "lucide-react";
import { formatDate, formatAge } from "@/utils/dates";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { Animal } from "@/types/animal.type";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { InfoRow, InfoRowProps } from "./parts/InfoRow";
import { InfoSection } from "./parts/InfoSection";
import { DiagnosticBadge } from "./parts/DiagnosticBadge";
import { PhasesTabs } from "./parts/PhasesTabs";
import { CalvingForecast } from "./parts/CalvingForecast";
import { getProtocolConfig } from "./reproduction.config";

interface ReproductionEventCardProps {
  event: ReproductionEvent;
  matriz: Animal;
  onEdit?: (event: ReproductionEvent) => void;
  onDelete?: (eventId: string) => void;
}

export const ReproductionEventCard = ({
  event,
  matriz,
  onEdit,
  onDelete,
}: ReproductionEventCardProps) => {
  const protocol = getProtocolConfig(event.protocol_name);
  const diagnosticResult = event.final_diagnostic || event.diagnostic_d30;
  const d10Date = event.d10_date || event.d0_date;
  const d10Formatted = d10Date ? formatDate(d10Date) : "";

  const generalRows: InfoRowProps[] = [
    { label: "Idade", value: formatAge(matriz?.born_date) },
    { label: "Genotipagem", value: matriz?.genotyping || "Não" },
    {
      label: "Status Reprodutivo",
      value: event.productive_status || "Solteira",
    },
  ];

  const evaluationRows: InfoRowProps[] = [
    { label: "Protocolo", value: event.protocol_name || "Padrão D10" },
    { label: "Escore Corporal", value: event.body_score, subLabel: "(1 a 5)" },
    { label: "Ovários (tamanho)", value: event.ovary_size || "Normais" },
    { label: "Ovários (estruturas)", value: event.ovary_structure },
    { label: "Estágio Ciclo Estral", value: event.cycle_stage },
    { label: protocol.diagnosticLabel, value: event.diagnostic_d30 },
    {
      label: "Diagnóstico Final (D110)",
      value: event.final_diagnostic,
      highlight: true,
    },
  ];

  return (
    <AccordionItem
      value={`iatf-${event.event_id}`}
      className="border border-border/80 bg-card rounded-md overflow-hidden mb-1 shadow-xs w-full"
    >
      <AccordionPrimitive.Header className="flex items-center justify-between px-3.5 py-1 hover:bg-primary/5 transition-all w-full border-b border-transparent data-[state=open]:border-border/40">
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className="flex flex-1 items-center gap-2 text-left focus-visible:outline-none min-w-0 pr-1 group cursor-pointer [&[data-state=open]>svg]:rotate-180"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-primary font-black text-sm uppercase tracking-tight shrink-0">
              {event.event_type}
            </span>
            <div className="h-3.5 w-px bg-primary/20 shrink-0" />
            <span className="text-muted-foreground text-xs font-bold shrink-0">
              {d10Formatted ? `D10: ${d10Formatted}` : "Sem data"}
            </span>
            <DiagnosticBadge result={diagnosticResult} />
          </div>

          <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 ml-auto" />
        </AccordionPrimitive.Trigger>

        <div className="flex items-center gap-1.5 shrink-0 ml-2 pl-2 border-l border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label="Editar evento de reprodução"
            title="Editar"
            onClick={() => onEdit?.(event)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            aria-label="Excluir evento de reprodução"
            title="Excluir"
            onClick={() => onDelete?.(event.event_id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </AccordionPrimitive.Header>

      <AccordionContent className="w-full px-3.5 py-2 space-y-2">
        <Accordion type="multiple" className="w-full space-y-2">
          <InfoSection
            value="general"
            icon={Info}
            title="Informações Gerais da Matriz"
          >
            {generalRows.map((row) => (
              <InfoRow key={row.label} {...row} />
            ))}
          </InfoSection>

          <InfoSection
            value="evaluation"
            icon={Activity}
            title="Avaliação Reprodutiva da Matriz"
          >
            {evaluationRows.map((row) => (
              <InfoRow key={row.label} {...row} />
            ))}
          </InfoSection>
        </Accordion>

        <PhasesTabs event={event} protocol={protocol} />

        <CalvingForecast
          startDate={event.calving_start_date}
          endDate={event.calving_end_date}
        />
      </AccordionContent>
    </AccordionItem>
  );
};
