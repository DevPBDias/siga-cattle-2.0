"use client";

import { Button } from "@/components/ui/button";

interface VaccineFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
}

export function VaccineFormActions({ isSubmitting, onCancel }: VaccineFormActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 pt-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Registrando..." : "Registrar vacina(s)"}
      </Button>
    </div>
  );
}
