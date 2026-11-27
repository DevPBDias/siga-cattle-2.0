"use client";

import { Check } from "lucide-react";
import { usePartnerships } from "@/hooks/db/partnerships";

interface PartnershipSelectorProps {
  selectedPartnershipNames: string[];
  onToggle: (name: string) => void;
}

export function PartnershipSelector({
  selectedPartnershipNames,
  onToggle,
}: PartnershipSelectorProps) {
  const { data: partnerships = [] } = usePartnerships();

  return (
    <div className="flex flex-col justify-start items-start w-full gap-2">
      <label className="text-primary font-bold text-sm uppercase w-full text-left">
        Sociedades:
      </label>
      <div className="grid grid-cols-1 gap-2 w-full">
        {partnerships.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center border rounded-xl">
            Nenhum sócio cadastrado.
          </p>
        ) : (
          partnerships.map((partner) => {
            const name = partner.partner_name;
            const isSelected = selectedPartnershipNames.includes(name);

            return (
              <button
                key={partner.id}
                type="button"
                onClick={() => onToggle(name)}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.01] active:scale-[0.99] ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span
                  className={`text-sm font-medium capitalize transition-colors ${
                    isSelected ? "text-primary" : "text-foreground"
                  }`}
                >
                  {name}
                </span>

                <div
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
