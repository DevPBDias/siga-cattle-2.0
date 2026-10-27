"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarEvent, STAGE_METADATA } from "@/types/calendar.types";
import { formatDate } from "@/utils/dates";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
  events: CalendarEvent[];
}

export function CalendarEventModal({
  isOpen,
  onClose,
  date,
  events,
}: CalendarEventModalProps) {
  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background rounded-2xl border-none shadow-2xl">
        <DialogHeader className="bg-primary p-6 text-white shrink-0">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">
              Eventos Sugeridos para
            </span>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
              {formatDate(date)}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-6">
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">
                  Nenhum evento programado para este dia.
                </p>
              </div>
            ) : (
              [...events]
                .sort((a, b) =>
                  a.rgn.localeCompare(b.rgn, undefined, { numeric: true }),
                )
                .map((event, idx) => {
                  const metadata = STAGE_METADATA[event.stage];
                  return (
                    <div
                      key={`${event.eventId}-${event.stage}-${idx}`}
                      className="p-4 rounded-xl border-2 transition-all hover:bg-muted/50 flex flex-col gap-3 group"
                      style={{ borderColor: `${event.color}30` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground uppercase">
                            Matriz:{" "}
                            <span className="text-primary font-black ml-1">
                              {event.rgn}
                            </span>
                          </span>
                          {event.animalName && (
                            <span className="text-sm font-bold text-foreground">
                              {event.animalName}
                            </span>
                          )}
                        </div>
                        <div
                          className="font-black text-[10px] tracking-tighter uppercase px-3 py-1 rounded-full border-2"
                          style={{
                            backgroundColor: `${event.color}15`,
                            color: event.color,
                            borderColor: event.color,
                          }}
                        >
                          {event.stage}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-muted">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                            Protocolo
                          </span>
                          <span className="text-xs font-bold">
                            {event.protocolName}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                            Atividade
                          </span>
                          <span className="text-xs font-bold">
                            {metadata?.description}
                          </span>
                        </div>
                      </div>

                      {event.bullName && (
                        <div className="flex flex-col pt-2 border-t border-muted">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                            Touro / Sêmen
                          </span>
                          <span className="text-xs font-bold text-primary italic">
                            {" "}
                            {event.bullName}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-muted/30 border-t shrink-0">
          <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tight">
            Consulte a ficha completa do animal para detalhes técnicos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
