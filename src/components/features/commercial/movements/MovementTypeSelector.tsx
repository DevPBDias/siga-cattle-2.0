"use client";

import { MovementType } from "@/types/movement.type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CreateMovementType = Exclude<MovementType, "nascimento">;

interface MovementTypeSelectorProps {
  value: CreateMovementType | "";
  onChange: (value: CreateMovementType) => void;
}

export function MovementTypeSelector({ value, onChange }: MovementTypeSelectorProps) {
  return (
    <div className="mb-5 space-y-2">
      <label className="text-xs font-semibold uppercase text-primary">
        Tipo de movimentação
      </label>
      <Select value={value} onValueChange={(next) => onChange(next as CreateMovementType)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="morte">Morte</SelectItem>
          <SelectItem value="venda">Venda</SelectItem>
          <SelectItem value="troca">Troca</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
