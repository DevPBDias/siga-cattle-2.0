"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { ReproductionEventCard } from "@/components/features/reproduction/ReproductionEventCard";
import { Animal } from "@/types/animal.type";
import { ReproductionEvent } from "@/types/reproduction_event.type";

interface ReproductionEventListProps {
  matriz: Animal;
  events: ReproductionEvent[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (event: ReproductionEvent) => void;
  onDelete: (eventId: string) => void;
}

export function ReproductionEventList({
  matriz,
  events,
  loading,
  onCreate,
  onEdit,
  onDelete,
}: ReproductionEventListProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button
        onClick={onCreate}
        className="w-full py-5 text-sm font-bold uppercase shadow-md shadow-primary/20"
      >
        <Plus className="w-5 h-5 mr-2" />
        Novo Evento
      </Button>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs uppercase text-muted-foreground">
            Histórico de Reprodução
          </h3>
          {events.length > 0 && (
            <span className="text-xs text-muted-foreground font-semibold">
              {events.length} {events.length === 1 ? "evento" : "eventos"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary w-6 h-6" />
          </div>
        ) : events.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-3">
            {events.map((event) => (
              <ReproductionEventCard
                key={event.event_id}
                event={event}
                matriz={matriz}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
            <p className="text-sm">Nenhum evento registrado para esta matriz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
