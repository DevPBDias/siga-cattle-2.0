"use client";

import { FarmsCheckboxList } from "./FarmsCheckboxList";
import { FarmManagerActions } from "./FarmManagerActions";
import { Farm } from "@/types/farm.type";

interface FarmSelectorProps {
  farms: Farm[];
  loading: boolean;
  selectedFarmId: string | null;
  onToggle: (id: string | null) => void;
  onAddClick: () => void;
  onDeleteClick: () => void;
}

export function FarmSelector({
  farms,
  loading,
  selectedFarmId,
  onToggle,
  onAddClick,
  onDeleteClick,
}: FarmSelectorProps) {
  return (
    <div className="flex flex-col justify-start items-start w-full gap-2">
      <div className="flex flex-row justify-between items-center w-full gap-2">
        <label
          htmlFor="fazendas"
          className="text-primary font-bold text-sm uppercase w-full text-left"
        >
          Fazenda/Pasto:
        </label>
        <FarmManagerActions
          onAddClick={onAddClick}
          onDeleteClick={onDeleteClick}
          disabled={farms.length === 0}
        />
      </div>
      <FarmsCheckboxList
        farms={farms}
        loading={loading}
        selected={selectedFarmId}
        onToggle={onToggle}
      />
    </div>
  );
}
