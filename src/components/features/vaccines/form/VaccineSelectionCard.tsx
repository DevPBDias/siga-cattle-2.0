"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VaccinesMultiSelect } from "@/components/features/vaccines/vaccines/VaccinesMultiSelect";
import { Vaccine } from "@/types/vaccine.type";

interface VaccineSelectionCardProps {
  vaccines: Vaccine[];
  loading: boolean;
  selected: string[];
  onToggle: (name: string, checked: boolean) => void;
  onAddClick: () => void;
  onDeleteClick: () => void;
}

export function VaccineSelectionCard({
  vaccines,
  loading,
  selected,
  onToggle,
  onAddClick,
  onDeleteClick,
}: VaccineSelectionCardProps) {
  return (
    <section className="p-3.5 border border-border rounded-[15px] bg-card shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-extrabold uppercase text-primary">Vacinas: *</label>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAddClick}
            aria-label="Adicionar vacina ao catálogo"
            className="h-6 w-6 border-border bg-background text-primary hover:bg-field-green/10 hover:text-field-green"
          >
            <Plus size={14} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onDeleteClick}
            disabled={vaccines.length === 0}
            aria-label="Gerenciar exclusão de vacinas"
            className="h-6 w-6 border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <VaccinesMultiSelect
        vaccines={vaccines}
        loading={loading}
        selected={selected}
        onToggle={onToggle}
      />
    </section>
  );
}
