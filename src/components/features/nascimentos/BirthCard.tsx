import { cn } from "@/lib/utils";
import { Animal } from "@/types/animal.type";
import {
  BirthDateParts,
  formatBirthDate,
  SEX_LABEL,
} from "@/utils/birth.utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BirthCardProps {
  animal: Animal;
  date: BirthDateParts;
  farmName?: string;
  /** Peso ao nascer em kg, vindo de animal_metrics_weight */
  birthWeightKg?: number | null;
  /** Usuário responsável pelo registro (created_by) */
  createdBy?: string | null;
}

const Field = ({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) => (
  <div
    className={cn(
      "flex min-w-0 items-center justify-between gap-2 border-b border-border/50 py-1 last:border-b-0",
      className,
    )}
  >
    <dt className="text-[9px] font-bold uppercase text-muted-foreground shrink-0">
      {label}
    </dt>
    <dd className="m-0 truncate text-right text-[11px] font-semibold text-primary">
      {value || "-"}
    </dd>
  </div>
);

export function BirthCard({
  animal,
  date,
  farmName,
  birthWeightKg,
  createdBy,
}: BirthCardProps) {
  const isMale = animal.sex === "M";
  const animalName = `${animal.serie_rgd ?? ""} ${animal.rgn}`.trim();
  const motherName =
    `${animal.mother_serie_rgd ?? ""} ${animal.mother_rgn ?? ""}`.trim() ||
    null;
  const pesoFormatado =
    birthWeightKg != null ? `${birthWeightKg.toFixed(1)} kg` : null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value="birth"
        className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
      >
        <AccordionTrigger
          className="flex w-full items-center justify-between px-3 py-2.5 hover:no-underline hover:bg-primary/5 transition-all [&>svg]:ml-0 [&>svg]:shrink-0"
          aria-label={`Ver detalhes do nascimento ${animalName}`}
        >
          <div className="flex flex-1 min-w-0 items-center gap-2">
            {/* Badge de sexo */}
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase",
                isMale
                  ? "border-sky-200 bg-sky-100 text-sky-700"
                  : "border-rose-200 bg-rose-100 text-rose-700",
              )}
            >
              {SEX_LABEL[animal.sex ?? ""] ?? "-"}
            </span>

            {/* Nome + data */}
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-tight text-primary truncate">
                {animalName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatBirthDate(date)}
              </p>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-3 pb-3 pt-0">
          <dl className="m-0 grid grid-cols-2 gap-x-4">
            <Field label="Mãe" value={motherName} />
            <Field label="Fazenda" value={farmName} />
            <Field label="Peso ao nascer" value={pesoFormatado} />
            <Field label="Sexo" value={SEX_LABEL[animal.sex ?? ""] ?? "-"} />
            <Field
              label="Criado por"
              value={createdBy}
              className="col-span-2"
            />
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
