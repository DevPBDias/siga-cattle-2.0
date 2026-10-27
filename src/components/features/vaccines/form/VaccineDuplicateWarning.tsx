"use client";

import { AlertTriangle } from "lucide-react";

interface VaccineDuplicateWarningProps {
  duplicates: string[];
}

export function VaccineDuplicateWarning({ duplicates }: VaccineDuplicateWarningProps) {
  if (duplicates.length === 0) return null;

  return (
    <div className="bg-amber/10 border border-amber/30 rounded-xl p-3 flex items-start gap-2">
      <AlertTriangle size={16} className="text-amber mt-0.5 shrink-0" />
      <div className="text-xs text-amber">
        <span className="font-bold block mb-0.5">Atenção: Possível duplicação</span>
        <span>
          As seguintes vacinas já foram aplicadas neste animal:{" "}
          <strong>{duplicates.join(", ")}</strong>
        </span>
      </div>
    </div>
  );
}
