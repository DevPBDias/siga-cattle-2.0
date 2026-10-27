"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormRow } from "@/components/ui/FormRow";

import { isFutureDate, toISODate } from "@/utils/dates";

interface AddPesoModalProps {
  onAddPeso: (mes: string, valor: number) => void;
  type: "peso" | "circunferencia";
  isBorn?: boolean;
  setIsBorn?: (value: boolean) => void;
  bornDate?: string;
  lastValue?: number;
}

export function AddPesoModal({
  onAddPeso,
  type,
  isBorn,
  setIsBorn,
  bornDate,
  lastValue,
}: AddPesoModalProps) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valor.trim() && data.trim()) {
      if (isFutureDate(data)) {
        alert("A data da medição não pode ser no futuro.");
        return;
      }

      const isoDate = toISODate(data);
      onAddPeso(isoDate, Number(valor));
      setValor("");
      setData("");
      setOpen(false);
    }
  };

  const handleBornChange = (checked: boolean) => {
    setIsBorn?.(checked);

    if (checked && bornDate) {
      setData(toISODate(bornDate));
    } else {
      setData("");
    }
  };

  const isPeso = type === "peso";
  const title = isPeso ? "Adicionar Peso" : "Adicionar Circunferência Escrotal";
  const description = isPeso
    ? "Informe o peso em kg e a data da pesagem."
    : "Informe a circunferência em cm e a data da medição.";
  const unit = isPeso ? "kg" : "cm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="default" variant="default" className="bg-primary">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95%] max-h-[90vh] rounded-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left text-primary font-bold uppercase">
            {title}
          </DialogTitle>
          <DialogDescription className="flex w-full items-center justify-between gap-2 text-left text-sm">
            <span>{description}</span>
            {lastValue !== undefined && lastValue > 0 && (
              <span className="shrink-0 rounded border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                LTC: {lastValue} {unit}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <FormRow label={`Valor (${unit})`} htmlFor="valor" required>
              <Input
                id="valor"
                type="number"
                step="0.1"
                value={valor}
                className="h-11 placeholder:text-xs border-0 bg-muted/40"
                onChange={(e) => setValor(e.target.value)}
                placeholder={`Valor em ${unit}`}
                required
              />
            </FormRow>

            <FormRow label="Data da medição" required>
              <DatePicker value={data} onChange={setData} required />
            </FormRow>

            <FormRow
              label={isPeso ? "Peso nascimento?" : "Medição inicial?"}
              htmlFor="born_metric"
            >
              <Checkbox
                id="born_metric"
                checked={isBorn}
                onCheckedChange={(checked) =>
                  handleBornChange(checked === true)
                }
              />
            </FormRow>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full text-xs font-bold uppercase tracking-wider"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-11 w-full bg-primary text-xs font-black uppercase tracking-wider shadow-md hover:bg-primary/90"
              disabled={!valor.trim() || !data.trim()}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
