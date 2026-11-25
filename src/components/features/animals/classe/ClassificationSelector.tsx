"use client";

import { Check } from "lucide-react";

interface ClassificationSelectorProps {
  selectedClassificationName: string | null;
  onToggle: (name: string | null) => void;
}

const CLASSIFICATION_OPTIONS = ["A", "B", "C", "D"];

export function ClassificationSelector({
  selectedClassificationName,
  onToggle,
}: ClassificationSelectorProps) {
  return (
    <div className="flex flex-col justify-start items-start w-full gap-2">
      <label className="text-primary font-bold text-sm uppercase w-full text-left">
        Classe visual:
      </label>
      <div className="grid grid-cols-2 gap-3 w-full">
        {CLASSIFICATION_OPTIONS.map((name) => {
          const isSelected = selectedClassificationName === name;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onToggle(isSelected ? null : name)}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.01] active:scale-[0.99] ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span
                className={`text-sm font-bold uppercase transition-colors ${
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
                {isSelected && (
                  <Check className="h-3.5 w-3.5" strokeWidth={4} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
