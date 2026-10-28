"use client";

import React, { useMemo } from "react";
import { ChevronRight, Beef } from "lucide-react";
import { Animal } from "@/types/animal.type";
import { useFarms } from "@/hooks/db/farms/useFarms";

interface SearchCardProps {
  animal: Animal;
  onDetailsClick?: () => void;
}

export default function SearchCard({
  animal,
  onDetailsClick,
}: SearchCardProps) {
  const { data: farms = [] } = useFarms();

  const farmName = useMemo(() => {
    if (!animal.farm_id) return "SEM DADO";
    const farm = farms.find((f) => f.id === animal.farm_id);
    return farm ? farm.farm_name : "SEM DADO";
  }, [animal.farm_id, farms]);

  const handleDetailsClick = (e: React.MouseEvent) => {
    if (onDetailsClick) {
      e.preventDefault();
      e.stopPropagation();
      onDetailsClick();
    }
  };

  return (
    <article
      className="relative flex items-stretch justify-between gap-2.5 min-h-[126px] p-3 border border-[#dfe6df] rounded-2xl bg-gradient-to-br from-white to-[#f5f9f5] shadow-[0_5px_14px_rgba(30,59,43,0.07)] hover:border-field-green/50 transition-all cursor-pointer"
      aria-label={`Resultado ${animal?.serie_rgd} ${animal?.rgn}`}
      onClick={handleDetailsClick}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-primary text-[17px] font-bold tracking-tight m-0 leading-tight">
              {animal?.serie_rgd || "INDI"} {animal?.rgn}
            </h3>
            {animal?.name && animal.name.trim().toLowerCase() !== `${(animal?.serie_rgd || "INDI").toLowerCase()} ${(animal?.rgn || "").toLowerCase()}` ? (
              <span className="block text-muted-foreground text-[9px] -mt-0.5">
                {animal.name}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="self-end inline-flex items-center gap-0.5 shrink-0 mt-auto p-2 border-0 rounded-lg bg-primary text-white font-bold cursor-pointer hover:bg-field-green transition-colors"
            aria-label={`Ver detalhes de ${animal?.serie_rgd} ${animal?.rgn}`}
            onClick={handleDetailsClick}
          >
            <span className="uppeprcase text-xs">Detalhes</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-2.5 gap-y-1 m-0">
          <div className="flex items-center justify-between min-w-0 border-b border-[#e4ebe4] pb-0.5">
            <dt className="text-[#718074] text-[8px] uppercase font-bold">Status</dt>
            <dd className="m-0 overflow-hidden text-right">
              <span className="m-0 overflow-hidden text-primary text-[10px] font-semibold text-right truncate">
                {animal?.status || "-"}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between min-w-0 border-b border-[#e4ebe4] pb-0.5">
            <dt className="text-[#718074] text-[8px] uppercase font-bold">Fazenda</dt>
            <dd className="m-0 overflow-hidden text-primary text-[10px] font-semibold text-right truncate">
              {farmName}
            </dd>
          </div>
          <div className="flex items-center justify-between min-w-0 border-b border-[#e4ebe4] pb-0.5">
            <dt className="text-[#718074] text-[8px] uppercase font-bold">Atividade</dt>
            <dd className="m-0 overflow-hidden text-primary text-[10px] font-semibold text-right truncate">
              {animal?.animal_state || "-"}
            </dd>
          </div>
          <div className="flex items-center justify-between min-w-0 border-b border-[#e4ebe4] pb-0.5">
            <dt className="text-[#718074] text-[8px] uppercase font-bold">Classe</dt>
            <dd className="m-0 overflow-hidden text-primary text-[10px] font-semibold text-right truncate">
              {animal?.classification || "-"}
            </dd>
          </div>
          <div className="flex items-center justify-between min-w-0 border-b border-[#e4ebe4] pb-0.5">
            <dt className="text-[#718074] text-[8px] uppercase font-bold">Sexo</dt>
            <dd className="m-0 overflow-hidden text-primary text-[10px] font-semibold text-right truncate">
              {animal?.sex || "-"}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
