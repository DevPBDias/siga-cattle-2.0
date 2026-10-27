"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgendaItem } from "@/types/agenda.type";
import { AgendaEventRow } from "@/components/features/agenda/lists/AgendaEventRow";
import { formatDate } from "@/utils/dates";

interface AgendaDaySheetProps {
  date: string | null;
  items: AgendaItem[];
  onClose: () => void;
  onSchedule: () => void;
}

export function AgendaDaySheet({ date, items, onClose, onSchedule }: AgendaDaySheetProps) {
  return (
    <Dialog open={Boolean(date)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm bg-card rounded-2xl border border-border/60">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-primary tracking-tight">
            {date ? formatDate(date) : "Dia"}
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum evento neste dia. Você pode agendar um lembrete agora.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {items.map((item) => (
              <AgendaEventRow key={item.id} item={item} />
            ))}
          </div>
        )}

        <DialogFooter className="flex flex-row gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
            Fechar
          </Button>
          <Button className="flex-1 rounded-xl" onClick={onSchedule}>
            Agendar neste dia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
